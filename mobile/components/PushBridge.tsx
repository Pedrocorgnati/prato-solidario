import { useEffect } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { ConsentModal } from './ConsentModal'
import { usePushToken } from '@/hooks/usePushToken'
import { webViewRef } from '@/app/_layout'

// Configuração do handler de notificações (deve ser chamado no nível do módulo)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

interface PushBridgeProps {
  userId?: string
}

// Componente invisível — gerencia listeners de notificação e consentimento LGPD
// Montar no _layout raiz para garantir que listeners são registrados uma única vez
export function PushBridge({ userId }: PushBridgeProps) {
  const router = useRouter()
  const { showConsent, consentLoading, onConsentAccept, onConsentDecline, permissionDenied } =
    usePushToken(userId)

  useEffect(() => {
    // Android: criar canal de notificação com som
    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync('default', {
        name: 'Prato Solidário',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#16A34A',
      })
    }

    // Foreground: notificação recebida com app aberto (handler global já configurado acima)
    const foregroundSub = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // O setNotificationHandler cuida da exibição automática
        // Aqui pode-se adicionar lógica extra (badge, estado local, etc.)
      }
    )

    // Background/killed: usuário tocou na notificação
    const responseSub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined

        if (url) {
          // Deep link para rota nativa
          if (url === '/notificacoes' || url === 'notificacoes') {
            router.push('/(tabs)/notifications')
          } else {
            // Navega o WebView para a URL real da notificação
            const path = url.startsWith('/') ? url : `/${url}`
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(
                `window.location.href = '${path}'; true;`
              )
            } else {
              // WebView ainda não montado — navegar para home e a URL será carregada
              router.push('/(tabs)/index')
            }
          }
        } else {
          router.push('/(tabs)/index')
        }
      }
    )

    return () => {
      foregroundSub.remove()
      responseSub.remove()
    }
  }, [router])

  return (
    <>
      <ConsentModal
        visible={showConsent}
        loading={consentLoading}
        onAccept={onConsentAccept}
        onDecline={onConsentDecline}
      />
      {permissionDenied && (
        <View style={styles.banner} pointerEvents="none">
          <Text style={styles.bannerText}>
            🔕 Notificações desativadas. Ative nas configurações para receber alertas de doações.
          </Text>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 100,
  },
  bannerText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 18,
  },
})
