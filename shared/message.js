import { log as Logger } from '@zos/utils'
import * as bleModule from '@zos/ble'

const logger = Logger.getLogger('message-builder')

class SimpleEventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(handler)
    return this
  }

  off(event, handler) {
    if (!event) {
      this.events.clear()
      return this
    }
    if (!handler) {
      this.events.delete(event)
      return this
    }
    const handlers = this.events.get(event)
    if (handlers) {
      const idx = handlers.indexOf(handler)
      if (idx !== -1) handlers.splice(idx, 1)
    }
    return this
  }

  emit(event, ...args) {
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.slice().forEach((fn) => {
        try {
          fn(...args)
        } catch (e) {
          logger.error('Error in event handler for ' + event, e)
        }
      })
    }
  }
}

let globalRequestId = 10000
function getNextRequestId() {
  return globalRequestId++
}

let globalSpanId = 1000
function getNextSpanId() {
  return globalSpanId++
}

export class MessageBuilder extends SimpleEventEmitter {
  constructor({ appId = 0, appDevicePort = 20, appSidePort = 0, ble = bleModule } = {}) {
    super()
    this.appId = appId
    this.appDevicePort = appDevicePort
    this.appSidePort = appSidePort
    this.ble = ble
    this.chunkSize = 3584
    this.shakeStatus = 1 // 1: init, 2: shaking, 3: connected, 4: failed
    this.shakePromise = null
    this.shakeResolve = null
    this.shakeReject = null
    this.handlers = new Map()
    this.sessions = new Map()

    if (this.ble && typeof this.ble.addListener === 'function') {
      this.ble.addListener((status) => {
        this.emit('bleStatusChanged', status)
      })
    }
  }

  buf2Json(buf) {
    try {
      const str = Buffer.from(buf).toString('utf-8')
      return JSON.parse(str)
    } catch (e) {
      return buf
    }
  }

  json2Buf(json) {
    const str = typeof json === 'string' ? json : JSON.stringify(json)
    return Buffer.from(str, 'utf-8')
  }

  connect(callback) {
    logger.log('MessageBuilder connect() invoked')

    if (this.ble && typeof this.ble.createConnect === 'function') {
      this.ble.createConnect((index, data, size) => {
        this.onFragmentData(data)
      })
    }

    this.sendShake()

    if (callback) callback(this)
  }

  disConnect(callback) {
    logger.log('MessageBuilder disConnect() invoked')
    try {
      this.sendClose()
    } catch (e) {}

    if (this.ble && typeof this.ble.disConnect === 'function') {
      this.ble.disConnect()
    }

    this.handlers.clear()
    this.sessions.clear()
    if (callback) callback(this)
  }

  sendShake() {
    this.shakeStatus = 2
    this.shakePromise = new Promise((resolve, reject) => {
      this.shakeResolve = resolve
      this.shakeReject = reject
    })

    const payload = Buffer.from([this.appId & 0xff])
    const bin = this.buildBin({
      flag: 1,
      version: 1,
      type: 1, // SHAKE
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      payload
    })

    try {
      this.sendBin(bin)
    } catch (e) {
      logger.error('Failed to send shake:', e)
    }
  }

  sendClose() {
    const payload = Buffer.from([this.appId & 0xff])
    const bin = this.buildBin({
      flag: 1,
      version: 1,
      type: 2, // CLOSE
      port1: this.appDevicePort,
      port2: this.appSidePort,
      appId: this.appId,
      extra: 0,
      payload
    })
    this.sendBin(bin)
  }

  buildBin({ flag = 1, version = 1, type = 4, port1 = 20, port2 = 0, appId = 0, extra = 0, payload }) {
    const headerLen = 16
    const totalLen = headerLen + (payload ? payload.byteLength : 0)
    const buf = Buffer.alloc(totalLen)
    let offset = 0

    buf.writeUInt8(flag, offset)
    offset += 1
    buf.writeUInt8(version, offset)
    offset += 1
    buf.writeUInt16LE(type, offset)
    offset += 2
    buf.writeUInt16LE(port1, offset)
    offset += 2
    buf.writeUInt16LE(port2, offset)
    offset += 2
    buf.writeUInt32LE(appId, offset)
    offset += 4
    buf.writeUInt32LE(extra, offset)
    offset += 4

    if (payload && payload.byteLength > 0) {
      Buffer.from(payload).copy(buf, offset)
    }

    return buf
  }

