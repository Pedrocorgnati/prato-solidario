"use client"

import * as React from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WizardForm } from "@/components/shared/wizard-form"
import { CepInput } from "@/components/shared/cep-input"
import { DocumentInput } from "@/components/shared/document-input"
import { PhoneInput } from "@/components/shared/phone-input"
import { SchedulePicker } from "@/components/shared/schedule-picker"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"

function Step1() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados do restaurante</h2>
      <div className="space-y-1">
        <Label htmlFor="name">Nome do restaurante</Label>
        <Input id="name" placeholder="Restaurante Sabor & Arte" />
      </div>
      <DocumentInput type="cnpj" label="CNPJ" required />
    </div>
  )
}

function Step2() {
  const [phone, setPhone] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Contato</h2>
      <div className="space-y-1">
        <Label htmlFor="contactName">Nome do responsável</Label>
        <Input id="contactName" placeholder="João da Silva" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="contato@restaurante.com.br" />
      </div>
      <PhoneInput value={phone} onChange={setPhone} required />
    </div>
  )
}

function Step3() {
  const [cep, setCep] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Endereço</h2>
      <CepInput value={cep} onChange={setCep} required />
      <div className="space-y-1">
        <Label htmlFor="address">Endereço completo</Label>
        <Input id="address" placeholder="Rua, número, bairro" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="city">Cidade</Label>
        <Input id="city" placeholder="São Paulo" />
      </div>
    </div>
  )
}

function Step4() {
  const [start, setStart] = React.useState("")
  const [end, setEnd] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Horário de funcionamento</h2>
      <SchedulePicker startValue={start} endValue={end} onStartChange={setStart} onEndChange={setEnd} />
      <div className="space-y-1">
        <Label>Dias da semana</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
            <button
              key={day}
              type="button"
              className="rounded-full border border-[var(--color-border-raw)] px-3 py-1 text-xs hover:bg-[var(--color-surface)]"
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Step5() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Senha de acesso</h2>
      <div className="space-y-1">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" placeholder="Mínimo 8 caracteres" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm">Confirmar senha</Label>
        <Input id="confirm" type="password" placeholder="Repita a senha" />
      </div>
    </div>
  )
}

export default function CadastroRestaurantePage() {
  const router = useRouter()
  const steps = [
    { label: "Restaurante", content: <Step1 /> },
    { label: "Contato", content: <Step2 /> },
    { label: "Endereço", content: <Step3 /> },
    { label: "Horários", content: <Step4 /> },
    { label: "Senha", content: <Step5 /> },
  ]

  function handleComplete() {
    toast.success("Cadastro enviado! Verifique seu e-mail.")
    router.push(ROUTES.VERIFICAR_EMAIL)
  }

  return <WizardForm steps={steps} onComplete={handleComplete} completeLabel="Finalizar cadastro" />
}
