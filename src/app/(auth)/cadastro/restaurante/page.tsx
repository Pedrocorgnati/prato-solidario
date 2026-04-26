"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { useReducer, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ChevronLeft } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { StepIndicator } from "@/components/ui/step-indicator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DocumentInput } from "@/components/shared/document-input"
import { CepInput } from "@/components/shared/cep-input"
import { PhoneInput } from "@/components/shared/phone-input"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { SchedulePicker } from "@/components/shared/schedule-picker"

import { registerRestauranteAction } from "./actions"
import { ROUTES } from "@/lib/constants"
import { stripMask } from "@/utils/formatters"

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface Step1State {
  responsavelName: string
  cpf: string
  email: string
  password: string
  confirmPassword: string
}

interface Step2State {
  tradeName: string
  cnpj: string
  cuisineType: string
  phone: string
  logoUrl: string
}

interface Step3State {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

interface Step4State {
  businessDays: number[]
  businessHours: Record<string, { open: string; close: string }>
  averagePortions: string
  preferredWindow: "" | "manha" | "tarde" | "noite"
}

interface Step5State {
  termsAccepted: boolean
}

interface FormState {
  step1: Step1State
  step2: Step2State
  step3: Step3State
  step4: Step4State
  step5: Step5State
}

type FormAction =
  | { type: "SET_STEP1"; payload: Partial<Step1State> }
  | { type: "SET_STEP2"; payload: Partial<Step2State> }
  | { type: "SET_STEP3"; payload: Partial<Step3State> }
  | { type: "SET_STEP4"; payload: Partial<Step4State> }
  | { type: "TOGGLE_DAY"; day: number }
  | { type: "SET_HOURS"; day: number; field: "open" | "close"; value: string }
  | { type: "SET_STEP5"; payload: Partial<Step5State> }

const initialState: FormState = {
  step1: { responsavelName: "", cpf: "", email: "", password: "", confirmPassword: "" },
  step2: { tradeName: "", cnpj: "", cuisineType: "", phone: "", logoUrl: "" },
  step3: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" },
  step4: { businessDays: [], businessHours: {}, averagePortions: "", preferredWindow: "" },
  step5: { termsAccepted: false },
}

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_STEP1":
      return { ...state, step1: { ...state.step1, ...action.payload } }
    case "SET_STEP2":
      return { ...state, step2: { ...state.step2, ...action.payload } }
    case "SET_STEP3":
      return { ...state, step3: { ...state.step3, ...action.payload } }
    case "SET_STEP4":
      return { ...state, step4: { ...state.step4, ...action.payload } }
    case "TOGGLE_DAY": {
      const days = state.step4.businessDays
      const exists = days.includes(action.day)
      const newDays = exists ? days.filter((d) => d !== action.day) : [...days, action.day]
      // Remove hours for deselected day
      const newHours = { ...state.step4.businessHours }
      if (exists) delete newHours[String(action.day)]
      return {
        ...state,
        step4: { ...state.step4, businessDays: newDays, businessHours: newHours },
      }
    }
    case "SET_HOURS": {
      const prev = state.step4.businessHours[String(action.day)] ?? { open: "", close: "" }
      return {
        ...state,
        step4: {
          ...state.step4,
          businessHours: {
            ...state.step4.businessHours,
            [String(action.day)]: { ...prev, [action.field]: action.value },
          },
        },
      }
    }
    case "SET_STEP5":
      return { ...state, step5: { ...state.step5, ...action.payload } }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

interface Errors {
  [key: string]: string
}

function validateStep1(s: Step1State): Errors {
  const e: Errors = {}
  if (!s.responsavelName.trim()) e.responsavelName = "Nome do responsável é obrigatório"
  if (stripMask(s.cpf).length !== 11) e.cpf = "CPF inválido"
  if (!s.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) e.email = "E-mail inválido"
  if (s.password.length < 8) e.password = "A senha deve ter no mínimo 8 caracteres"
  if (s.confirmPassword !== s.password) e.confirmPassword = "As senhas não coincidem"
  return e
}

function validateStep2(s: Step2State): Errors {
  const e: Errors = {}
  if (!s.tradeName.trim()) e.tradeName = "Nome do restaurante é obrigatório"
  if (stripMask(s.cnpj).length !== 14) e.cnpj = "CNPJ inválido"
  if (!s.cuisineType) e.cuisineType = "Tipo de cozinha é obrigatório"
  return e
}

function validateStep3(s: Step3State): Errors {
  const e: Errors = {}
  if (stripMask(s.cep).length < 8) e.cep = "CEP é obrigatório"
  if (!s.logradouro.trim()) e.logradouro = "Logradouro é obrigatório"
  if (!s.numero.trim()) e.numero = "Número é obrigatório"
  if (!s.bairro.trim()) e.bairro = "Bairro é obrigatório"
  if (!s.cidade.trim()) e.cidade = "Cidade é obrigatória"
  if (s.estado.length !== 2) e.estado = "UF inválida (ex: SP)"
  return e
}

function validateStep4(s: Step4State): Errors {
  const e: Errors = {}
  if (s.businessDays.length === 0) e.businessDays = "Selecione ao menos um dia de funcionamento"
  return e
}

function validateStep5(s: Step5State): Errors {
  const e: Errors = {}
  if (!s.termsAccepted) e.termsAccepted = "Você precisa aceitar os termos para continuar"
  return e
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

const DAYS = [
  { label: "Dom", value: 0 },
  { label: "Seg", value: 1 },
  { label: "Ter", value: 2 },
  { label: "Qua", value: 3 },
  { label: "Qui", value: 4 },
  { label: "Sex", value: 5 },
  { label: "Sáb", value: 6 },
]

const CUISINE_OPTIONS = [
  "Brasileira",
  "Italiana",
  "Árabe",
  "Japonesa",
  "Vegetariana/Vegana",
  "Mista",
  "Outro",
]

const WINDOW_OPTIONS: { label: string; value: "manha" | "tarde" | "noite" }[] = [
  { label: "Manhã", value: "manha" },
  { label: "Tarde", value: "tarde" },
  { label: "Noite", value: "noite" },
]

interface Step1Props {
  data: Step1State
  dispatch: React.Dispatch<FormAction>
  errors: Errors
}

function Step1({ data, dispatch, errors }: Step1Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados do responsável</h2>

      <div className="space-y-1">
        <Label htmlFor="responsavelName">
          Nome do responsável <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="responsavelName"
          value={data.responsavelName}
          onChange={(e) => dispatch({ type: "SET_STEP1", payload: { responsavelName: e.target.value } })}
          placeholder="João da Silva"
          aria-invalid={!!errors.responsavelName}
          className={errors.responsavelName ? "border-[var(--color-danger)]" : ""}
        />
        {errors.responsavelName && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.responsavelName}</p>
        )}
      </div>

