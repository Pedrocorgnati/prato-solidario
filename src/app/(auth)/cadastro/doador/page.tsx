"use client"

import * as React from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WizardForm } from "@/components/shared/wizard-form"
import { CepInput } from "@/components/shared/cep-input"
import { PhoneInput } from "@/components/shared/phone-input"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"

function Step1() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Seus dados</h2>
      <div className="space-y-1">
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" placeholder="João da Silva" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="joao@email.com" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" placeholder="Mínimo 8 caracteres" />
      </div>
    </div>
  )
}

function Step2() {
  const [phone, setPhone] = React.useState("")
  const [cep, setCep] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Contato e endereço</h2>
      <PhoneInput value={phone} onChange={setPhone} required />
      <CepInput value={cep} onChange={setCep} required />
      <div className="space-y-1">
        <Label htmlFor="address">Endereço</Label>
        <Input id="address" placeholder="Rua, número, bairro" />
      </div>
    </div>
  )
}

function Step3() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Tipo de doação</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">
        O que você pretende doar com mais frequência?
      </p>
      {["Refeições prontas", "Ingredientes frescos", "Lanches/salgados", "Frutas e vegetais", "Outro"].map((tipo) => (
        <label key={tipo} className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="h-4 w-4 rounded" />
          <span className="text-sm text-[var(--color-text-primary)]">{tipo}</span>
        </label>
      ))}
    </div>
  )
}

export default function CadastroDoadorPage() {
  const router = useRouter()

  const steps = [
    { label: "Dados pessoais", content: <Step1 /> },
    { label: "Contato", content: <Step2 /> },
    { label: "Preferências", content: <Step3 /> },
  ]

  function handleComplete() {
    toast.success("Cadastro realizado! Verifique seu e-mail.")
    router.push(ROUTES.VERIFICAR_EMAIL)
  }

  return <WizardForm steps={steps} onComplete={handleComplete} completeLabel="Criar conta" />
}
