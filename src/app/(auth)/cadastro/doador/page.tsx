"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WizardForm } from "@/components/shared/wizard-form"
import { DocumentInput } from "@/components/shared/document-input"
import { PhoneInput } from "@/components/shared/phone-input"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { ROUTES } from "@/lib/constants"
import { registerDoadorPfAction } from "./actions"
import { stripMask } from "@/utils/formatters"
import { passwordSchema } from "@/lib/validation/password"

// ---------------------------------------------------------------------------
// Schemas de validação por etapa
// ---------------------------------------------------------------------------

const step1Schema = z
  .object({
    name: z.string().min(1, "Nome completo é obrigatório"),
    cpf: z.string().min(14, "CPF inválido"),
    birthDate: z.string().optional(),
    email: z.string().email("E-mail inválido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  })

// Endereço coletado em /perfil/configuracoes, não no cadastro (INTAKE spec)
const step2Schema = z.object({
  phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido"),
})

const step3Schema = z.object({
  termsAccepted: z.literal(true, {
    error: "Você precisa aceitar os Termos de Uso e a Política de Privacidade",
  }),
})

// ---------------------------------------------------------------------------
// Estado do formulário
// ---------------------------------------------------------------------------

interface FormState {
  // Etapa 1
  name: string
  cpf: string
  birthDate: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  // Etapa 2
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  // Etapa 3
  photoUrl: string
  termsAccepted: boolean
  newsletter: boolean
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string | boolean }
  | { type: "FILL_ADDRESS"; logradouro: string; bairro: string; cidade: string; estado: string }

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value }
    case "FILL_ADDRESS":
      return {
        ...state,
        logradouro: action.logradouro,
        bairro: action.bairro,
        cidade: action.cidade,
        estado: action.estado,
      }
    default:
      return state
  }
}

const initialState: FormState = {
  name: "",
  cpf: "",
  birthDate: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  photoUrl: "",
  termsAccepted: false,
  newsletter: false,
}

// ---------------------------------------------------------------------------
// Indicador de força de senha
// ---------------------------------------------------------------------------

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: "", color: "", width: "0%" }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { label: "fraca", color: "bg-[var(--color-danger)]", width: "33%" }
  if (score <= 3) return { label: "média", color: "bg-yellow-500", width: "66%" }
  return { label: "forte", color: "bg-green-500", width: "100%" }
}

// ---------------------------------------------------------------------------
// Componente da Etapa 1 — Dados pessoais
// ---------------------------------------------------------------------------

interface Step1Props {
  state: FormState
  dispatch: React.Dispatch<FormAction>
  errors: Partial<Record<keyof FormState, string>>
}

