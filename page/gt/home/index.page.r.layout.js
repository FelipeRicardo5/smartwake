import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 480, height: DEVICE_HEIGHT = 480 } = getDeviceInfo();

export const NOTICE_TEXT_STYLE = {
  x: px(30),
  y: px(130),
  w: DEVICE_WIDTH - px(60),
  h: px(160),
  color: 0xffffff,
  text_size: px(30),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const BTN_STYLE = {
  x: px(40),
  y: DEVICE_HEIGHT - px(150),
  w: DEVICE_WIDTH - px(80),
  h: px(70),
  radius: px(35),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(26),
  text: "Iniciar Serviço",
};
