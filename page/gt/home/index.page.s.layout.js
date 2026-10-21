import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 390, height: DEVICE_HEIGHT = 450 } = getDeviceInfo();

export const NOTICE_TEXT_STYLE = {
  x: px(20),
  y: px(15),
  w: DEVICE_WIDTH - px(40),
  h: px(35),
  color: 0xa0a0a0,
  text_size: px(16),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Stepper
export const STEPPER_MINUS_STYLE = {
  x: px(50),
  y: px(52),
  w: px(46),
  h: px(46),
  radius: px(23),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(24),
  text: "-",
};

export const STEPPER_VALUE_STYLE = {
  x: px(105),
  y: px(52),
  w: px(180),
  h: px(46),
  color: 0xffffff,
  text_size: px(28),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const STEPPER_PLUS_STYLE = {
  x: px(294),
  y: px(52),
  w: px(46),
  h: px(46),
  radius: px(23),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(24),
  text: "+",
};

// Preset Chips
export const CHIP_ROW_Y = px(106);
export const CHIP_H = px(34);
export const CHIP_W = px(64);
export const CHIP_RADIUS = px(17);
export const CHIP_TEXT_SIZE = px(16);

export const CHIP_15_STYLE = {
  x: px(49),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "15m",
};

export const CHIP_20_STYLE = {
  x: px(121),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "20m",
};

export const CHIP_30_STYLE = {
  x: px(193),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "30m",
};

export const CHIP_45_STYLE = {
  x: px(265),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "45m",
};

// Nap Summary Info
export const NAP_TEXT_STYLE = {
  x: px(20),
  y: px(148),
  w: DEVICE_WIDTH - px(40),
  h: px(82),
  color: 0x00e676,
  text_size: px(18),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Primary CTA
export const BTN_STYLE = {
  x: px(45),
  y: px(238),
  w: DEVICE_WIDTH - px(90),
  h: px(50),
  radius: px(25),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(20),
  text: "Iniciar Soneca",
};

// Bottom Row Buttons
export const NAP_BTN_STYLE = {
  x: px(45),
  y: px(296),
  w: px(140),
  h: px(44),
  radius: px(22),
  normal_color: 0x6c5ce7,
  press_color: 0xa29bfe,
  text_size: px(17),
  text: "Ler Soneca",
};

export const ALARM_BTN_STYLE = {
  x: px(205),
  y: px(296),
  w: px(140),
  h: px(44),
  radius: px(22),
  normal_color: 0xd63031,
  press_color: 0xff7675,
  text_size: px(17),
  text: "Testar Alarme",
};
