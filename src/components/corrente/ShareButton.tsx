"use client"

import * as React from "react"
import { Share2, Copy, Check, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/useToast"
import { useShareCorrente } from "./use-share-corrente"
import { cn } from "@/lib/utils"

/**
 * Fire-and-forget tracking de compartilhamento.
 * @see intake-review/TASK-9/ST003 — gap CL-295
 */
function trackShare(channel: string, context = "corrente-bem"): void {
  try {
    void fetch("/api/v1/metrics/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, context }),
      keepalive: true,
    }).catch(() => {
      // Silencioso — tracking nunca quebra share
    })
  } catch {
    // Silencioso
  }
}

interface ShareButtonProps {
  refeicoesHoje: number
  shareUrl: string
  className?: string
}

/** Gera imagem PNG 1080x1080 via html2canvas para compartilhamento */
async function generateShareImage(data: {
  refeicoesHoje: number
  shareUrl: string
}): Promise<File | null> {
  try {
    // Criar canvas temporário
    const html2canvas = (await import("html2canvas")).default
    const container = document.createElement("div")
    container.style.cssText = [
      "position:fixed", "left:-9999px", "top:0",
      "width:1080px", "height:1080px",
      "background:#16a34a", "color:#fff",
      "display:flex", "flex-direction:column",
      "align-items:center", "justify-content:center",
      "font-family:sans-serif", "padding:80px",
      "box-sizing:border-box",
    ].join(";")
    container.innerHTML = `
      <div style="font-size:72px;margin-bottom:32px">🍽️</div>
      <div style="font-size:48px;font-weight:900;text-align:center;line-height:1.2;margin-bottom:24px">
        Fiz parte da<br/>Corrente do Bem!
      </div>
      <div style="font-size:36px;text-align:center;opacity:0.9;margin-bottom:40px">
        Hoje ${data.refeicoesHoje} refeição${data.refeicoesHoje !== 1 ? 'ões' : ''}<br/>foi compartilhada
      </div>
      <div style="font-size:22px;opacity:0.8">#PratoSolidário</div>
      <div style="font-size:18px;opacity:0.6;margin-top:16px">${data.shareUrl}</div>
    `
    document.body.appendChild(container)

    const canvas = await html2canvas(container, {
      width: 1080,
      height: 1080,
      scale: 1,
      useCORS: true,
      logging: false,
    })
    document.body.removeChild(container)

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return }
        resolve(new File([blob], "corrente-do-bem.png", { type: "image/png" }))
      }, "image/png")
    })
  } catch {
    return null
  }
}

/** Tenta compartilhar para Instagram; fallback: copia link e abre instagram.com */
async function shareToInstagram(data: {
  refeicoesHoje: number
  shareUrl: string
}): Promise<"shared" | "clipboard" | "error"> {
  const imageFile = await generateShareImage(data)

  // Tenta Web Share com arquivo
  if (
    imageFile &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [imageFile] })
  ) {
    try {
      await navigator.share({
        files: [imageFile],
        text: `Fiz parte da Corrente do Bem! 🌱 #PratoSolidário`,
      })
      trackShare("instagram", "corrente-bem-image")
      return "shared"
    } catch (err) {
      if ((err as Error).name === "AbortError") return "error"
    }
  }

  // Fallback: copiar link e abrir Instagram
  try {
    await navigator.clipboard.writeText(data.shareUrl)
  } catch {
    // silencioso
  }
  window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer")
  trackShare("instagram", "clipboard-fallback")
  return "clipboard"
}

export function ShareButton({ refeicoesHoje, shareUrl, className }: ShareButtonProps) {
  const { share, canShare, copied, shareError, getShareText } = useShareCorrente()
  const toast = useToast()
  const [instagramLoading, setInstagramLoading] = React.useState(false)

  React.useEffect(() => {
    if (copied) {
      toast.success("Link copiado!", { duration: 3000 })
    }
  }, [copied, toast])

  React.useEffect(() => {
    if (shareError) {
      toast.error(shareError, { duration: 6000 })
    }
  }, [shareError, toast])

  const handleShare = async () => {
    await share({ refeicoesHoje, shareUrl })
    trackShare(canShare ? "web-share" : "clipboard")
  }

  const handleInstagram = async () => {
    setInstagramLoading(true)
    try {
      const result = await shareToInstagram({ refeicoesHoje, shareUrl })
      if (result === "clipboard") {
        toast.success("Link copiado! Cole no Instagram.", { duration: 4000 })
      }
    } finally {
      setInstagramLoading(false)
    }
  }

  const shareText = encodeURIComponent(getShareText(refeicoesHoje))
  const encodedUrl = encodeURIComponent(shareUrl)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Botão principal adaptativo */}
      <Button
        onClick={handleShare}
        disabled={copied}
        className="w-full min-h-[44px]"
        aria-label={
          copied
            ? "Link copiado com sucesso"
            : canShare
              ? "Compartilhar impacto da Corrente do Bem"
              : "Copiar link da Corrente do Bem"
        }
        aria-pressed={copied ? "true" : undefined}
        data-testid="share-button-main"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-2 text-green-300" aria-hidden="true" />
            Link copiado!
          </>
        ) : canShare ? (
          <>
            <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
            Compartilhar
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
            Copiar link
          </>
        )}
      </Button>

      {/* Links diretos de rede social — apenas quando Web Share não disponível */}
      {!canShare && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex-1"
            asChild
            aria-label="Compartilhar no WhatsApp"
          >
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="share-whatsapp"
              onClick={() => trackShare("whatsapp")}
            >
              <MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />
              WhatsApp
            </a>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex-1"
            asChild
            aria-label="Compartilhar no Twitter"
          >
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="share-twitter"
              onClick={() => trackShare("twitter")}
            >
              <svg
                className="h-4 w-4 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.254 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Twitter/X
            </a>
          </Button>

          {/* Instagram — gera imagem 1080x1080 via html2canvas */}
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] flex-1"
            onClick={handleInstagram}
            disabled={instagramLoading}
            aria-label="Compartilhar no Instagram"
            data-testid="share-instagram"
          >
            {instagramLoading ? (
              <>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 mr-2 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  data-testid="instagram-loading"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Gerando...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
