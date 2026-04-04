"use client"

import * as React from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WizardForm } from "@/components/shared/wizard-form"
import { CepInput } from "@/components/shared/cep-input"
import { DocumentInput } from "@/components/shared/document-input"
import { PhoneInput } from "@/components/shared/phone-input"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { SchedulePicker } from "@/components/shared/schedule-picker"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"

function Step1() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados da marmitaria</h2>
      <div className="space-y-1">
        <Label htmlFor="name">Nome da marmitaria</Label>
        <Input id="name" placeholder="Marmitaria da Dona Maria" />
      </div>
      <DocumentInput type="auto" required />
    </div>
  )
}

function Step2() {
  const [phone, setPhone] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Responsável</h2>
      <div className="space-y-1">
        <Label htmlFor="responsavel">Nome do responsável</Label>
        <Input id="responsavel" placeholder="Maria da Silva" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="contato@marmitaria.com.br" />
      </div>
      <PhoneInput value={phone} onChange={setPhone} required />
    </div>
  )
}

function Step3() {
  const [cep, setCep] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Endereço de entrega</h2>
      <CepInput value={cep} onChange={setCep} required />
      <div className="space-y-1">
        <Label htmlFor="address">Rua e número</Label>
        <Input id="address" placeholder="Rua das Flores, 123" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="complement">Complemento</Label>
        <Input id="complement" placeholder="Apto 12, Bloco B" />
      </div>
    </div>
  )
}

function Step4() {
  const [start, setStart] = React.useState("")
  const [end, setEnd] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Cardápio e capacidade</h2>
      <div className="space-y-1">
        <Label htmlFor="price">Preço por marmita (R$)</Label>
        <Input id="price" type="text" placeholder="0,00" inputMode="decimal" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="capacity">Capacidade diária (marmitas)</Label>
        <Input id="capacity" type="text" inputMode="numeric" placeholder="50" />
      </div>
      <SchedulePicker startValue={start} endValue={end} onStartChange={setStart} onEndChange={setEnd} />
    </div>
  )
}

function Step5() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Foto da marmitaria</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Uma boa foto aumenta as chances de receber patrocínios.
      </p>
      <PhotoUpload label="Foto da marmitaria" />
    </div>
  )
}

function Step6() {
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
      <div className="rounded-md bg-[var(--color-info)]/10 border border-[var(--color-info)]/20 p-3 text-sm text-[var(--color-info)]">
        Após o cadastro, você precisará conectar sua conta Mercado Pago para receber pagamentos.
      </div>
    </div>
  )
}

export default function CadastroMarmitariaPage() {
  const router = useRouter()
  const steps = [
    { label: "Marmitaria", content: <Step1 /> },
    { label: "Responsável", content: <Step2 /> },
    { label: "Endereço", content: <Step3 /> },
    { label: "Cardápio", content: <Step4 /> },
    { label: "Foto", content: <Step5 /> },
    { label: "Senha", content: <Step6 /> },
  ]

  function handleComplete() {
    toast.success("Cadastro enviado! Aguarde aprovação.")
    router.push(ROUTES.MARMITARIA_MP_CONNECT)
  }

  return <WizardForm steps={steps} onComplete={handleComplete} completeLabel="Enviar cadastro" />
}
