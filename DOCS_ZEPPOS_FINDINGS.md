# Guia de Engenharia e Descobertas: Zepp OS Background Services & BLE Bridge

Este documento reúne descobertas empíricas, armadilhas arquiteturais de baixo nível e padrões de projeto comprovados em hardware real (Amazfit Balance) durante o desenvolvimento do **Smart Wake**. 

A maioria destes comportamentos **não está documentada** na documentação oficial da Zepp Health ou contradiz exemplos simplistas da SDK.

---

## 1. O Risco Crítico do Garbage Collector do QuickJS (Singletons vs Instâncias Locais)

### O Problema
O Zepp OS executa sobre o motor **QuickJS** (C/JS embutido para microcontroladores). Quando o ecrã do relógio é desligado ou o relógio entra em suspensão profunda:
- Qualquer objeto instanciado dentro de funções de ciclo de vida (`onInit`, `build`, etc.) ou no corpo de métodos é agressivamente varrido pelo Garbage Collector (GC).
- Se você instanciar `const time = new Time()` ou `const vibrator = new Vibrator()` dentro do `onInit()` do `AppService`, os listeners (`time.onPerMinute`) **param de disparar silenciosamente após 1 a 2 minutos**. Nenhum erro é emitido no log.

### A Regra de Ouro
**Todas as instâncias de hardware, sensores e comunicação DEVEM ser declaradas como singletons no escopo raiz do módulo (fora de qualquer função ou objeto de configuração):**

```javascript
// ✅ CORRETO: Escopo raiz do módulo (imune ao GC do QuickJS)
import { Time, Vibrator } from '@zos/sensor'
import { MessageBuilder } from '../shared/message'

const timeSensor = new Time()
let vibrator = null
try {
  vibrator = new Vibrator()
} catch (e) {}

let messageBuilder = null
try {
  messageBuilder = new MessageBuilder({ appId, appDevicePort: 20, appSidePort: 0, ble })
} catch (e) {}

AppService({
  onInit() {
    // Usar os singletons já instanciados
  }
})
```

---

## 2. A Armadilha Fatal do `setTimeout` / `setInterval` em `AppService`

### O Problema
No runtime do `AppService` (serviço em segundo plano) com o ecrã apagado:
- **`setTimeout` e `setInterval` NÃO FUNCIONAM.** A fila de timers virtuais do event loop fica congelada no hardware em modo deep sleep.
- Bibliotecas oficiais como o `MessageBuilder` ou `ZML` frequentemente usam fallbacks do tipo:
  ```javascript
  Promise.race([
    this.shakePromise,
    new Promise(resolve => setTimeout(resolve, 1500)) // ⚠️ NUNCA DISPARA!
  ])
  ```
- **Consequência:** A `Promise` fica pendente para sempre. Qualquer código encadeado em `.then()` ou `.catch()` (como o `this.exit()` do serviço) nunca é executado, travando o serviço em memória e gerando loops infinitos nos minutos subsequentes.

### A Regra de Ouro
- **Nunca use `setTimeout` ou `setInterval` dentro de um `AppService`.**
- O tempo deve ser medido **exclusivamente por sensores de hardware baseados em RTC**, especificamente `timeSensor.onPerMinute(...)`.
- Métodos de comunicação assíncrona devem despachar o buffer via BLE e resolver imediatamente (`Promise.resolve()`), sem esperar timers virtuais.

---

## 3. O "Tiro no Pé" da Desconexão Prematura em BLE (Race Condition de 40ms)

### O Problema
Nos primeiros testes com o ecrã bloqueado, os logs indicavam:
- `00:17:00.241` — `ble.send ... bytes: 102` (pacote despachado)
- `00:17:00.260` — `AppService.exit() invoked`
- `00:17:00.273` — `MessageBuilder disConnect() invoked`
- `00:17:00.282` — `ble.send ... bytes: 17` (pacote CLOSE) + `ble.disConnect()`

A chamada `ble.send(data, size)` no Zepp OS apenas enfileira os bytes no buffer TX do controlador de rádio Bluetooth. A transmissão real pelo ar via BLE Low Energy exige vários intervalos de conexão (que variam de 45 ms a 100 ms com o ecrã desligado).
- Ao chamar `this.exit()` logo após o envio, o hook `onDestroy` chamava `ble.disConnect()`.
- O rádio BLE era desligado **41 milissegundos após o envio**, abortando a transmissão antes que o telemóvel recebesse ou confirmasse o pacote. O webhook nunca disparava.

### A Regra de Ouro
1. **Janela de Estabilidade BLE:** Não encerre o `AppService` no mesmo minuto do disparo. Dispare o evento BLE no Minuto 3, mas mantenha o serviço vivo até o Minuto 4 (60 segundos de janela) para garantir a integridade da transmissão.
2. **Nunca chame `ble.disConnect()` no `onDestroy` do `AppService`:** Deixe o sistema operacional gerir o rádio Bluetooth. Forçar a desconexão aborta pacotes em voo.

