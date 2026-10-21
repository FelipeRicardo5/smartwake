import * as hmUI from "@zos/ui";
import { start } from "@zos/app-service";
import { requestPermission, queryPermission } from "@zos/app";
import { Sleep } from "@zos/sensor";
import { LocalStorage } from "@zos/storage";
import { log as Logger } from "@zos/utils";
import {
  NOTICE_TEXT_STYLE,
  NAP_TEXT_STYLE,
  BTN_STYLE,
  NAP_BTN_STYLE,
} from "zosLoader:./index.page.[pf].layout.js";

const logger = Logger.getLogger("smartwake-page");

Page({
  build() {
    logger.debug("page build invoked");

    const formatMinutesToTime = (min) => {
      if (typeof min !== "number" || isNaN(min)) return String(min);
      const h = Math.floor(min / 60) % 24;
      const m = min % 60;
      const hh = h < 10 ? `0${h}` : `${h}`;
      const mm = m < 10 ? `0${m}` : `${m}`;
      return `${hh}:${mm}`;
    };

    const formatNapText = (nap, statusInfo = "", prefix = "Soneca") => {
      if (!nap) return "";
      const { length, start, stop } = nap;
      const lines = [];
      if (statusInfo) lines.push(statusInfo);
      lines.push(`${prefix}: ${length} min`);
      lines.push(`Início: ${formatMinutesToTime(start)} (${start}m)`);
      lines.push(`Fim: ${formatMinutesToTime(stop)} (${stop}m)`);
      return lines.join("\n");
    };

    const getSavedNap = () => {
      try {
        const localStorage = new LocalStorage();
        const raw = localStorage.getItem("last_nap");
        if (raw) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          return parsed;
        }
      } catch (err) {
        logger.error("Error reading last_nap from LocalStorage:", err);
      }
      return null;
    };

    const noticeWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      ...NOTICE_TEXT_STYLE,
      text: "A iniciar serviço...",
    });

    const savedNap = getSavedNap();
    let initialNapText = "Toque em 'Ler Soneca'";
    if (savedNap) {
      initialNapText = formatNapText(savedNap, "", "[Histórico Salvo]");
    }

    const napWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      ...NAP_TEXT_STYLE,
      text: initialNapText,
    });

    const updateStatusText = (text) => {
      logger.debug("updateStatusText:", text);
      noticeWidget.setProperty(hmUI.prop.MORE, { text });
    };

    const updateNapText = (text) => {
      logger.debug("updateNapText:", text);
      napWidget.setProperty(hmUI.prop.MORE, { text });
    };

    const startBackgroundService = () => {
      logger.debug("Starting background service app-service/smart_wake...");
      try {
        const ret = start({
          file: "app-service/smart_wake",
          complete_func: (info) => {
            logger.debug("app-service complete_func:", info);
            if (info && info.result) {
              updateStatusText("Serviço Iniciado. Pode apagar o ecrã.");
            } else {
              updateStatusText("Falha ao iniciar o serviço.");
            }
          },
        });

        logger.debug("start() returned:", ret);
        if (ret === 0) {
          updateStatusText("Serviço Iniciado. Pode apagar o ecrã.");
        } else if (ret === 2) {
          updateStatusText("Serviço já em execução. Pode apagar o ecrã.");
        } else if (ret === 3) {
          logger.warn("start() returned No Permission (code 3), requesting dynamically...");
          updateStatusText("A solicitar permissão...");
          try {
            requestPermission({
              permissions: ["device:os.bg_service"],
              callback: (res) => {
                logger.debug("requestPermission callback received:", res);
                startBackgroundService();
              },
            });
          } catch (pErr) {
            logger.error("requestPermission exception:", pErr);
          }
        } else if (ret !== undefined && ret !== 0) {
          logger.warn("start() returned error code:", ret);
          updateStatusText(`Erro ao iniciar serviço (código ${ret})`);
        }
      } catch (e) {
        logger.error("start() threw exception:", e);
        updateStatusText("Exceção ao iniciar serviço.");
      }
    };

    const readNap = () => {
      logger.debug("readNap invoked");
      try {
        const sleep = new Sleep();
        if (typeof sleep.updateInfo === "function") {
          sleep.updateInfo();
        }

        let statusStr = "Status: ?";
        if (typeof sleep.getSleepingStatus === "function") {
          const s = sleep.getSleepingStatus();
          statusStr = s === 1 ? "Status: Dormindo (1)" : s === 0 ? "Status: Acordado (0)" : `Status: ${s}`;
        }
        logger.debug("sleepingStatus:", statusStr);

        const napData = sleep.getNap();
        logger.debug("sleep.getNap() raw return:", napData);

        if (!napData || !Array.isArray(napData) || napData.length === 0) {
          const cached = getSavedNap();
          if (cached) {
            updateNapText(formatNapText(cached, `${statusStr} (Sem nova sesta)`, "[Último Salvo]"));
          } else {
            updateNapText(`${statusStr}\nNenhuma soneca hoje`);
          }
          return;
        }

        const lastNap = napData[napData.length - 1];
        logger.debug("lastNap data:", lastNap);

        const resultText = formatNapText(lastNap, statusStr, "Soneca");
        updateNapText(resultText);

        try {
          const localStorage = new LocalStorage();
          localStorage.setItem("last_nap", JSON.stringify(lastNap));
          logger.debug("Persisted last_nap to LocalStorage:", lastNap);
        } catch (sErr) {
          logger.error("LocalStorage setItem failed:", sErr);
        }
      } catch (err) {
        logger.error("readNap exception:", err);
        const cached = getSavedNap();
        if (cached) {
          updateNapText(`Erro leitura: ${err && err.message ? err.message : err}\n${formatNapText(cached, "", "[Último Salvo]")}`);
        } else {
          updateNapText(`Erro ao ler soneca: ${err && err.message ? err.message : err}`);
        }
      }
    };

    const readNapWithPermission = () => {
      try {
        if (typeof queryPermission === "function" && typeof requestPermission === "function") {
          const permRes = queryPermission({ permissions: ["data:user.hd.sleep"] });
          logger.debug("queryPermission for data:user.hd.sleep:", permRes);
          if (permRes && permRes[0] === 0) {
            logger.info("Requesting data:user.hd.sleep dynamically...");
            requestPermission({
              permissions: ["data:user.hd.sleep"],
              callback: (res) => {
                logger.debug("requestPermission callback for sleep:", res);
                readNap();
              },
            });
            return;
          }
        }
      } catch (pErr) {
        logger.warn("Permission check failed:", pErr);
      }
      readNap();
    };

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...BTN_STYLE,
      click_func: () => {
        updateStatusText("A iniciar serviço...");
        startBackgroundService();
      },
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...NAP_BTN_STYLE,
      click_func: () => {
        readNapWithPermission();
      },
    });

    // Inicia imediatamente na inicialização da página
    startBackgroundService();
  },
});
