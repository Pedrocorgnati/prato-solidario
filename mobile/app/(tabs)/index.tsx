import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebViewBridge } from '@/components/WebViewBridge'
import { webViewRef } from '@/app/_layout'
import type { WebView } from 'react-native-webview'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? 'https://pratosolidario.com.br'

export default function HomeScreen() {
  const localRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Sincroniza ref local com o ref compartilhado do _layout (para deep links + back handler)
  function syncRef(ref: WebView | null) {
    ;(localRef as React.MutableRefObject<WebView | null>).current = ref
    webViewRef.current = ref
  }

  function handleRetry() {
    setError(false)
    setLoading(true)
    localRef.current?.reload()
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorIcon}>📡</Text>
        <Text style={styles.errorTitle}>Sem conexão com a internet</Text>
        <Text style={styles.errorMessage}>
          Verifique sua conexão e tente novamente.
        </Text>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#16A34A" />
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      )}
      <WebViewBridge
        ref={syncRef}
        source={{ uri: WEB_URL }}
        style={styles.webview}
        onLoadStart={() => {
          setLoading(true)
          setError(false)
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
        onHttpError={(e) => {
          if (e.nativeEvent.statusCode >= 500) {
            setLoading(false)
            setError(true)
          }
        }}
        // Links externos abrem no navegador do SO
        onShouldStartLoadWithRequest={(req) => {
          const isWebApp =
            req.url.startsWith(WEB_URL) ||
            req.url.startsWith('about:') ||
            req.url.startsWith('blob:') ||
            req.url.startsWith('data:')
          return isWebApp
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
})