      <DocumentInput
        type="cpf"
        label="CPF"
        required
        value={data.cpf}
        onChange={(v) => dispatch({ type: "SET_STEP1", payload: { cpf: v } })}
        error={errors.cpf}
      />

      <div className="space-y-1">
        <Label htmlFor="email">
          E-mail <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={data.email}
          onChange={(e) => dispatch({ type: "SET_STEP1", payload: { email: e.target.value } })}
          placeholder="contato@restaurante.com.br"
          aria-invalid={!!errors.email}
          className={errors.email ? "border-[var(--color-danger)]" : ""}
        />
        {errors.email && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="password">
          Senha <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          value={data.password}
          onChange={(e) => dispatch({ type: "SET_STEP1", payload: { password: e.target.value } })}
          placeholder="Mínimo 8 caracteres"
          aria-invalid={!!errors.password}
          className={errors.password ? "border-[var(--color-danger)]" : ""}
        />
        {errors.password && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.password}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword">
          Confirmar senha <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={data.confirmPassword}
          onChange={(e) => dispatch({ type: "SET_STEP1", payload: { confirmPassword: e.target.value } })}
          placeholder="Repita a senha"
          aria-invalid={!!errors.confirmPassword}
          className={errors.confirmPassword ? "border-[var(--color-danger)]" : ""}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.confirmPassword}</p>
        )}
      </div>
    </div>
  )
}

