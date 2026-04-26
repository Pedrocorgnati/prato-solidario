import { useEffect, useState } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

const CONSENT_KEY = 'push_consent_shown'
const TOKEN_KEY = 'expo_push_token'
const DEVICE_ID_KEY = 'device_id'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://pratosolidario.com.br'

// Gera ou recupera um device ID persistente
async function getOrCreateDeviceId(): Promise<string> {
  const stored = await AsyncStorage.getItem(DEVICE_ID_KEY)
  if (stored) return stored
  const id = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  await AsyncStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

async function registerTokenOnBackend(
  token: string,
  deviceId: string,
  userId?: string
) {
  await fetch(`${WEB_URL}/api/v1/push-tokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      deviceId,
      platform: Platform.OS as 'ios' | 'android',
      userId,
    }),
  })
}

async function revokeTokenOnBackend(token: string) {
  // Best-effort: tenta revogar no backend. A revogação real é feita pelo
  // cron de limpeza de tokens inativos (module-23) caso este DELETE falhe.
  await fetch(`${WEB_URL}/api/v1/push-tokens/${encodeURIComponent(token)}`, {
    method: 'DELETE',
  }).catch(() => {/* silencioso — endpoint requer auth, cron limpará */})
}

// Revogação local: limpa token de AsyncStorage sem depender de auth no backend.
// O cron de limpeza de tokens inativos (module-23) remove tokens não renovados.
async function revokeTokenLocally() {
  const storedToken = await AsyncStorage.getItem(TOKEN_KEY)
  if (!storedToken) return

  // Limpar token local
  await AsyncStorage.removeItem(TOKEN_KEY)

  // Tentar revogar no backend (best-effort, falha silenciosa se auth requerido)
  await revokeTokenOnBackend(storedToken)
}

interface UsePushTokenResult {
  showConsent: boolean
  consentLoading: boolean
  onConsentAccept: () => Promise<void>
  onConsentDecline: () => Promise<void>
  permissionDenied: boolean
}

export function usePushToken(userId?: string): UsePushTokenResult {
  const [showConsent, setShowConsent] = useState(false)
  const [consentLoading, setConsentLoading] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    void checkAndInitPush()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function checkAndInitPush() {
    // Apenas dispositivos físicos suportam push
    if (!Device.isDevice) return

    const consent = await AsyncStorage.getItem(CONSENT_KEY)

    // Usuário já recusou — verificar se permissão foi concedida no SO mesmo assim
    if (consent === 'declined' || consent === 'revoked') {
      const { status } = await Notifications.getPermissionsAsync()
      if (status !== 'granted') {
        setPermissionDenied(true)
      }
      return
    }

    const { status: currentStatus } = await Notifications.getPermissionsAsync()

    if (currentStatus === 'granted') {
      // Permissão já concedida — registrar/renovar token silenciosamente
      await registerOrRenewToken(userId)
      return
    }

    if (currentStatus === 'denied') {
      // SO negou — não pedir novamente
      setPermissionDenied(true)
      // LGPD US-027 Cenário 3: se havia token, revogar localmente
      await revokeTokenLocally()
      return
    }

    // Status 'undetermined' — exibir modal de consentimento LGPD primeiro
    if (!consent) {
      setShowConsent(true)
    }
  }

  async function onConsentAccept() {
    setConsentLoading(true)
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'accepted')

      const { status } = await Notifications.requestPermissionsAsync()
      if (status === 'granted') {
        await registerOrRenewToken(userId)
      } else {
        setPermissionDenied(true)
      }
    } finally {
      setConsentLoading(false)
      setShowConsent(false)
    }
  }

  async function onConsentDecline() {
    setShowConsent(false)
    await AsyncStorage.setItem(CONSENT_KEY, 'declined')
  }

  async function registerOrRenewToken(uid?: string) {
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId as string | undefined

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId })
      const newToken = tokenData.data
      const deviceId = await getOrCreateDeviceId()

      const storedToken = await AsyncStorage.getItem(TOKEN_KEY)
      if (storedToken === newToken) return // já registrado, sem mudança

      // Token novo ou renovado
      await registerTokenOnBackend(newToken, deviceId, uid)
      await AsyncStorage.setItem(TOKEN_KEY, newToken)

      // Se havia token antigo, revogar no backend (best-effort)
      if (storedToken && storedToken !== newToken) {
        await revokeTokenOnBackend(storedToken)
      }
    } catch (err) {
      console.error('[usePushToken] Falha ao registrar/renovar token:', err)
    }
  }

  return { showConsent, consentLoading, onConsentAccept, onConsentDecline, permissionDenied }
}
