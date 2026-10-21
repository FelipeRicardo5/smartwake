import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 390, height: DEVICE_HEIGHT = 450 } = getDeviceInfo();

// Status / Notificação no Topo
export const NOTICE_TEXT_STYLE = {
  x: px(20),
  y: px(30),
  w: DEVICE_WIDTH - px(40),
  h: px(35),
  color: 0xa0a0a0,
  text_size: px(17),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Stepper Central
export const STEPPER_MINUS_STYLE = {
  x: px(55),
  y: px(75),
  w: px(48),
  h: px(48),
  radius: px(24),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(26),
  text: "-",
};

export const STEPPER_VALUE_STYLE = {
  x: px(110),
  y: px(75),
  w: px(170),
  h: px(48),
  color: 0xffffff,
  text_size: px(30),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const STEPPER_PLUS_STYLE = {
  x: px(287),
  y: px(75),
  w: px(48),
  h: px(48),
  radius: px(24),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(26),
  text: "+",
};

// Preset Chips (15m, 20m, 30m, 45m)
export const CHIP_ROW_Y = px(138);
export const CHIP_H = px(38);
export const CHIP_W = px(64);
export const CHIP_RADIUS = px(19);
export const CHIP_TEXT_SIZE = px(17);

export const CHIP_15_STYLE = {
  x: px(55),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "15m",
};

export const CHIP_20_STYLE = {
  x: px(127),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "20m",
};

export const CHIP_30_STYLE = {
  x: px(199),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "30m",
};

export const CHIP_45_STYLE = {
  x: px(271),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "45m",
};

// Painel Informativo da Soneca
export const NAP_TEXT_STYLE = {
  x: px(20),
  y: px(190),
  w: DEVICE_WIDTH - px(40),
  h: px(70),
  color: 0x00e676,
  text_size: px(18),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Botão Principal de Iniciar
export const BTN_STYLE = {
  x: px(45),
  y: px(275),
  w: DEVICE_WIDTH - px(90),
  h: px(52),
  radius: px(26),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(22),
  text: "Iniciar Soneca",
};

// Botões Secundários Lado a Lado
export const NAP_BTN_STYLE = {
  x: px(45),
  y: px(345),
  w: px(144),
  h: px(48),
  radius: px(24),
  normal_color: 0x6c5ce7,
  press_color: 0xa29bfe,
  text_size: px(18),
  text: "Ler Soneca",
};

export const ALARM_BTN_STYLE = {
  x: px(201),
  y: px(345),
  w: px(144),
  h: px(48),
  radius: px(24),
  normal_color: 0xd63031,
  press_color: 0xff7675,
  text_size: px(18),
  text: "Testar Alarme",
};
