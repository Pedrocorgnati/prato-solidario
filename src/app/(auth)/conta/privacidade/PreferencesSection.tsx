"use client"

/**
 * Toggles granulares de preferencias LGPD — TASK-5/ST003 (intake-review).
 * Persiste via PUT /api/v1/users/me/preferences.
 */
import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

type Preferences = {
  analytics: boolean
  geolocation: boolean
  pushCodeGenerated: boolean
  pushSobrou: boolean
  pushAdmin: boolean
  emailMarketing: boolean
}

const DEFAULTS: Preferences = {
  analytics: false,
  geolocation: false,
  pushCodeGenerated: true,
  pushSobrou: true,
  pushAdmin: true,
  emailMarketing: false,
}

type Item = {
  key: keyof Preferences
  label: string
  description: string
}

const SECTIONS: { title: string; items: Item[] }[] = [
  {
    title: "Análise de uso",
    items: [
      {
        key: "analytics",
        label: "Permitir analytics",
        description: "Coleta anônima de uso para melhorar a plataforma.",
      },
    ],
  },
  {
    title: "Localização",
    items: [
      {
        key: "geolocation",
        label: "Usar localização aproximada",
        description: "Permite sugerir doações próximas de você.",
      },
    ],
  },
  {
    title: "Notificações push",
    items: [
      {
        key: "pushCodeGenerated",
        label: "Código gerado",
        description: "Avisa quando seu código de retirada é criado.",
      },
      {
        key: "pushSobrou",
        label: "Sobrou!",
        description: "Alerta de refeições disponíveis próximas de você.",
      },
      {
        key: "pushAdmin",
        label: "Avisos administrativos",
        description: "Mensagens importantes da equipe Prato Solidário.",
      },
    ],
  },
  {
    title: "E-mails",
    items: [
      {
        key: "emailMarketing",
        label: "E-mails de marketing",
        description: "Novidades, campanhas e convites para eventos.",
      },
    ],
  },
]

export function PreferencesSection() {
  const [prefs, setPrefs] = React.useState<Preferences>(DEFAULTS)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/v1/users/me/preferences", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        const json = (await res.json()) as { data: Preferences }
        if (!cancelled) setPrefs({ ...DEFAULTS, ...json.data })
      })
      .catch(() => {
        if (!cancelled) toast.error("Não foi possível carregar suas preferências.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function toggle(key: keyof Preferences) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  async function onSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/v1/users/me/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error(String(res.status))
      const json = (await res.json()) as { data: Preferences }
      setPrefs({ ...DEFAULTS, ...json.data })
      toast.success("Preferências atualizadas.")
    } catch {
      toast.error("Erro ao salvar. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section aria-busy="true">
        <h2 className="mb-4 text-lg font-medium">Preferências</h2>
        <LoadingSkeleton variant="card" count={2} />
      </section>
    )
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-medium">Preferências</h2>
      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <fieldset key={section.title} className="space-y-3 rounded-lg border p-4">
            <legend className="px-2 text-sm font-semibold">{section.title}</legend>
            {section.items.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                <Checkbox
                  id={`pref-${item.key}`}
                  checked={prefs[item.key]}
                  onCheckedChange={() => toggle(item.key)}
                />
                <div className="flex-1">
                  <Label htmlFor={`pref-${item.key}`} className="font-medium">
                    {item.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar preferências"}
        </Button>
      </div>
    </section>
  )
}
