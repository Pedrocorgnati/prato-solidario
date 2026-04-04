"use client"

import * as React from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WizardForm } from "@/components/shared/wizard-form"
import { CepInput } from "@/components/shared/cep-input"
import { DocumentInput } from "@/components/shared/document-input"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants"

function Step1() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados da ONG</h2>
      <div className="space-y-1">
        <Label htmlFor="orgName">Nome da organização</Label>
        <Input id="orgName" placeholder="ONG Esperança" />
      </div>
      <DocumentInput type="cnpj" required label="CNPJ" />
    </div>
  )
}

function Step2() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Responsável e acesso</h2>
      <div className="space-y-1">
        <Label htmlFor="contactName">Nome do responsável</Label>
        <Input id="contactName" placeholder="Maria da Silva" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" placeholder="contato@ong.org.br" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" placeholder="Mínimo 8 caracteres" />
      </div>
    </div>
  )
}

function Step3() {
  const [cep, setCep] = React.useState("")
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Localização</h2>
      <CepInput value={cep} onChange={setCep} required />
      <div className="space-y-1">
        <Label htmlFor="address">Endereço completo</Label>
        <Input id="address" placeholder="Rua, número, bairro" />
      </div>
    </div>
  )
}

export default function CadastroOngPage() {
  const router = useRouter()
  const steps = [
    { label: "Dados da ONG", content: <Step1 /> },
    { label: "Responsável", content: <Step2 /> },
    { label: "Localização", content: <Step3 /> },
  ]

  function handleComplete() {
    toast.success("Cadastro enviado para análise!")
    router.push(ROUTES.VERIFICAR_EMAIL)
  }

  return <WizardForm steps={steps} onComplete={handleComplete} completeLabel="Enviar cadastro" />
}
