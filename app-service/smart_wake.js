import * as appServiceMgr from '@zos/app-service'
import { log } from '@zos/utils'
import { Time, Vibrator, VIBRATOR_SCENE_TIMER } from '@zos/sensor'

const logger = log.getLogger('smartwake-service')

const timeSensor = new Time()
let vibrator = null

try {
  vibrator = new Vibrator()
} catch (err) {
  logger.error('Failed to instantiate Vibrator at top level:', err)
}

let minuteCount = 0

AppService({
  exit() {
    logger.log('AppService.exit() invoked')
    appServiceMgr.exit()
  },

  onInit(e) {
    logger.log(`Background service initialized with params: ${e}`)
    minuteCount = 0

    if (!vibrator) {
      try {
        vibrator = new Vibrator()
      } catch (err) {
        logger.error('Failed to instantiate Vibrator in onInit:', err)
      }
    }

    logger.log(`Registering timeSensor.onPerMinute listener... Current time: ${timeSensor.getHours()}:${timeSensor.getMinutes()}:${timeSensor.getSeconds()}`)

    timeSensor.onPerMinute(() => {
      minuteCount += 1
      logger.log(`[smart_wake] onPerMinute tick: ${minuteCount}/3 | Time: ${timeSensor.getHours()}:${timeSensor.getMinutes()}:${timeSensor.getSeconds()}`)

      if (minuteCount >= 3) {
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

        logger.log('[smart_wake] Encerrando serviço em segundo plano com this.exit()')
        if (typeof this.exit === 'function') {
          this.exit()
        } else {
          appServiceMgr.exit()
        }
      }
    })
  },

  onDestroy() {
    logger.log('[smart_wake] Background service destroyed')
  }
})
