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
          console.error('[message-side] Error in event handler for ' + event, e)
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
  constructor({ appId = 0, appDevicePort = 20, appSidePort = 0 } = {}) {
    super()
    this.appId = appId
    this.appDevicePort = appDevicePort
    this.appSidePort = appSidePort
    this.handlers = new Map()

    if (typeof globalThis.getApp === 'function' && globalThis.getApp()?.port2) {
      this.appSidePort = globalThis.getApp().port2
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

  listen(callback) {
    console.log('[message-side] MessageBuilder listen() invoked')

    if (typeof messaging !== 'undefined' && messaging.peerSocket) {
      messaging.peerSocket.addListener('message', (buffer) => {
        this.onFragmentData(buffer)
      })
    } else {
      console.warn('[message-side] messaging.peerSocket is not available')
    }

    if (callback) callback(this)
  }

  sendBin(bin) {
    if (typeof messaging !== 'undefined' && messaging.peerSocket && typeof messaging.peerSocket.send === 'function') {
      messaging.peerSocket.send(bin.buffer)
      return true
    } else {
      console.warn('[message-side] messaging.peerSocket.send not available')
      return false
    }
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
    buf.writeUInt32LE(0, offset)
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

    offset += 28

    const contentType = buf.readUInt8(offset)
    offset += 1
    const dataType = buf.readUInt8(offset)
    offset += 1

    offset += 10

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

  onFragmentData(data) {
    const packet = this.readBin(data)

    if (packet.flag === 1 && packet.type === 1) {
      // Shake request from device -> reply
      this.appDevicePort = packet.port1
      this.appId = packet.appId || this.appId

      const reply = this.buildBin({
        flag: 1,
        version: 1,
        type: 1, // SHAKE
        port1: this.appDevicePort,
        port2: this.appSidePort,
        appId: this.appId,
        extra: 0,
        payload: Buffer.from([this.appId & 0xff])
      })
      this.sendBin(reply)
      console.log('[message-side] Replied to shake request from device')
    } else if (packet.flag === 1 && (packet.type === 4 || packet.type === 5)) {
      this.onMessage(packet.payload)
    }
  }

  onMessage(data) {
    const parsed = this.readPayload(data)
    if (!parsed) return

    let content = parsed.payload
    if (parsed.contentType === 2) {
      content = this.buf2Json(parsed.payload)
    }

    if (parsed.payloadType === 3) {
      // CALL event
      this.emit('call', content)
    } else if (parsed.payloadType === 1) {
      // REQUEST event
      this.emit('request', {
        request: content,
        response: (resData) => {
          this.response({
            requestId: parsed.traceId,
            data: resData
          })
        }
      })
    }
  }

  call(data) {
    console.log('[message-side] MessageBuilder call() to device:', JSON.stringify(data))

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
      opCode: 1,
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

    return this.sendBin(outer)
  }

  response({ requestId, data }) {
    const payloadBuf = this.json2Buf(data)
    const spanId = getNextSpanId()

    const inner = this.buildPayload({
      traceId: requestId,
      spanId,
      seqId: 0,
      totalLength: payloadBuf.byteLength,
      payload: payloadBuf,
      type: 2, // RESPONSE
      opCode: 1,
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

    return this.sendBin(outer)
  }
}