---

## 4. Guarda Obrigatória de Disparo Único (`wakeTriggered`)

### O Problema
O listener `timeSensor.onPerMinute` continuará disparando a cada 60 segundos enquanto o serviço estiver na RAM do relógio:
```javascript
timeSensor.onPerMinute(() => {
  minuteCount += 1
  if (minuteCount >= 3) {
    vibrator.start() // ⚠️ Vai vibrar de novo no minuto 4, 5, 6...
  }
})
```

### A Regra de Ouro
Sempre utilize uma flag booleana de estado para garantir execução estritamente única da lógica de ativação:
```javascript
let wakeTriggered = false

timeSensor.onPerMinute(() => {
  minuteCount += 1

  if (minuteCount === 3 && !wakeTriggered) {
    wakeTriggered = true
    // Dispara motor háptico e envia BLE
  } else if (minuteCount > 3 && wakeTriggered) {
    // Minuto seguinte: janela segura concluída, encerra
    this.exit()
    appServiceMgr.exit()
  }
})
```

---

## 5. Códigos de Retorno do `@zos/app-service.start()`

Ao iniciar o serviço em segundo plano a partir da UI (`index.page.js`), o retorno da função `start(...)` deve ser tratado com precisão:

| Código de Retorno | Significado | Ação Recomendada |
| :--- | :--- | :--- |
| `0` | Sucesso imediato | Informar usuário que o ecrã pode ser apagado |
| `2` | Já em execução | Não reiniciar; o serviço anterior já está ativo na RAM |
| `3` | Permissão ausente (`No Permission`) | Solicitar permissão dinamicamente via `requestPermission({ permissions: ['device:os.bg_service'] })` |
| `outro` | Erro desconhecido | Tratar como falha de inicialização |

Além disso, o `app.json` **deve** conter a permissão declarada:
```json
"permissions": [
  "device:os.bg_service",
  "device:os.vibrator"
]
```

---

## 6. O Companion Phone Service (`AppSideService`) e a Fetch API

### Formato de Requisição HTTP
No `app-side/index.js` (que roda no contexto do aplicativo Zepp no smartphone), o `fetch` oficial do Zepp OS **não segue a assinatura clássica da Web `fetch(url, options)`**. Ele espera um **único objeto de configuração**:

```javascript
// ✅ Formato Zepp OS Side Service
fetch({
  url: 'https://webhook.site/SEU-UUID',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ event: 'WAKE_UP' })
})
  .then(res => console.log('Sucesso:', res))
  .catch(err => console.error('Erro:', err))
```

### Padrão de Escuta Dupla Resiliente
Para prevenir perda de mensagens caso haja falha no handshake de portas do `MessageBuilder`, configure **dois receptores paralelos** no `onInit` do `app-side/index.js`:
1. `messageBuilder.on('call', payload => ...)` — decodifica o protocolo binário estruturado RPC (82 bytes de cabeçalho).
2. `messaging.peerSocket.addListener('message', buffer => ...)` — intercepta pacotes de buffer bruto caso o relógio tenha transmitido via `ble.send(rawBuf)`.

---

## 7. Requisitos no Smartphone para Testes Reais

Para que o evento BLE do relógio alcance o `app-side` e dispare a rede externa:
1. **App Zepp aberta ou em segundo plano:** O Android ou iOS não devem matar o processo da Zepp (desativar "Otimização de Bateria" / "Economia de Energia Inteligente" para a app Zepp).
2. **Bluetooth emparelhado e ativo:** O `connectStatus()` do `@zos/ble` deve reportar `true`.
3. **Logs do Side Service:** Os logs do telemóvel (`console.log`) **não aparecem** no stream do relógio (`quickjs-libc SBEngine`). Para vê-los no telemóvel:
   - Na app Zepp: *Perfil* -> *Definições* -> *Sobre* -> toque no ícone da Zepp 7 vezes para desbloquear o *Modo de Desenvolvedor*.
   - Aceda a *Opções de Desenvolvedor* -> *Mini Programs* -> *Logs*.

---

## 8. Arquitetura Final Validada (Padrão de Referência)

```
[ Relógio - Amazfit Balance ]
  │  Ecrã Desligado
  │  TimeSensor (Singleton RTC) ──> Tick 3/3
  │  Vibrator (Singleton Háptico) ──> VIBRATOR_SCENE_TIMER
  │  ble.send(...) ──> Pacote Binário BLE (102 bytes)
  │  (Janela de 60s mantida sem corte)
  ▼
[ Bluetooth Low Energy (BLE) ]
  ▼
[ Telemóvel - App Zepp ]
  │  AppSideService (app-side/index.js)
  │  messaging.peerSocket / MessageBuilder
  │  Fetch API (Zepp OS Object Format)
  ▼
[ Internet / Nuvem ]
  ▼
[ Webhook / Home Assistant / Automação Externa ]
```
