/**
 * ExpoPushService — envio de push notifications via Expo Push Notifications API.
 * Falhas são best-effort: erros são logados mas NÃO bloqueam o fluxo principal.
 * @see module-8-doacao-form/TASK-3/ST002
 */

export interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
}

export class ExpoPushService {
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

  /**
   * Envia um lote de mensagens push via Expo.
   * Expo suporta até 100 mensagens por requisição.
   */
  async sendBatch(messages: ExpoPushMessage[]): Promise<{ sent: number; failed: number }> {
    if (!messages.length) return { sent: 0, failed: 0 }

    // Expo push tokens começam com "ExponentPushToken["
    const validMessages = messages.filter((m) => m.to.startsWith('ExponentPushToken['))
    if (!validMessages.length) return { sent: 0, failed: messages.length }

    // Chunks de 100 (limite da Expo API)
    const chunks: ExpoPushMessage[][] = []
    for (let i = 0; i < validMessages.length; i += 100) {
      chunks.push(validMessages.slice(i, i + 100))
    }

    let sent = 0
    let failed = 0

    for (const chunk of chunks) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const res = await fetch(this.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...(process.env.EXPO_ACCESS_TOKEN
              ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
              : {}),
          },
          body: JSON.stringify(chunk),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          console.warn(`[ExpoPushService] API retornou ${res.status}`)
          failed += chunk.length
          continue
        }

        const result = await res.json()
        // result.data é array com { status: 'ok' | 'error' } por mensagem
        if (result.data && Array.isArray(result.data)) {
          for (const item of result.data) {
            if (item.status === 'ok') sent++
            else failed++
          }
        } else {
          sent += chunk.length
        }
      } catch (err) {
        console.warn('[ExpoPushService] Erro ao enviar push:', err)
        failed += chunk.length
      }
    }

    return { sent, failed }
  }

  /** Envia uma única mensagem push. */
  async send(message: ExpoPushMessage): Promise<boolean> {
    const { sent } = await this.sendBatch([message])
    return sent > 0
  }
}

export const expoPushService = new ExpoPushService()
