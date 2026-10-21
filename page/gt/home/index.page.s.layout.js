import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 390, height: DEVICE_HEIGHT = 450 } = getDeviceInfo();

export const NOTICE_TEXT_STYLE = {
  x: px(20),
  y: px(25),
  w: DEVICE_WIDTH - px(40),
  h: px(60),
  color: 0xa0a0a0,
  text_size: px(20),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const NAP_TEXT_STYLE = {
  x: px(20),
  y: px(90),
  w: DEVICE_WIDTH - px(40),
  h: px(165),
  color: 0x00e676,
  text_size: px(22),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const BTN_STYLE = {
  x: px(45),
  y: px(270),
  w: DEVICE_WIDTH - px(90),
  h: px(58),
  radius: px(29),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(22),
  text: "Iniciar Serviço",
};

export const NAP_BTN_STYLE = {
  x: px(45),
  y: px(345),
  w: DEVICE_WIDTH - px(90),
  h: px(58),
  radius: px(29),
  normal_color: 0x6c5ce7,
  press_color: 0xa29bfe,
  text_size: px(22),
  text: "Ler Soneca",
};
