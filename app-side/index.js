import { MessageBuilder } from '../shared/message-side'

const messageBuilder = new MessageBuilder()

AppSideService({
  onInit() {
    console.log('[app-side] Side Service onInit iniciado')

    messageBuilder.listen(() => {
      console.log('[app-side] MessageBuilder listening com sucesso')
    })

    messageBuilder.on('call', (payload) => {
      console.log('[app-side] Mensagem recebida do Device App:', JSON.stringify(payload))

      // Tratamento para garantir leitura do payload
      const data = payload && payload.action ? payload : (typeof payload === 'string' ? JSON.parse(payload) : payload)

      if (data && data.action === 'WAKE_UP') {
        console.log('[app-side] Comando WAKE_UP detectado! Disparando requisição HTTP via Fetch API...')

        const webhookUrl = 'https://webhook.site/SEU-ID-AQUI'

        fetch({
          url: webhookUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event: 'WAKE_UP',
            timestamp: Date.now(),
            source: 'SmartWake_AppService'
          })
        })
          .then((response) => {
            console.log('[app-side] Webhook POST enviado com sucesso! Status:', response ? (response.status || response.statusText) : 'OK')
          })
          .catch((error) => {
            console.error('[app-side] Erro ao disparar webhook:', error)
          })
      }
    })
  },

  onRun() {
    console.log('[app-side] Side Service onRun')
  },

  onDestroy() {
    console.log('[app-side] Side Service onDestroy')
  }
})
