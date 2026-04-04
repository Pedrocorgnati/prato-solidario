"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { PhoneInput } from "@/components/shared/phone-input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateProfile } from "@/actions/users"

export default function PerfilDoadorPage() {
  const [loading, setLoading] = React.useState(false)
  const [phone, setPhone] = React.useState("")

  async function handleSave() {
    setLoading(true)
    try {
      await updateProfile({ phone })
      toast.success("Perfil atualizado!")
    } catch {
      toast.error("Erro ao atualizar perfil.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Meu Perfil</h1>
      <PhotoUpload label="Foto de perfil" />
      <div className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" defaultValue="João da Silva" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" defaultValue="joao@email.com" disabled />
          <p className="text-xs text-[var(--color-text-muted)]">O e-mail não pode ser alterado</p>
        </div>
        <PhoneInput value={phone} onChange={setPhone} />
      </div>
      <Button variant="default" size="lg" className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Salvar alterações"}
      </Button>
    </div>
  )
}
