/**
 * push-handlers.ts — Handlers de ações de push notification no lado do cliente.
 * Processa deep-links de notificações push para navegação e ações pré-carregadas.
 *
 * Uso: importar em _layout.tsx ou no AuthProvider para registrar listeners.
 * @see intake-review/TASK-2/ST004 — gap CL-087
 */

export type PushNotificationPayload = {
  action?: string
  donationId?: string
  codeId?: string
  screen?: string
  [key: string]: unknown
}

export type PushHandlerOptions = {
  /** Função de navegação (ex: router.push do Next.js) */
  navigate: (path: string) => void
  /** Função de toast para feedback ao usuário */
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

/**
 * Processa payload de push notification e executa a navegação adequada.
 *
 * Ações suportadas:
 *   - EXTEND_DONATION: navega para dashboard com detalhe da doação
 *   - SOBROU: navega para tela de retirada com doação específica
 *   - DONATION_CANCELLED: navega para tela de retirada (buscar outra)
 *
 * @example
 * // Em _layout.tsx ou AuthProvider:
 * useEffect(() => {
 *   const unsub = Notifications.addNotificationResponseReceivedListener((response) => {
 *     handlePushNotification(response.notification.request.content.data, {
 *       navigate: router.push,
 *       showToast: (msg) => toast(msg),
 *     })
 *   })
 *   return () => unsub.remove()
 * }, [])
 */
export function handlePushNotification(
  data: PushNotificationPayload,
  options: PushHandlerOptions
): void {
  const { navigate, showToast } = options

  switch (data.action) {
    case 'EXTEND_DONATION': {
      if (!data.donationId) {
        showToast('Não foi possível identificar a doação.', 'error')
        return
      }

      // Verificar se a doação ainda está no prazo será feito na tela
      // Navegar para o dashboard do doador com o ID da doação em foco
      navigate(`/doador?donationId=${data.donationId}`)
      break
    }

    case 'SOBROU': {
      if (data.donationId) {
        navigate(`/retirar/${data.donationId}`)
      } else {
        navigate('/retirar')
      }
      break
    }

    case 'DONATION_CANCELLED': {
      showToast('A doação que você reservou foi cancelada.', 'info')
      navigate('/retirar')
      break
    }

    default: {
      // Ação desconhecida — navegar para home sem feedback
      if (data.screen) {
        const screenRoutes: Record<string, string> = {
          DashboardScreen: '/doador',
          RetiradaScreen: '/retirar',
          HomeScreen: '/',
        }
        const path = screenRoutes[data.screen]
        if (path) navigate(path)
      }
      break
    }
  }
}
