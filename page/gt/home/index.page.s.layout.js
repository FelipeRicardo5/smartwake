import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 390, height: DEVICE_HEIGHT = 450 } = getDeviceInfo();

export const NOTICE_TEXT_STYLE = {
  x: px(20),
  y: px(110),
  w: DEVICE_WIDTH - px(40),
  h: px(150),
  color: 0xffffff,
  text_size: px(28),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const BTN_STYLE = {
  x: px(30),
  y: DEVICE_HEIGHT - px(130),
  w: DEVICE_WIDTH - px(60),
  h: px(65),
  radius: px(32),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(24),
  text: "Iniciar Serviço",
};
