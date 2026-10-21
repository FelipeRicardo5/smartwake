import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 480, height: DEVICE_HEIGHT = 480 } = getDeviceInfo();

export const NOTICE_TEXT_STYLE = {
  x: px(60),
  y: px(20),
  w: DEVICE_WIDTH - px(120),
  h: px(35),
  color: 0xa0a0a0,
  text_size: px(16),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Stepper
export const STEPPER_MINUS_STYLE = {
  x: px(95),
  y: px(58),
  w: px(48),
  h: px(48),
  radius: px(24),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(26),
  text: "-",
};

export const STEPPER_VALUE_STYLE = {
  x: px(150),
  y: px(58),
  w: px(180),
  h: px(48),
  color: 0xffffff,
  text_size: px(30),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const STEPPER_PLUS_STYLE = {
  x: px(337),
  y: px(58),
  w: px(48),
  h: px(48),
  radius: px(24),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(26),
  text: "+",
};

// Preset Chips (4 buttons in row)
export const CHIP_ROW_Y = px(116);
export const CHIP_H = px(36);
export const CHIP_W = px(68);
export const CHIP_RADIUS = px(18);
export const CHIP_TEXT_SIZE = px(17);

export const CHIP_15_STYLE = {
  x: px(88),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "15m",
};

export const CHIP_20_STYLE = {
  x: px(164),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "20m",
};

export const CHIP_30_STYLE = {
  x: px(240),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "30m",
};

export const CHIP_45_STYLE = {
  x: px(316),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "45m",
};

// Nap Summary Info
export const NAP_TEXT_STYLE = {
  x: px(50),
  y: px(162),
  w: DEVICE_WIDTH - px(100),
  h: px(88),
  color: 0x00e676,
  text_size: px(18),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Primary CTA
export const BTN_STYLE = {
  x: px(85),
  y: px(260),
  w: DEVICE_WIDTH - px(170), // 310
  h: px(52),
  radius: px(26),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(22),
  text: "Iniciar Soneca",
};

// Bottom Row Buttons
export const NAP_BTN_STYLE = {
  x: px(95),
  y: px(322),
  w: px(140),
  h: px(46),
  radius: px(23),
  normal_color: 0x6c5ce7,
  press_color: 0xa29bfe,
  text_size: px(18),
  text: "Ler Soneca",
};

export const ALARM_BTN_STYLE = {
  x: px(245),
  y: px(322),
  w: px(140),
  h: px(46),
  radius: px(23),
  normal_color: 0xd63031,
  press_color: 0xff7675,
  text_size: px(18),
  text: "Testar Alarme",
};
