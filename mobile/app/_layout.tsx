import { useEffect } from 'react'
import { BackHandler } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import * as Linking from 'expo-linking'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import type { WebView } from 'react-native-webview'
import { PushBridge } from '@/components/PushBridge'

// Ref compartilhado com index.tsx para controle do WebView no handler de deep link
export const webViewRef = { current: null as WebView | null }

export default function RootLayout() {
  const router = useRouter()

  useEffect(() => {
    // Handler de deep links recebidos com app aberto
    const subscription = Linking.addEventListener('url', ({ url }) => {
      const parsed = Linking.parse(url)
      const path = parsed.path ?? ''

      if (path === 'notificacoes') {
        router.push('/(tabs)/notifications')
      } else {
        // Navega o WebView para o path correspondente, preservando query params
        // Se path vazio, navega para home (fallback)
        const targetPath = path || ''
        const query = parsed.queryParams
          ? '?' + new URLSearchParams(parsed.queryParams as Record<string, string>).toString()
          : ''
        webViewRef.current?.injectJavaScript(
          `window.location.href = '/${targetPath}${query}'; true;`
        )
      }
    })

    return () => subscription.remove()
  }, [router])

  useEffect(() => {
    // Android: botão físico voltar — navega o WebView antes de sair
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        // Verificar se WebView pode voltar (evita tela branca em cold start via deep link)
        // Se canGoBack não estiver disponível, navegar para home como fallback
        webViewRef.current.injectJavaScript(`
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = '/';
          }
          true;
        `)
        return true
      }
      return false
    })
    return () => handler.remove()
  }, [])

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#16A34A" />
      <PushBridge />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#16A34A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen
          name="(tabs)/index"
          options={{ title: 'Prato Solidário' }}
        />
        <Stack.Screen
          name="(tabs)/notifications"
          options={{ title: 'Notificações' }}
        />
      </Stack>
    </SafeAreaProvider>
  )
}