function Step1({ state, dispatch, errors }: Step1Props) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirm, setShowConfirm] = React.useState(false)
  const strength = getPasswordStrength(state.password)

  function field(key: keyof FormState) {
    return (value: string) => dispatch({ type: "SET_FIELD", field: key, value })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Dados pessoais</h2>

      {/* Nome completo */}
      <div className="space-y-1">
        <Label htmlFor="name" className="text-sm font-medium">
          Nome completo <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="name"
          value={state.name}
          onChange={(e) => field("name")(e.target.value)}
          placeholder="João da Silva"
          autoComplete="name"
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.name}</p>
        )}
      </div>

      {/* CPF */}
      <DocumentInput
        type="cpf"
        label="CPF"
        required
        value={state.cpf}
        onChange={field("cpf")}
        error={errors.cpf}
      />

      {/* Data de nascimento */}
      <div className="space-y-1">
        <Label htmlFor="birthDate" className="text-sm font-medium">
          Data de nascimento
        </Label>
        <Input
          id="birthDate"
          type="date"
          value={state.birthDate}
          onChange={(e) => field("birthDate")(e.target.value)}
          aria-invalid={!!errors.birthDate}
        />
      </div>

      {/* E-mail */}
      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm font-medium">
          E-mail <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={state.email}
          onChange={(e) => field("email")(e.target.value)}
          placeholder="joao@email.com"
          autoComplete="email"
          inputMode="email"
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.email}</p>
        )}
      </div>

      {/* Senha */}
      <div className="space-y-1">
        <Label htmlFor="password" className="text-sm font-medium">
          Senha <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={state.password}
            onChange={(e) => field("password")(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            className="pr-10"
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {state.password.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full rounded-full bg-[var(--color-border-raw)]">
              <div
                className={`h-full rounded-full transition-all ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <p className="text-xs text-[var(--color-text-muted)]">
              Força da senha: <span className="font-medium">{strength.label}</span>
            </p>
          </div>
        )}
        {errors.password && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.password}</p>
        )}
      </div>

      {/* Confirmar senha */}
      <div className="space-y-1">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar senha <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            value={state.confirmPassword}
            onChange={(e) => field("confirmPassword")(e.target.value)}
            placeholder="Repita a senha"
            autoComplete="new-password"
            className="pr-10"
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            aria-label={showConfirm ? "Ocultar confirmação" : "Mostrar confirmação"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.confirmPassword}</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente da Etapa 2 — Telefone
// Endereço coletado em /perfil/configuracoes, não no cadastro (INTAKE spec)
// ---------------------------------------------------------------------------

interface Step2Props {
  state: FormState
  dispatch: React.Dispatch<FormAction>
  errors: Partial<Record<keyof FormState, string>>
}

function Step2({ state, dispatch, errors }: Step2Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Contato</h2>

      {/* Telefone */}
      <PhoneInput
        label="Telefone"
        required
        value={state.phone}
        onChange={(value) => dispatch({ type: "SET_FIELD", field: "phone", value })}
        error={errors.phone}
      />

      <p className="text-xs text-[var(--color-text-muted)]">
        Seu endereço poderá ser informado depois, nas configurações do perfil.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente da Etapa 3 — Foto e termos
// ---------------------------------------------------------------------------

interface Step3Props {
  state: FormState
  dispatch: React.Dispatch<FormAction>
  errors: Partial<Record<keyof FormState, string>>
  isSubmitting: boolean
}

function Step3({ state, dispatch, errors, isSubmitting }: Step3Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Foto e termos</h2>

      {/* Foto de perfil */}
      <PhotoUpload
        label="Foto de perfil (opcional)"
        value={state.photoUrl}
        onChange={(url) => dispatch({ type: "SET_FIELD", field: "photoUrl", value: url })}
        onRemove={() => dispatch({ type: "SET_FIELD", field: "photoUrl", value: "" })}
      />

      {/* Termos de uso */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={state.termsAccepted}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "termsAccepted", value: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-raw)] accent-[var(--color-primary-raw)]"
            aria-invalid={!!errors.termsAccepted}
          />
          <span className="text-sm text-[var(--color-text-primary)]">
            Li e aceito os{" "}
            <a
              href={ROUTES.TERMOS}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[var(--color-primary-raw)] hover:opacity-80"
            >
              Termos de Uso
            </a>{" "}
            e a{" "}
            <a
              href={ROUTES.PRIVACIDADE}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-[var(--color-primary-raw)] hover:opacity-80"
            >
              Política de Privacidade
            </a>{" "}
            <span className="text-[var(--color-danger)]">*</span>
          </span>
        </label>
        {errors.termsAccepted && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.termsAccepted}</p>
        )}

        {/* Newsletter */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={state.newsletter}
            onChange={(e) =>
              dispatch({ type: "SET_FIELD", field: "newsletter", value: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 rounded border-[var(--color-border-raw)] accent-[var(--color-primary-raw)]"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">
            Desejo receber novidades por e-mail
          </span>
        </label>
      </div>

      {/* Botão de submit customizado — visível dentro do content para loading state visível */}
      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Criando conta...</span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function CadastroDoadorPage() {
  const router = useRouter()
  const [state, dispatch] = React.useReducer(formReducer, initialState)
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Valida etapa específica — retorna true se válido, falso e define erros se inválido
  function validateStep(step: number): boolean {
    if (step === 0) {
      const result = step1Schema.safeParse({
        name: state.name,
        cpf: state.cpf,
        birthDate: state.birthDate,
        email: state.email,
        password: state.password,
        confirmPassword: state.confirmPassword,
      })
      if (!result.success) {
        const newErrors: Partial<Record<keyof FormState, string>> = {}
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof FormState
          if (key) newErrors[key] = issue.message
        }
        setErrors(newErrors)
        return false
      }
      setErrors({})
      return true
    }

    if (step === 1) {
      const result = step2Schema.safeParse({
        phone: state.phone,
      })
      if (!result.success) {
        const newErrors: Partial<Record<keyof FormState, string>> = {}
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof FormState
          if (key) newErrors[key] = issue.message
        }
        setErrors(newErrors)
        return false
      }
      setErrors({})
      return true
    }

    return true
  }

  // onBeforeNext — chamado pelo WizardForm antes de avançar etapas intermediárias
  function handleBeforeNext(step: number): boolean {
    return validateStep(step)
  }

  // onComplete — chamado pelo WizardForm apenas na etapa final ("Criar conta")
  async function handleComplete() {
    // Valida etapa 3 antes de submeter
    const step3Result = step3Schema.safeParse({ termsAccepted: state.termsAccepted })
    if (!step3Result.success) {
      const newErrors: Partial<Record<keyof FormState, string>> = {}
      for (const issue of step3Result.error.issues) {
        const key = issue.path[0] as keyof FormState
        if (key) newErrors[key] = issue.message
      }
      setErrors(newErrors)
      return
    }
    setErrors({})

    // Etapa final — submit
    setIsSubmitting(true)
    try {
      const payload = {
        name: state.name,
        cpf: stripMask(state.cpf),
        birthDate: state.birthDate || undefined,
        email: state.email,
        password: state.password,
        phone: state.phone ? stripMask(state.phone) : undefined,
        address: {
          cep: stripMask(state.cep),
          logradouro: state.logradouro,
          numero: state.numero,
          complemento: state.complemento || undefined,
          bairro: state.bairro,
          cidade: state.cidade,
          estado: state.estado,
        },
        photoUrl: state.photoUrl || undefined,
        newsletter: state.newsletter,
      }

      const result = await registerDoadorPfAction(payload)

      if (!result.success) {
        toast.error(result.error ?? "Erro ao criar conta. Tente novamente.")
        return
      }

      toast.success("Conta criada! Verifique seu e-mail para confirmar o cadastro.")
      router.push(`${ROUTES.VERIFICAR_EMAIL}?email=${encodeURIComponent(state.email)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    {
      label: "Dados pessoais",
      content: <Step1 state={state} dispatch={dispatch} errors={errors} />,
    },
    {
      label: "Contato",
      content: <Step2 state={state} dispatch={dispatch} errors={errors} />,
    },
    {
      label: "Foto e termos",
      content: (
        <Step3
          state={state}
          dispatch={dispatch}
          errors={errors}
          isSubmitting={isSubmitting}
        />
      ),
    },
  ]

  return (
    <WizardForm
      steps={steps}
      onBeforeNext={handleBeforeNext}
      onComplete={handleComplete}
      completeLabel={isSubmitting ? "Criando conta..." : "Criar conta"}
      completeDisabled={isSubmitting}
    />
  )
}
