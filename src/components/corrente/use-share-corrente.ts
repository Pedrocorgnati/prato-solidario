import { useState, useCallback } from "react"
import { formatRefeicoes } from "@/utils/formatters"

interface ShareCorrenteData {
  refeicoesHoje: number
  shareUrl: string
}

interface UseShareCorrenteReturn {
  share: (data: ShareCorrenteData) => Promise<void>
  canShare: boolean
  copied: boolean
  shareError: string | null
  getShareText: (refeicoesHoje: number) => string
}

function buildShareText(refeicoesHoje: number): string {
  const refeicaoText = formatRefeicoes(refeicoesHoje)
    .replace(/^\d+\s/, "")
  return `Fiz parte da Corrente do Bem! 🌱 Hoje, ${refeicoesHoje} ${refeicaoText} ${refeicoesHoje === 1 ? "foi compartilhada" : "foram compartilhadas"}. #PratoSolidário`
}

export function useShareCorrente(): UseShareCorrenteReturn {
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function"

  const getShareText = useCallback(
    (refeicoesHoje: number) => buildShareText(refeicoesHoje),
    []
  )

  const share = useCallback(
    async ({ refeicoesHoje, shareUrl }: ShareCorrenteData) => {
      setShareError(null)

      const shareText = buildShareText(refeicoesHoje)

      // Tenta Web Share API (mobile nativo)
      if (canShare) {
        try {
          await navigator.share({
            title: "Fiz parte da Corrente do Bem!",
            text: shareText,
            url: shareUrl,
          })
          return
        } catch (err) {
          // Usuário cancelou — silencioso
          if ((err as Error).name === "AbortError") return
          // Outro erro → fallback para clipboard
        }
      }

      // Fallback: copiar para clipboard
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      } catch {
        // Fallback final: prompt manual
        window.prompt("Copie o link:", shareUrl)
        setShareError(`Não foi possível copiar. Copie manualmente: ${shareUrl}`)
      }
    },
    [canShare]
  )

  return { share, canShare, copied, shareError, getShareText }
}
