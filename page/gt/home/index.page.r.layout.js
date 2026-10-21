import * as hmUI from "@zos/ui";
import { getDeviceInfo } from "@zos/device";
import { px } from "@zos/utils";

export const { width: DEVICE_WIDTH = 480, height: DEVICE_HEIGHT = 480 } = getDeviceInfo();

// Status / Notificação no Topo
export const NOTICE_TEXT_STYLE = {
  x: px(60),
  y: px(45),
  w: DEVICE_WIDTH - px(120),
  h: px(35),
  color: 0xa0a0a0,
  text_size: px(18),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Stepper Central
export const STEPPER_MINUS_STYLE = {
  x: px(95),
  y: px(95),
  w: px(52),
  h: px(52),
  radius: px(26),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(28),
  text: "-",
};

export const STEPPER_VALUE_STYLE = {
  x: px(155),
  y: px(95),
  w: px(170),
  h: px(52),
  color: 0xffffff,
  text_size: px(34),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.NONE,
};

export const STEPPER_PLUS_STYLE = {
  x: px(333),
  y: px(95),
  w: px(52),
  h: px(52),
  radius: px(26),
  normal_color: 0x2d3436,
  press_color: 0x636e72,
  text_size: px(28),
  text: "+",
};

// Preset Chips (15m, 20m, 30m, 45m)
export const CHIP_ROW_Y = px(165);
export const CHIP_H = px(40);
export const CHIP_W = px(68);
export const CHIP_RADIUS = px(20);
export const CHIP_TEXT_SIZE = px(18);

export const CHIP_15_STYLE = {
  x: px(92),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "15m",
};

export const CHIP_20_STYLE = {
  x: px(168),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "20m",
};

export const CHIP_30_STYLE = {
  x: px(244),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "30m",
};

export const CHIP_45_STYLE = {
  x: px(320),
  y: CHIP_ROW_Y,
  w: CHIP_W,
  h: CHIP_H,
  radius: CHIP_RADIUS,
  text_size: CHIP_TEXT_SIZE,
  text: "45m",
};

// Painel Informativo da Soneca
export const NAP_TEXT_STYLE = {
  x: px(50),
  y: px(220),
  w: DEVICE_WIDTH - px(100),
  h: px(75),
  color: 0x00e676,
  text_size: px(19),
  align_h: hmUI.align.CENTER_H,
  align_v: hmUI.align.CENTER_V,
  text_style: hmUI.text_style.WRAP,
};

// Botão Principal de Iniciar
export const BTN_STYLE = {
  x: px(75),
  y: px(310),
  w: DEVICE_WIDTH - px(150), // 330
  h: px(56),
  radius: px(28),
  normal_color: 0x0984e3,
  press_color: 0x74b9ff,
  text_size: px(22),
  text: "Iniciar Soneca",
};

// Botões Secundários Lado a Lado
export const NAP_BTN_STYLE = {
  x: px(90),
  y: px(380),
  w: px(142),
  h: px(50),
  radius: px(25),
  normal_color: 0x6c5ce7,
  press_color: 0xa29bfe,
  text_size: px(18),
  text: "Ler Soneca",
};

export const ALARM_BTN_STYLE = {
  x: px(248),
  y: px(380),
  w: px(142),
  h: px(50),
  radius: px(25),
  normal_color: 0xd63031,
  press_color: 0xff7675,
  text_size: px(18),
  text: "Testar Alarme",
};
