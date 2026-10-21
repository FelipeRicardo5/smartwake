import * as appServiceMgr from '@zos/app-service'
import { log } from '@zos/utils'
import { Time } from '@zos/sensor'
import * as ble from '@zos/ble'
import { getPackageInfo } from '@zos/app'
import { MessageBuilder } from '../shared/message'
import { startAlarm, stopAlarm, isAlarmActive } from '../shared/alarm_engine'

const logger = log.getLogger('smartwake-service')

// Singletons no escopo raiz do módulo
const timeSensor = new Time()

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
    if (isAlarmActive()) {
      stopAlarm('service_exit')
    }
    appServiceMgr.exit()
  },

  onInit(e) {
    logger.log(`Background service initialized with params: ${e}`)
    minuteCount = 0
    wakeTriggered = false

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
        logger.log('[smart_wake] Minuto 3 atingido: iniciando alarme háptico progressivo...')

        startAlarm({
          onStageChange: ({ stage, name, desc }) => {
            logger.log(`[smart_wake] Alarme estágio ${stage}: ${name} (${desc})`)
          },
          onFinish: (reason) => {
            logger.log(`[smart_wake] Alarme finalizado: ${reason}`)
          }
        })

        // 1. Envia mensagem BLE ao telemóvel via MessageBuilder
        if (messageBuilder) {
          logger.log('[smart_wake] Enviando evento WAKE_UP para o Side Service via MessageBuilder...')
          try {
            messageBuilder
              .call({ action: 'WAKE_UP' })
              .then(() => {
                logger.log('[smart_wake] Evento WAKE_UP despachado com sucesso via MessageBuilder!')
              })
              .catch((err) => {
                logger.error('[smart_wake] Falha ao enviar evento WAKE_UP via MessageBuilder:', err)
              })
          } catch (callEx) {
            logger.error('[smart_wake] Exceção ao chamar messageBuilder.call:', callEx)
          }
        }

        // 2. Envio redundante via BLE direto para garantia máxima de recepção no telemóvel
        try {
          const rawPayload = Buffer.from(JSON.stringify({ action: 'WAKE_UP' }))
          const ab = rawPayload.buffer ? rawPayload.buffer.slice(rawPayload.byteOffset, rawPayload.byteOffset + rawPayload.byteLength) : rawPayload
          ble.send(ab, rawPayload.byteLength)
          logger.log('[smart_wake] Pacote raw BLE WAKE_UP despachado com sucesso!')
        } catch (rawErr) {
          logger.warn('[smart_wake] Erro ao despachar pacote raw BLE:', rawErr)
        }

        logger.log('[smart_wake] Pacotes BLE despachados! Mantendo serviço ativo por 60s (até minuto 4) para garantir transmissão completa sem corte precoce de conexão.')
      } else if (minuteCount > 3 && wakeTriggered) {
        logger.log('[smart_wake] Minuto 4 atingido. Janela de transmissão BLE garantida. Encerrando serviço...')
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
    })
  },

  onDestroy() {
    logger.log('[smart_wake] Background service destroyed')
    if (isAlarmActive()) {
      stopAlarm('service_destroyed')
    }
  }
})