interface Step2Props {
  data: Step2State
  dispatch: React.Dispatch<FormAction>
  errors: Errors
}

function Step2({ data, dispatch, errors }: Step2Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados do restaurante</h2>

      <div className="space-y-1">
        <Label htmlFor="tradeName">
          Nome do restaurante <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="tradeName"
          value={data.tradeName}
          onChange={(e) => dispatch({ type: "SET_STEP2", payload: { tradeName: e.target.value } })}
          placeholder="Restaurante Sabor & Arte"
          aria-invalid={!!errors.tradeName}
          className={errors.tradeName ? "border-[var(--color-danger)]" : ""}
        />
        {errors.tradeName && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.tradeName}</p>
        )}
      </div>

      <DocumentInput
        type="cnpj"
        label="CNPJ"
        required
        value={data.cnpj}
        onChange={(v) => dispatch({ type: "SET_STEP2", payload: { cnpj: v } })}
        error={errors.cnpj}
      />

      <div className="space-y-1">
        <Label>
          Tipo de cozinha <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Select
          value={data.cuisineType ?? undefined}
          onValueChange={(v) => dispatch({ type: "SET_STEP2", payload: { cuisineType: v ?? undefined } })}
        >
          <SelectTrigger className="w-full" aria-invalid={!!errors.cuisineType}>
            <SelectValue placeholder="Selecione o tipo de cozinha" />
          </SelectTrigger>
          <SelectContent>
            {CUISINE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cuisineType && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.cuisineType}</p>
        )}
      </div>

      <PhoneInput
        label="Telefone comercial"
        value={data.phone}
        onChange={(v) => dispatch({ type: "SET_STEP2", payload: { phone: v } })}
      />

      <PhotoUpload
        label="Logo do restaurante (opcional)"
        value={data.logoUrl || undefined}
        onChange={(url) => dispatch({ type: "SET_STEP2", payload: { logoUrl: url } })}
        onRemove={() => dispatch({ type: "SET_STEP2", payload: { logoUrl: "" } })}
      />
    </div>
  )
}

interface Step3Props {
  data: Step3State
  dispatch: React.Dispatch<FormAction>
  errors: Errors
}