  readBin(data) {
    const buf = Buffer.from(data)
    let offset = 0

    const flag = buf.readUInt8(offset)
    offset += 1
    const version = buf.readUInt8(offset)
    offset += 1
    const type = buf.readUInt16LE(offset)
    offset += 2
    const port1 = buf.readUInt16LE(offset)
    offset += 2
    const port2 = buf.readUInt16LE(offset)
    offset += 2
    const appId = buf.readUInt32LE(offset)
    offset += 4
    const extra = buf.readUInt32LE(offset)
    offset += 4

    const payload = buf.subarray(offset)

    return { flag, version, type, port1, port2, appId, extra, payload }
  }

  buildPayload({ traceId, spanId, seqId, totalLength, payload, type = 3, opCode = 1, contentType = 2, dataType = 2 }) {
    const headerLen = 66
    const buf = Buffer.alloc(headerLen + payload.byteLength)
    let offset = 0

    buf.writeUInt32LE(traceId, offset)
    offset += 4
    buf.writeUInt32LE(0, offset) // parentId
    offset += 4
    buf.writeUInt32LE(spanId, offset)
    offset += 4
    buf.writeUInt32LE(seqId, offset)
    offset += 4
    buf.writeUInt32LE(totalLength, offset)
    offset += 4
    buf.writeUInt32LE(payload.byteLength, offset)
    offset += 4
    buf.writeUInt8(type, offset)
    offset += 1
    buf.writeUInt8(opCode, offset)
    offset += 1
    buf.writeUInt32LE(Date.now() % 10000000, offset)
    offset += 4

    // Padding fields (offsets 30 to 53)
    for (let i = 0; i < 6; i++) {
      buf.writeUInt32LE(0, offset)
      offset += 4
    }

    buf.writeUInt8(contentType, offset)
    offset += 1
    buf.writeUInt8(dataType, offset)
    offset += 1
    buf.writeUInt16LE(0, offset)
    offset += 2
    buf.writeUInt32LE(0, offset)
    offset += 4
    buf.writeUInt32LE(0, offset)
    offset += 4

    Buffer.from(payload).copy(buf, offset)
    return buf
  }

  readPayload(data) {
    const buf = Buffer.from(data)
    if (buf.byteLength < 66) return null

    let offset = 0
    const traceId = buf.readUInt32LE(offset)
    offset += 4
    const parentId = buf.readUInt32LE(offset)
    offset += 4
    const spanId = buf.readUInt32LE(offset)
    offset += 4
    const seqId = buf.readUInt32LE(offset)
    offset += 4
    const totalLength = buf.readUInt32LE(offset)
    offset += 4
    const payloadLength = buf.readUInt32LE(offset)
    offset += 4
    const payloadType = buf.readUInt8(offset)
    offset += 1
    const opCode = buf.readUInt8(offset)
    offset += 1

    offset += 28 // Skip timestamps and zero fields

    const contentType = buf.readUInt8(offset)
    offset += 1
    const dataType = buf.readUInt8(offset)
    offset += 1

    offset += 10 // Skip remaining padding

    const payload = buf.subarray(offset)

    return {
      traceId,
      parentId,
      spanId,
      seqId,
      totalLength,
      payloadLength,
      payloadType,
      opCode,
      contentType,
      dataType,
      payload
    }
  }

  sendBin(bin) {
    if (!this.ble || typeof this.ble.send !== 'function') {
      logger.warn('BLE send API not available')
      return false
    }
    const success = this.ble.send(bin.buffer, bin.byteLength)
    if (!success) {
      logger.warn('ble.send returned false')
    }
    return success
  }

