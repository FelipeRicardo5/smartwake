import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 480, height: DEVICE_HEIGHT = 480 } = getDeviceInfo();

export const NOTICE_TEXT_STYLE = {
  x: px(50),
  y: px(45),
  w: DEVICE_WIDTH - px(100),
  h: px(60),
  color: 0xa0a0a0,
  text_size: px(20),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const NAP_TEXT_STYLE = {
  x: px(40),
  y: px(110),
  w: DEVICE_WIDTH - px(80),
  h: px(170),
  color: 0x00e676,
  text_size: px(22),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const BTN_STYLE = {
  x: px(90),
  y: px(295),
  w: DEVICE_WIDTH - px(180),
  h: px(55),
  radius: px(28),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(22),
  text: "Iniciar Serviço",
};

export const NAP_BTN_STYLE = {
  x: px(90),
  y: px(365),
  w: DEVICE_WIDTH - px(180),
  h: px(55),
  radius: px(28),
  normal_color: 0x6c5ce7,
  press_color: 0xa29bfe,
  text_size: px(22),
  text: "Ler Soneca",
};