function Step3({ data, dispatch, errors }: Step3Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Endereço</h2>

      <CepInput
        required
        value={data.cep}
        onChange={(v) => dispatch({ type: "SET_STEP3", payload: { cep: v } })}
        onAddressFill={(addr) =>
          dispatch({
            type: "SET_STEP3",
            payload: {
              logradouro: addr.logradouro,
              bairro: addr.bairro,
              cidade: addr.localidade,
              estado: addr.uf,
            },
          })
        }
        error={errors.cep}
      />

      <div className="space-y-1">
        <Label htmlFor="logradouro">
          Logradouro <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="logradouro"
          value={data.logradouro}
          onChange={(e) => dispatch({ type: "SET_STEP3", payload: { logradouro: e.target.value } })}
          placeholder="Rua das Flores"
          aria-invalid={!!errors.logradouro}
          className={errors.logradouro ? "border-[var(--color-danger)]" : ""}
        />
        {errors.logradouro && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.logradouro}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="numero">
            Número <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="numero"
            value={data.numero}
            onChange={(e) => dispatch({ type: "SET_STEP3", payload: { numero: e.target.value } })}
            placeholder="123"
            aria-invalid={!!errors.numero}
            className={errors.numero ? "border-[var(--color-danger)]" : ""}
          />
          {errors.numero && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.numero}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="complemento">Complemento</Label>
          <Input
            id="complemento"
            value={data.complemento}
            onChange={(e) => dispatch({ type: "SET_STEP3", payload: { complemento: e.target.value } })}
            placeholder="Sala 2, Bloco A"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="bairro">
          Bairro <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="bairro"
          value={data.bairro}
          onChange={(e) => dispatch({ type: "SET_STEP3", payload: { bairro: e.target.value } })}
          placeholder="Centro"
          aria-invalid={!!errors.bairro}
          className={errors.bairro ? "border-[var(--color-danger)]" : ""}
        />
        {errors.bairro && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.bairro}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="cidade">
            Cidade <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="cidade"
            value={data.cidade}
            onChange={(e) => dispatch({ type: "SET_STEP3", payload: { cidade: e.target.value } })}
            placeholder="São Paulo"
            aria-invalid={!!errors.cidade}
            className={errors.cidade ? "border-[var(--color-danger)]" : ""}
          />
          {errors.cidade && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.cidade}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="estado">
            UF <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="estado"
            value={data.estado}
            onChange={(e) =>
              dispatch({ type: "SET_STEP3", payload: { estado: e.target.value.toUpperCase().slice(0, 2) } })
            }
            placeholder="SP"
            maxLength={2}
            aria-invalid={!!errors.estado}
            className={errors.estado ? "border-[var(--color-danger)]" : ""}
          />
          {errors.estado && (
            <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.estado}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface Step4Props {
  data: Step4State
  dispatch: React.Dispatch<FormAction>
  errors: Errors
}

function Step4({ data, dispatch, errors }: Step4Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Horários e capacidade</h2>

      <div className="space-y-2">
        <Label>
          Dias de funcionamento <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map(({ label, value }) => {
            const active = data.businessDays.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_DAY", day: value })}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  active
                    ? "border-[var(--color-primary-raw)] bg-[var(--color-primary-raw)] text-white"
                    : "border-[var(--color-border-raw)] hover:bg-[var(--color-surface)]",
                ].join(" ")}
                aria-pressed={active}
              >
                {label}
              </button>
            )
          })}
        </div>
        {errors.businessDays && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">{errors.businessDays}</p>
        )}
      </div>

      {data.businessDays.length > 0 && (
        <div className="space-y-3">
          <Label>Horários por dia</Label>
          {[...data.businessDays]
            .sort((a, b) => a - b)
            .map((day) => {
              const dayLabel = DAYS.find((d) => d.value === day)?.label ?? String(day)
              const hours = data.businessHours[String(day)] ?? { open: "", close: "" }
              return (
                <div key={day} className="space-y-1">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {dayLabel}
                  </span>
                  <SchedulePicker
                    startValue={hours.open}
                    endValue={hours.close}
                    onStartChange={(v) => dispatch({ type: "SET_HOURS", day, field: "open", value: v })}
                    onEndChange={(v) => dispatch({ type: "SET_HOURS", day, field: "close", value: v })}
                  />
                </div>
              )
            })}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="averagePortions">Capacidade média de porções (opcional)</Label>
        <Input
          id="averagePortions"
          type="number"
          min={1}
          value={data.averagePortions}
          onChange={(e) => dispatch({ type: "SET_STEP4", payload: { averagePortions: e.target.value } })}
          placeholder="Ex: 50"
        />
      </div>

      <div className="space-y-1">
        <Label>Janela preferencial de doação (opcional)</Label>
        <Select
          value={data.preferredWindow || undefined}
          onValueChange={(v) =>
            dispatch({ type: "SET_STEP4", payload: { preferredWindow: v as "manha" | "tarde" | "noite" } })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            {WINDOW_OPTIONS.map(({ label, value }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

interface Step5Props {
  data: Step5State
  dispatch: React.Dispatch<FormAction>
  errors: Errors
  summary: {
    tradeName: string
    cnpj: string
    cidade: string
    estado: string
    businessDays: number[]
  }
  submitting: boolean
}

function maskCnpj(raw: string): string {
  const d = stripMask(raw)
  if (d.length !== 14) return raw
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-**`
}

function Step5({ data, dispatch, errors, summary, submitting }: Step5Props) {
  const [open, setOpen] = useState(true)
  const activeDayLabels = [...summary.businessDays]
    .sort((a, b) => a - b)
    .map((d) => DAYS.find((x) => x.value === d)?.label ?? String(d))
    .join(", ")

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold">Resumo e termos</h2>

      {/* Collapsible summary */}
      <div className="rounded-lg border border-[var(--color-border-raw)] overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-[var(--color-surface)] transition-colors"
        >
          <span>Resumo do cadastro</span>
          <span className="text-[var(--color-text-muted)]">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="px-4 pb-4 pt-2 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Restaurante</span>
              <span className="font-medium">{summary.tradeName || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">CNPJ</span>
              <span className="font-medium font-mono">{maskCnpj(summary.cnpj) || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Localização</span>
              <span className="font-medium">
                {summary.cidade && summary.estado
                  ? `${summary.cidade} / ${summary.estado}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Dias ativos</span>
              <span className="font-medium">{activeDayLabels || "—"}</span>
            </div>
          </div>
        )}
      </div>

      {/* Terms */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={data.termsAccepted}
            onCheckedChange={(checked) =>
              dispatch({ type: "SET_STEP5", payload: { termsAccepted: checked === true } })
            }
            aria-invalid={!!errors.termsAccepted}
          />
          <Label htmlFor="terms" className="text-sm leading-snug cursor-pointer">
            Declaro que li e aceito os{" "}
            <a
              href="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary-raw)] underline"
            >
              Termos de Uso
            </a>{" "}
            e a{" "}
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-primary-raw)] underline"
            >
              Política de Privacidade
            </a>
            .
          </Label>
        </div>
        {errors.termsAccepted && (
          <p className="text-xs text-[var(--color-danger)] pl-7" role="alert">
            {errors.termsAccepted}
          </p>
        )}
      </div>

      {submitting && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Criando sua conta…
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CadastroRestaurantePage() {
  const router = useRouter()
  const [state, dispatch] = useReducer(formReducer, initialState)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting, setSubmitting] = useState(false)

  // Per-step validation on "Continuar"
  function validateCurrentStep(stepIndex: number): boolean {
    let errs: Errors = {}
    switch (stepIndex) {
      case 0:
        errs = validateStep1(state.step1)
        break
      case 1:
        errs = validateStep2(state.step2)
        break
      case 2:
        errs = validateStep3(state.step3)
        break
      case 3:
        errs = validateStep4(state.step4)
        break
      case 4:
        errs = validateStep5(state.step5)
        break
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleComplete() {
    if (!validateCurrentStep(4)) return

    const { step1, step2, step3, step4 } = state

    const payload = {
      responsavelName: step1.responsavelName.trim(),
      cpf: stripMask(step1.cpf),
      email: step1.email.trim(),
      password: step1.password,
      tradeName: step2.tradeName.trim(),
      cnpj: stripMask(step2.cnpj),
      cuisineType: step2.cuisineType,
      phone: step2.phone ? stripMask(step2.phone) : undefined,
      logoUrl: step2.logoUrl || undefined,
      address: {
        cep: stripMask(step3.cep),
        logradouro: step3.logradouro.trim(),
        numero: step3.numero.trim(),
        complemento: step3.complemento.trim() || undefined,
        bairro: step3.bairro.trim(),
        cidade: step3.cidade.trim(),
        estado: step3.estado.trim(),
      },
      businessDays: step4.businessDays,
      businessHours: step4.businessHours,
      averagePortions: step4.averagePortions ? parseInt(step4.averagePortions, 10) : undefined,
      preferredWindow: step4.preferredWindow || undefined,
    }

    setSubmitting(true)
    try {
      const result = await registerRestauranteAction(payload)
      if (!result.success) {
        toast.error(result.error ?? "Erro ao criar conta. Tente novamente.")
        return
      }
      router.push(`${ROUTES.VERIFICAR_EMAIL}?email=${encodeURIComponent(step1.email)}`)
    } catch {
      toast.error("Erro inesperado. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  const steps = [
    {
      label: "Responsável",
      content: (
        <Step1
          key="step1"
          data={state.step1}
          dispatch={dispatch}
          errors={errors}
        />
      ),
    },
    {
      label: "Restaurante",
      content: (
        <Step2
          key="step2"
          data={state.step2}
          dispatch={dispatch}
          errors={errors}
        />
      ),
    },
    {
      label: "Endereço",
      content: (
        <Step3
          key="step3"
          data={state.step3}
          dispatch={dispatch}
          errors={errors}
        />
      ),
    },
    {
      label: "Horários",
      content: (
        <Step4
          key="step4"
          data={state.step4}
          dispatch={dispatch}
          errors={errors}
        />
      ),
    },
    {
      label: "Resumo",
      content: (
        <Step5
          key="step5"
          data={state.step5}
          dispatch={dispatch}
          errors={errors}
          summary={{
            tradeName: state.step2.tradeName,
            cnpj: state.step2.cnpj,
            cidade: state.step3.cidade,
            estado: state.step3.estado,
            businessDays: state.step4.businessDays,
          }}
          submitting={submitting}
        />
      ),
    },
  ]

  return (
    <ValidatedWizardForm
      steps={steps}
      onValidateStep={validateCurrentStep}
      onComplete={handleComplete}
      completeLabel={submitting ? "Criando conta…" : "Criar conta"}
    />
  )
}

// ---------------------------------------------------------------------------
// ValidatedWizardForm — thin wrapper that validates before advancing
// ---------------------------------------------------------------------------

interface ValidatedWizardFormProps {
  steps: { label: string; content: React.ReactNode }[]
  onValidateStep: (stepIndex: number) => boolean
  onComplete: () => void
  completeLabel?: string
}

function ValidatedWizardForm({
  steps,
  onValidateStep,
  onComplete,
  completeLabel,
}: ValidatedWizardFormProps) {
  const [current, setCurrent] = useState(0)

  const progress = ((current + 1) / steps.length) * 100

  function handleNext() {
    const valid = onValidateStep(current)
    if (!valid) return
    if (current < steps.length - 1) {
      setCurrent((c) => c + 1)
    } else {
      onComplete()
    }
  }

  function handleBack() {
    if (current > 0) {
      setCurrent((c) => c - 1)
    }
  }

  return (
    <div data-testid="wizard-form" className="flex flex-col min-h-screen">
      <div
        data-testid="wizard-form-progress"
        className="sticky top-0 z-20 bg-[var(--color-background-raw)] border-b border-[var(--color-border-raw)] px-4 py-3 space-y-2"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--color-text-muted)]">
            Etapa {current + 1} de {steps.length}
          </span>
          <span className="text-xs font-medium text-[var(--color-primary-raw)]">
            {steps[current].label}
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="hidden md:block pt-1">
          <StepIndicator
            steps={steps}
            currentStep={current}
            orientation="horizontal"
          />
        </div>
      </div>

      <div data-testid="wizard-form-content" className="flex-1 px-4 py-6 pb-28">
        {steps[current].content}
      </div>

      <div
        data-testid="wizard-form-actions"
        className="fixed bottom-0 left-0 right-0 bg-[var(--color-background-raw)] border-t border-[var(--color-border-raw)] px-4 py-3 flex flex-col gap-2"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
      >
        <Button
          data-testid="wizard-form-next-button"
          variant="default"
          size="lg"
          className="w-full"
          onClick={handleNext}
        >
          {current < steps.length - 1 ? "Continuar" : (completeLabel ?? "Finalizar")}
        </Button>
        {current > 0 && (
          <button
            data-testid="wizard-form-back-button"
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center gap-1 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] py-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </button>
        )}
      </div>
    </div>
  )
}
