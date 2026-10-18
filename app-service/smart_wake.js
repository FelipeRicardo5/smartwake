import * as appServiceMgr from '@zos/app-service'
import { log } from '@zos/utils'
import { Time, Vibrator, VIBRATOR_SCENE_TIMER } from '@zos/sensor'
import * as ble from '@zos/ble'
import { getPackageInfo } from '@zos/app'
import { MessageBuilder } from '../shared/message'

const logger = log.getLogger('smartwake-service')

// Singletons no escopo raiz do módulo
const timeSensor = new Time()
let vibrator = null

try {
  vibrator = new Vibrator()
} catch (err) {
  logger.error('Failed to instantiate Vibrator at top level:', err)
}

const packageInfo = getPackageInfo ? getPackageInfo() : null
const appId = packageInfo ? packageInfo.appId : 22062
let messageBuilder = null

try {
  messageBuilder = new MessageBuilder({
    appId,
    appDevicePort: 20,
    appSidePort: 0,
    ble
  })
} catch (mbErr) {
  logger.error('Failed to instantiate MessageBuilder at top level:', mbErr)
}

let minuteCount = 0
let wakeTriggered = false

AppService({
  exit() {
    logger.log('AppService.exit() invoked')
    appServiceMgr.exit()
  },

  onInit(e) {
    logger.log(`Background service initialized with params: ${e}`)
    minuteCount = 0
    wakeTriggered = false

    if (!vibrator) {
      try {
        vibrator = new Vibrator()
      } catch (err) {
        logger.error('Failed to instantiate Vibrator in onInit:', err)
      }
    }

    if (messageBuilder) {
      try {
        messageBuilder.connect()
        logger.log('[smart_wake] messageBuilder.connect() iniciado com sucesso')
      } catch (cErr) {
        logger.error('[smart_wake] Erro ao conectar messageBuilder:', cErr)
      }
    }

    logger.log(`Registering timeSensor.onPerMinute listener... Current time: ${timeSensor.getHours()}:${timeSensor.getMinutes()}:${timeSensor.getSeconds()}`)

    timeSensor.onPerMinute(() => {
      minuteCount += 1
      logger.log(`[smart_wake] onPerMinute tick: ${minuteCount}/3 | Time: ${timeSensor.getHours()}:${timeSensor.getMinutes()}:${timeSensor.getSeconds()}`)

      if (minuteCount >= 3 && !wakeTriggered) {
        wakeTriggered = true
        logger.log('[smart_wake] Minuto 3 atingido: acionando motor háptico (VIBRATOR_SCENE_TIMER)...')
        try {
          if (vibrator) {
            vibrator.setMode(VIBRATOR_SCENE_TIMER)
            vibrator.start({ mode: VIBRATOR_SCENE_TIMER })
            logger.log('[smart_wake] vibrator.start() acionado com sucesso!')
          } else {
            logger.error('[smart_wake] Objeto vibrator não está disponível')
          }
        } catch (vibErr) {
          logger.error('[smart_wake] Exceção ao acionar vibrator:', vibErr)
        }

        const finishAndExit = () => {
          logger.log('[smart_wake] Encerrando serviço em segundo plano...')
          try {
            if (typeof this.exit === 'function') {
              this.exit()
            }
          } catch (e) {
            logger.error('[smart_wake] Erro em this.exit:', e)
          }
          try {
            appServiceMgr.exit()
          } catch (e) {
            logger.error('[smart_wake] Erro em appServiceMgr.exit:', e)
          }
        }

        // Envia mensagem BLE ao telemóvel (Side Service)
        if (messageBuilder) {
          logger.log('[smart_wake] Enviando evento WAKE_UP para o Side Service via BLE...')
          try {
            messageBuilder
              .call({ action: 'WAKE_UP' })
              .then(() => {
                logger.log('[smart_wake] Evento WAKE_UP enviado com sucesso para o telemóvel!')
                finishAndExit()
              })
              .catch((err) => {
                logger.error('[smart_wake] Falha ao enviar evento WAKE_UP via BLE:', err)
                finishAndExit()
              })
          } catch (callEx) {
            logger.error('[smart_wake] Exceção ao chamar messageBuilder.call:', callEx)
            finishAndExit()
          }
        } else {
          finishAndExit()
        }
      }
    })
  },

  onDestroy() {
    logger.log('[smart_wake] Background service destroyed')
    if (messageBuilder && typeof messageBuilder.disConnect === 'function') {
      try {
        messageBuilder.disConnect()
      } catch (e) {}
    }
  }
})
