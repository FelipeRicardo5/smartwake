import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 480, height: DEVICE_HEIGHT = 480 } = getDeviceInfo();

export const NOTICE_TEXT_STYLE = {
  x: px(60),
  y: px(30),
  w: DEVICE_WIDTH - px(120),
  h: px(45),
  color: 0xa0a0a0,
  text_size: px(18),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const NAP_TEXT_STYLE = {
  x: px(40),
  y: px(80),
  w: DEVICE_WIDTH - px(80),
  h: px(145),
  color: 0x00e676,
  text_size: px(21),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

export const BTN_STYLE = {
  x: px(90),
  y: px(235),
  w: DEVICE_WIDTH - px(180),
  h: px(48),
  radius: px(24),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(20),
  text: "Iniciar Serviço",
};

export const NAP_BTN_STYLE = {
  x: px(90),
  y: px(295),
  w: DEVICE_WIDTH - px(180),
  h: px(48),
  radius: px(24),
  normal_color: 0x6c5ce7,
  press_color: 0xa29bfe,
  text_size: px(20),
  text: "Ler Soneca",
};

export const ALARM_BTN_STYLE = {
  x: px(90),
  y: px(355),
  w: DEVICE_WIDTH - px(180),
  h: px(48),
  radius: px(24),
  normal_color: 0xd63031,
  press_color: 0xff7675,
  text_size: px(20),
  text: "Testar Alarme",
};
