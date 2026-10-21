import * as hmUI from "@zos/ui";
import { start } from "@zos/app-service";
import { requestPermission, queryPermission } from "@zos/app";
import { onDigitalCrown, offDigitalCrown, showToast } from "@zos/interaction";
import { Sleep } from "@zos/sensor";
import { LocalStorage } from "@zos/storage";
import { log as Logger } from "@zos/utils";
import {
  startAlarm,
  stopAlarm,
  isAlarmActive,
  pulseTick,
} from "../../../shared/alarm_engine";
import {
  NOTICE_TEXT_STYLE,
  STEPPER_MINUS_STYLE,
  STEPPER_VALUE_STYLE,
  STEPPER_PLUS_STYLE,
  CHIP_15_STYLE,
  CHIP_20_STYLE,
  CHIP_30_STYLE,
  CHIP_45_STYLE,
  NAP_TEXT_STYLE,
  BTN_STYLE,
  NAP_BTN_STYLE,
  ALARM_BTN_STYLE,
} from "zosLoader:./index.page.[pf].layout.js";

const logger = Logger.getLogger("smartwake-page");

Page({
  build() {
    logger.debug("page build invoked");

    try {
      if (typeof hmUI.setStatusBarVisible === "function") {
        hmUI.setStatusBarVisible(false);
      }
    } catch (sbErr) {
      logger.warn("setStatusBarVisible failed:", sbErr);
    }

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

    const getSavedTargetMinutes = () => {
      try {
        const localStorage = new LocalStorage();
        const saved = localStorage.getItem("target_nap_minutes");
        if (saved && !isNaN(parseInt(saved, 10))) {
          return parseInt(saved, 10);
        }
      } catch (e) {
        logger.error("Error reading target_nap_minutes:", e);
      }
      return 20; // padrão 20 minutos
    };

    let targetDuration = getSavedTargetMinutes();

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

    // 1. Notice Widget (Topo)
    const noticeWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      ...NOTICE_TEXT_STYLE,
      text: "Selecione o tempo da soneca",
    });

    const updateStatusText = (text) => {
      logger.debug("updateStatusText:", text);
      noticeWidget.setProperty(hmUI.prop.MORE, { text });
    };

    // 2. Stepper Controls ([-] 20 min [+])
    const stepperMinusWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...STEPPER_MINUS_STYLE,
      click_func: () => {
        setDuration(targetDuration - 5, "tap");
      },
    });

    const stepperValueWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      ...STEPPER_VALUE_STYLE,
      text: `${targetDuration} min`,
    });

    const stepperPlusWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...STEPPER_PLUS_STYLE,
      click_func: () => {
        setDuration(targetDuration + 5, "tap");
      },
    });

    // 3. Preset Chips (15m, 20m, 30m, 45m)
    const chipWidgets = {};

    const createChip = (style, minutes) => {
      const isSelected = targetDuration === minutes;
      const chip = hmUI.createWidget(hmUI.widget.BUTTON, {
        ...style,
        normal_color: isSelected ? 0x0984e3 : 0x2d3436,
        press_color: isSelected ? 0x74b9ff : 0x636e72,
        click_func: () => {
          setDuration(minutes, "chip");
        },
      });
      chipWidgets[minutes] = chip;
    };

    createChip(CHIP_15_STYLE, 15);
    createChip(CHIP_20_STYLE, 20);
    createChip(CHIP_30_STYLE, 30);
    createChip(CHIP_45_STYLE, 45);

    const updateChipsHighlight = (val) => {
      [15, 20, 30, 45].forEach((p) => {
        const w = chipWidgets[p];
        if (w) {
          const isSelected = p === val;
          w.setProperty(hmUI.prop.MORE, {
            normal_color: isSelected ? 0x0984e3 : 0x2d3436,
            press_color: isSelected ? 0x74b9ff : 0x636e72,
          });
        }
      });
    };

    // 4. Nap Summary Widget (Meio)
    const savedNap = getSavedNap();
    let initialNapText = "Toque em 'Ler Soneca'";
    if (savedNap) {
      initialNapText = formatNapText(savedNap, "", "[Histórico Salvo]");
    }

    const napWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      ...NAP_TEXT_STYLE,
      text: initialNapText,
    });

    const updateNapText = (text) => {
      logger.debug("updateNapText:", text);
      napWidget.setProperty(hmUI.prop.MORE, { text });
    };

    // 5. Botão Iniciar Soneca (Primary CTA)
    let startBtnWidget = null;

    const updateStartBtnText = () => {
      if (startBtnWidget) {
        startBtnWidget.setProperty(hmUI.prop.MORE, {
          text: `Iniciar Soneca (${targetDuration}m)`,
        });
      }
    };

    // Função central de alteração de duração
    const setDuration = (newVal, source = "tap") => {
      const clamped = Math.max(5, Math.min(120, newVal));
      if (clamped === targetDuration && source === "tap") return;

      targetDuration = clamped;
      logger.debug(`setDuration: ${targetDuration} min (source: ${source})`);

      try {
        const storage = new LocalStorage();
        storage.setItem("target_nap_minutes", targetDuration);
      } catch (sErr) {
        logger.error("Failed to save target_nap_minutes:", sErr);
      }

      stepperValueWidget.setProperty(hmUI.prop.MORE, {
        text: `${targetDuration} min`,
      });

      updateStartBtnText();
      updateChipsHighlight(targetDuration);
      pulseTick();

      if (source === "crown" || source === "chip") {
        try {
          showToast({ content: `Soneca: ${targetDuration} min` });
        } catch (tErr) {}
      }
    };

    // 6. Integração com Coroa Digital (@zos/interaction)
    try {
      onDigitalCrown({
        callback: (key, degree) => {
          logger.debug(`Digital crown rotated: ${degree}`);
          if (degree > 0) {
            setDuration(targetDuration + 5, "crown");
          } else if (degree < 0) {
            setDuration(targetDuration - 5, "crown");
          }
        },
      });
    } catch (cErr) {
      logger.warn("onDigitalCrown registration failed:", cErr);
    }

    // 7. Controle do Alarme
    let alarmBtnWidget = null;

    const updateAlarmBtn = (isActive, label = null) => {
      if (!alarmBtnWidget) return;
      const text = label || (isActive ? "Parar" : "Testar");
      const normal_color = isActive ? 0xe74c3c : ALARM_BTN_STYLE.normal_color;
      const press_color = isActive ? 0xc0392b : ALARM_BTN_STYLE.press_color;
      alarmBtnWidget.setProperty(hmUI.prop.MORE, {
        text,
        normal_color,
        press_color,
      });
    };

    const toggleAlarm = () => {
      if (isAlarmActive()) {
        logger.log("Parando alarme manualmente...");
        stopAlarm("user_dismiss");
        updateAlarmBtn(false);
        updateStatusText("Alarme parado.");
      } else {
        logger.log("Iniciando teste de alarme progressivo...");
        updateAlarmBtn(true, "Parar");
        updateStatusText("Estágio 1: Suave...");

        startAlarm({
          onStageChange: ({ stage, name, desc }) => {
            logger.debug(`Alarm stage changed: ${stage} - ${name}`);
            updateStatusText(`Estágio ${stage}: ${name}`);
          },
          onFinish: (reason) => {
            logger.debug(`Alarm finished, reason: ${reason}`);
            updateAlarmBtn(false);
            if (reason === "safety_timeout") {
              updateStatusText("Alarme finalizado (limite).");
            } else if (reason === "user_dismiss") {
              updateStatusText("Alarme parado pelo usuário.");
            } else {
              updateStatusText("Alarme finalizado.");
            }
          },
        });
      }
    };

    // 8. Iniciar Serviço em Background com a Duração Configurada
    const startBackgroundService = () => {
      logger.debug(`Starting background service com alvo: ${targetDuration} min...`);
      updateStatusText(`Iniciando serviço (${targetDuration}m)...`);

      try {
        const storage = new LocalStorage();
        storage.setItem("target_nap_minutes", targetDuration);
      } catch (e) {}

      try {
        const ret = start({
          file: "app-service/smart_wake",
          param: String(targetDuration),
          complete_func: (info) => {
            logger.debug("app-service complete_func:", info);
            if (info && info.result) {
              updateStatusText(`Soneca ativa: ${targetDuration}m. Pode apagar o ecrã.`);
            } else {
              updateStatusText("Falha ao iniciar o serviço.");
            }
          },
        });

        logger.debug("start() returned:", ret);
        if (ret === 0) {
          updateStatusText(`Soneca ativa: ${targetDuration}m. Pode apagar o ecrã.`);
        } else if (ret === 2) {
          updateStatusText(`Serviço em execução (${targetDuration}m).`);
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
          updateStatusText(`Erro serviço (código ${ret})`);
        }
      } catch (e) {
        logger.error("start() threw exception:", e);
        updateStatusText("Exceção ao iniciar serviço.");
      }
    };

    // 9. Leitura do Sensor Sleep
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

    // Criação dos botões inferiores
    startBtnWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...BTN_STYLE,
      text: `Iniciar Soneca (${targetDuration}m)`,
      click_func: () => {
        startBackgroundService();
      },
    });

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...NAP_BTN_STYLE,
      click_func: () => {
        readNapWithPermission();
      },
    });

    alarmBtnWidget = hmUI.createWidget(hmUI.widget.BUTTON, {
      ...ALARM_BTN_STYLE,
      click_func: () => {
        toggleAlarm();
      },
    });
  },

  onDestroy() {
    logger.debug("page onDestroy invoked");
    try {
      offDigitalCrown();
    } catch (e) {}

    if (isAlarmActive()) {
      stopAlarm("page_exit");
    }
  },
});
