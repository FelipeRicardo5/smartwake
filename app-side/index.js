import { MessageBuilder } from '../shared/message-side'

const messageBuilder = new MessageBuilder()
const webhookUrl = 'https://webhook.site/61ff8681-e75d-48ca-9ac0-bc9a5443e4c2'

let hasTriggered = false

function triggerWebhook(source = 'MessageBuilder') {
  if (hasTriggered) {
    console.log(`[app-side] Webhook já disparado nesta sessão, ignorando duplicata de ${source}`)
    return
  }
  hasTriggered = true

  console.log(`[app-side] Disparando webhook POST via Fetch API (fonte: ${source})...`)

  const payload = JSON.stringify({
    event: 'WAKE_UP',
    timestamp: Date.now(),
    source: `SmartWake_${source}`
  })

  const headers = {
    'Content-Type': 'application/json'
  }

  // 1. Tentar formato nativo do Zepp OS (objeto único com url, method, headers, body)
  try {
    fetch({
      url: webhookUrl,
      method: 'POST',
      headers,
      body: payload
    })
      .then((response) => {
        console.log('[app-side] Webhook POST enviado com sucesso! Status:', response ? (response.status || response.statusText || 'OK') : 'OK')
      })
      .catch((error) => {
        console.warn('[app-side] Erro no fetch(options), tentando fallback fetch(url, options)...', error)
        try {
          fetch(webhookUrl, {
            method: 'POST',
            headers,
            body: payload
          })
            .then((res2) => {
              console.log('[app-side] Webhook POST fallback enviado! Status:', res2 ? (res2.status || 'OK') : 'OK')
            })
            .catch((err2) => {
              console.error('[app-side] Erro no webhook fallback:', err2)
            })
        } catch (e2) {
          console.error('[app-side] Exceção no webhook fallback:', e2)
        }
      })
  } catch (syncEx) {
    console.warn('[app-side] Exceção síncrona no fetch(options), tentando fallback fetch(url, options)...', syncEx)
    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: payload
      })
        .then((res2) => {
          console.log('[app-side] Webhook POST fallback síncrono enviado! Status:', res2 ? (res2.status || 'OK') : 'OK')
        })
        .catch((err2) => {
          console.error('[app-side] Erro no webhook fallback síncrono:', err2)
        })
    } catch (e3) {
      console.error('[app-side] Exceção fatal no fetch:', e3)
    }
  }
}

AppSideService({
  onInit() {
    console.log('[app-side] Side Service onInit iniciado')
    hasTriggered = false

    messageBuilder.listen(() => {
      console.log('[app-side] MessageBuilder listening com sucesso')
    })

    // 1. Escuta via protocolo estruturado MessageBuilder
    messageBuilder.on('call', (payload) => {
      console.log('[app-side] Mensagem recebida do Device App via MessageBuilder:', JSON.stringify(payload))
      const data = payload && payload.action ? payload : (typeof payload === 'string' ? JSON.parse(payload) : payload)

      if (data && data.action === 'WAKE_UP') {
        console.log('[app-side] Ação WAKE_UP confirmada via MessageBuilder!')
        triggerWebhook('MessageBuilder')
      }
    })

    // 2. Escuta direta via peerSocket para máxima redundância e resiliência
    if (typeof messaging !== 'undefined' && messaging.peerSocket) {
      messaging.peerSocket.addListener('message', (buffer) => {
        console.log('[app-side] Pacote bruto recebido via peerSocket, byteLength:', buffer ? (buffer.byteLength || buffer.length) : 0)
        try {
          const str = Buffer.from(buffer).toString('utf-8')
          if (str.includes('WAKE_UP')) {
            console.log('[app-side] WAKE_UP detectado diretamente no payload do peerSocket!')
            triggerWebhook('PeerSocketDirect')
          }
        } catch (e) {
          // Normal para pacotes puramente binários sem UTF-8
        }
      })
    }
  },

  onRun() {
    console.log('[app-side] Side Service onRun')
  },

  onDestroy() {
    console.log('[app-side] Side Service onDestroy')
  }
})