  onFragmentData(data) {
    const packet = this.readBin(data)
    if (packet.flag === 1 && packet.type === 1) {
      // Shake response
      this.appSidePort = packet.port2
      this.shakeStatus = 3
      logger.log('Handshake successful, appSidePort:', packet.port2)
      if (this.shakeResolve) this.shakeResolve(packet)
      this.emit('connected', packet)
    } else if (packet.flag === 1 && (packet.type === 4 || packet.type === 5)) {
      this.onMessage(packet.payload)
    }
  }

  onMessage(data) {
    const parsed = this.readPayload(data)
    if (!parsed) return

    if (parsed.payloadType === 3) {
      // CALL
      let content = parsed.payload
      if (parsed.contentType === 2) {
        content = this.buf2Json(parsed.payload)
      }
      this.emit('call', content)
    } else if (parsed.payloadType === 2) {
      // RESPONSE
      const handler = this.handlers.get(parsed.traceId)
      if (handler) {
        this.handlers.delete(parsed.traceId)
        let content = parsed.payload
        if (parsed.contentType === 2) {
          content = this.buf2Json(parsed.payload)
        }
        handler.resolve(content)
      }
    }
  }

  call(data) {
    logger.log('MessageBuilder call() with data:', JSON.stringify(data))

    const sendCallPayload = () => {
      const payloadBuf = this.json2Buf(data)
      const traceId = getNextRequestId()
      const spanId = getNextSpanId()

      const inner = this.buildPayload({
        traceId,
        spanId,
        seqId: 0,
        totalLength: payloadBuf.byteLength,
        payload: payloadBuf,
        type: 3, // CALL
        opCode: 1, // FINISH
        contentType: 2, // JSON
        dataType: 2 // JSON
      })

      const outer = this.buildBin({
        flag: 1,
        version: 1,
        type: 4, // DATA
        port1: this.appDevicePort,
        port2: this.appSidePort,
        appId: this.appId,
        extra: 0,
        payload: inner
      })

      const success = this.sendBin(outer)
      if (success) {
        return Promise.resolve({ success: true })
      } else {
        return Promise.reject(new Error('BLE send failed'))
      }
    }

    if (this.shakeStatus === 3) {
      return sendCallPayload()
    } else if (this.shakePromise) {
      // Wait for handshake with a 3s fallback
      return Promise.race([
        this.shakePromise.then(() => sendCallPayload()),
        new Promise((resolve) => {
          // Fallback: try sending anyway after 1.5s
          const t = setTimeout(() => {
            clearTimeout(t)
            resolve(sendCallPayload())
          }, 1500)
        })
      ])
    } else {
      return sendCallPayload()
    }
  }

  request(data, { timeout = 60000 } = {}) {
    logger.log('MessageBuilder request() with data:', JSON.stringify(data))

    return new Promise((resolve, reject) => {
      const traceId = getNextRequestId()
      const spanId = getNextSpanId()
      const payloadBuf = this.json2Buf(data)

      const timer = setTimeout(() => {
        this.handlers.delete(traceId)
        reject(new Error(`Request ${traceId} timed out after ${timeout}ms`))
      }, timeout)

      this.handlers.set(traceId, {
        resolve: (res) => {
          clearTimeout(timer)
          resolve(res)
        },
        reject: (err) => {
          clearTimeout(timer)
          reject(err)
        }
      })

      const inner = this.buildPayload({
        traceId,
        spanId,
        seqId: 0,
        totalLength: payloadBuf.byteLength,
        payload: payloadBuf,
        type: 1, // REQUEST
        opCode: 1, // FINISH
        contentType: 2,
        dataType: 2
      })

      const outer = this.buildBin({
        flag: 1,
        version: 1,
        type: 4,
        port1: this.appDevicePort,
        port2: this.appSidePort,
        appId: this.appId,
        extra: 0,
        payload: inner
      })

      this.sendBin(outer)
    })
  }
}
