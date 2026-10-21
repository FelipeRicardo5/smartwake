import {
  Vibrator,
  VIBRATOR_SCENE_DURATION,
  VIBRATOR_SCENE_STRONG_REMINDER,
  VIBRATOR_SCENE_TIMER
} from '@zos/sensor'
import { log as Logger } from '@zos/utils'

const logger = Logger.getLogger('smartwake-alarm')

let vibratorInstance = null

function getVibrator() {
  if (!vibratorInstance) {
    try {
      vibratorInstance = new Vibrator()
    } catch (e) {
      logger.error('Failed to instantiate Vibrator:', e)
    }
  }
  return vibratorInstance
}

let isAlarmRunning = false
let currentStage = 0
let stageTimer = null
let pulseInterval = null
let safetyTimer = null
let activeListeners = {
  onStageChange: null,
  onFinish: null
}

function clearAllTimers() {
  if (pulseInterval) {
    clearInterval(pulseInterval)
    pulseInterval = null
  }
  if (stageTimer) {
    clearTimeout(stageTimer)
    stageTimer = null
  }
  if (safetyTimer) {
    clearTimeout(safetyTimer)
    safetyTimer = null
  }
}

function pulse(mode) {
  const vib = getVibrator()
  if (!vib) return
  try {
    vib.setMode(mode)
    vib.start({ mode })
  } catch (err) {
    logger.error('Error during vibrator pulse:', err)
  }
}

function notifyStage(stage, name, desc) {
  currentStage = stage
  logger.log(`[alarm_engine] Stage ${stage}: ${name} (${desc})`)
  if (typeof activeListeners.onStageChange === 'function') {
    try {
      activeListeners.onStageChange({ stage, name, desc })
    } catch (cbErr) {
      logger.error('Error in onStageChange callback:', cbErr)
    }
  }
}

export function isAlarmActive() {
  return isAlarmRunning
}

export function getCurrentStage() {
  return currentStage
}

export function stopAlarm(reason = 'user_dismiss') {
  if (!isAlarmRunning) return
  logger.log(`[alarm_engine] stopAlarm invoked, reason: ${reason}`)

  clearAllTimers()

  const vib = getVibrator()
  if (vib) {
    try {
      vib.stop()
    } catch (sErr) {
      logger.error('Error stopping vibrator:', sErr)
    }
  }

  isAlarmRunning = false
  currentStage = 0

  if (typeof activeListeners.onFinish === 'function') {
    try {
      activeListeners.onFinish(reason)
    } catch (fErr) {
      logger.error('Error in onFinish callback:', fErr)
    }
  }
  activeListeners.onStageChange = null
  activeListeners.onFinish = null
}

export function startAlarm({ onStageChange, onFinish } = {}) {
  if (isAlarmRunning) {
    logger.warn('[alarm_engine] Alarm already running, ignoring start request')
    return false
  }

  logger.log('[alarm_engine] startAlarm initiated')
  isAlarmRunning = true
  activeListeners.onStageChange = onStageChange || null
  activeListeners.onFinish = onFinish || null

  // 1. Estágio 1: Despertar Suave (Pulsos espaçados de 600ms por 15s)
  notifyStage(1, 'Despertar Suave', 'Pulsos leves espaçados')
  pulse(VIBRATOR_SCENE_DURATION)
  pulseInterval = setInterval(() => {
    if (!isAlarmRunning || currentStage !== 1) return
    pulse(VIBRATOR_SCENE_DURATION)
  }, 2500)

  // Transição para Estágio 2 após 15 segundos
  stageTimer = setTimeout(() => {
    if (!isAlarmRunning) return
    clearAllTimers()

    // 2. Estágio 2: Alerta Moderado (Padrão 1200ms mais frequente por 15s)
    notifyStage(2, 'Alerta Moderado', 'Pulsos firmes e frequentes')
    pulse(VIBRATOR_SCENE_STRONG_REMINDER)
    pulseInterval = setInterval(() => {
      if (!isAlarmRunning || currentStage !== 2) return
      pulse(VIBRATOR_SCENE_STRONG_REMINDER)
    }, 2000)

    // Transição para Estágio 3 após mais 15 segundos (30s total)
    stageTimer = setTimeout(() => {
      if (!isAlarmRunning) return
      clearAllTimers()

      // 3. Estágio 3: Alarme Contínuo (Modo Timer contínuo)
      notifyStage(3, 'Alarme Contínuo', 'Vibração contínua persistente')
      pulse(VIBRATOR_SCENE_TIMER)

      // Trava de segurança: Desligamento automático após 60s total de alarme
      safetyTimer = setTimeout(() => {
        if (isAlarmRunning) {
          logger.warn('[alarm_engine] Limite de 60s atingido. Desligando alarme por segurança.')
          stopAlarm('safety_timeout')
        }
      }, 30000)
    }, 15000)
  }, 15000)

  return true
}
