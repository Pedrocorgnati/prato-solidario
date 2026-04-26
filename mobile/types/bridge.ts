// Bridge types for native ↔ web communication via postMessage
export interface WebBridgeMessage {
  type: 'PUSH_TOKEN' | 'NAVIGATE' | 'SHARE' | 'VIBRATE'
  payload: unknown
}

export interface PushTokenPayload {
  token: string
  deviceId: string
  platform: 'ios' | 'android'
  userId?: string
}

export interface NavigatePayload {
  path: string // ex: '/retirar'
}

export interface SharePayload {
  title?: string
  message: string
  url?: string
}
