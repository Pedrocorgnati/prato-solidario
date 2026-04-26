import { forwardRef } from 'react'
import { Share, Vibration } from 'react-native'
import { WebView, type WebViewProps, type WebViewMessageEvent } from 'react-native-webview'
import { useRouter } from 'expo-router'
import type { WebBridgeMessage, NavigatePayload, SharePayload } from '@/types/bridge'

// JavaScript injetado na página web para expor a bridge
const INJECTED_JS = `
  window.ReactNativeBridge = {
    postMessage: function(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    }
  };
  true;
`

export const WebViewBridge = forwardRef<WebView, WebViewProps>(function WebViewBridge(props, ref) {
  const router = useRouter()

  function handleMessage(event: WebViewMessageEvent) {
    let msg: WebBridgeMessage
    try {
      msg = JSON.parse(event.nativeEvent.data) as WebBridgeMessage
    } catch {
      console.warn('[WebViewBridge] mensagem não-JSON recebida:', event.nativeEvent.data)
      return
    }

    switch (msg.type) {
      case 'NAVIGATE': {
        const { path } = msg.payload as NavigatePayload
        router.push(path as never)
        break
      }
      case 'SHARE': {
        const sharePayload = msg.payload as SharePayload
        Share.share({
          title: sharePayload.title,
          message: sharePayload.message,
          url: sharePayload.url,
        }).catch(() => {/* silencioso */})
        break
      }
      case 'VIBRATE': {
        Vibration.vibrate(200)
        break
      }
      case 'PUSH_TOKEN': {
        // Token gerenciado pelo usePushToken hook — ignorar aqui
        break
      }
      default:
        console.warn('[WebViewBridge] tipo desconhecido:', (msg as WebBridgeMessage).type)
    }

    // Chama onMessage original se fornecido
    props.onMessage?.(event)
  }

  return (
    <WebView
      ref={ref}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      injectedJavaScript={INJECTED_JS}
      injectedJavaScriptBeforeContentLoaded={INJECTED_JS}
      {...props}
      onMessage={handleMessage}
    />
  )
})
