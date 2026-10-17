import * as hmUI from "@zos/ui";
import { start } from "@zos/app-service";
import { requestPermission } from "@zos/app";
import { log as Logger } from "@zos/utils";
import { NOTICE_TEXT_STYLE, BTN_STYLE } from "zosLoader:./index.page.[pf].layout.js";

const logger = Logger.getLogger("smartwake-page");

Page({
  build() {
    logger.debug("page build invoked");

    const noticeWidget = hmUI.createWidget(hmUI.widget.TEXT, {
      ...NOTICE_TEXT_STYLE,
      text: "A iniciar serviço...",
    });

    const updateStatusText = (text) => {
      logger.debug("updateStatusText:", text);
      noticeWidget.setProperty(hmUI.prop.MORE, { text });
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

    hmUI.createWidget(hmUI.widget.BUTTON, {
      ...BTN_STYLE,
      click_func: () => {
        updateStatusText("A iniciar serviço...");
        startBackgroundService();
      },
    });

    // Inicia imediatamente na inicialização da página
    startBackgroundService();
  },
});
