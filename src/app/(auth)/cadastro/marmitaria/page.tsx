"use client"
export const dynamic = 'force-dynamic'

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { WizardForm } from "@/components/shared/wizard-form"
import { DocumentInput } from "@/components/shared/document-input"
import { CepInput } from "@/components/shared/cep-input"
import { PhoneInput } from "@/components/shared/phone-input"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { registerMarmitariaAction } from "./actions"
import { ROUTES } from "@/lib/constants"
import { stripMask } from "@/utils/formatters"

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const DIAS_SEMANA = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
]

const TIPOS_REFEICAO = ['Almoço', 'Jantar', 'Marmita especial']

const ORDER_DEADLINE_OPTIONS = [
  { label: '1 hora antes', value: '1h' },
  { label: '2 horas antes', value: '2h' },
  { label: '3 horas antes', value: '3h' },
  { label: 'Até meia-noite do dia anterior', value: 'midnight_before' },
]

// ---------------------------------------------------------------------------
// Estado do formulário
// ---------------------------------------------------------------------------

interface DeliveryHourEntry {
  open: string
  close: string
}

interface MarmitariaFormState {
  // Etapa 1 — Responsável
  responsavelName: string
  cpf: string
  email: string
  password: string
  confirmPassword: string

  // Etapa 2 — Marmitaria
  tradeName: string
  cnpj: string
  phone: string
  photoUrl: string

  // Etapa 3 — Endereço + raio
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  deliveryRadiusKm: number

  // Etapa 4 — Capacidade
  dailyCapacity: string
  mealTypes: string[]
  pricePerMeal: string

  // Etapa 5 — Horários
  deliveryDays: number[]
  deliveryHours: Record<string, DeliveryHourEntry>
  orderDeadline: string
  scheduleNote: string

  // Etapa 6 — Termos
  termsAccepted: boolean
}

type MarmitariaFormAction =
  | { type: 'SET_FIELD'; field: keyof MarmitariaFormState; value: string | boolean | number | string[] | number[] }
  | { type: 'FILL_ADDRESS'; logradouro: string; bairro: string; localidade: string; uf: string }
  | { type: 'TOGGLE_MEAL_TYPE'; value: string }
  | { type: 'TOGGLE_DELIVERY_DAY'; day: number }
  | { type: 'SET_DELIVERY_HOUR'; day: number; field: 'open' | 'close'; value: string }

const INITIAL_STATE: MarmitariaFormState = {
  responsavelName: '',
  cpf: '',
  email: '',
  password: '',
  confirmPassword: '',
  tradeName: '',
  cnpj: '',
  phone: '',
  photoUrl: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  deliveryRadiusKm: 3,
  dailyCapacity: '',
  mealTypes: [],
  pricePerMeal: '',
  deliveryDays: [],
  deliveryHours: {},
  orderDeadline: '',
  scheduleNote: '',
  termsAccepted: false,
}

function marmitariaFormReducer(
  state: MarmitariaFormState,
  action: MarmitariaFormAction
): MarmitariaFormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value }

    case 'FILL_ADDRESS':
      return {
        ...state,
        logradouro: action.logradouro,
        bairro: action.bairro,
        cidade: action.localidade,
        estado: action.uf,
      }

    case 'TOGGLE_MEAL_TYPE': {
      const current = state.mealTypes
      return {
        ...state,
        mealTypes: current.includes(action.value)
          ? current.filter((t) => t !== action.value)
          : [...current, action.value],
      }
    }

    case 'TOGGLE_DELIVERY_DAY': {
      const current = state.deliveryDays
      const exists = current.includes(action.day)
      const newDays = exists
        ? current.filter((d) => d !== action.day)
        : [...current, action.day].sort((a, b) => a - b)

      // Remove hours entry for removed day
      const newHours = { ...state.deliveryHours }
      if (exists) {
        delete newHours[String(action.day)]
      } else if (!newHours[String(action.day)]) {
        newHours[String(action.day)] = { open: '08:00', close: '18:00' }
      }

      return { ...state, deliveryDays: newDays, deliveryHours: newHours }
    }

    case 'SET_DELIVERY_HOUR': {
      const key = String(action.day)
      const current = state.deliveryHours[key] ?? { open: '08:00', close: '18:00' }
      return {
        ...state,
        deliveryHours: {
          ...state.deliveryHours,
          [key]: { ...current, [action.field]: action.value },
        },
      }
    }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Etapa 1 — Responsável
// ---------------------------------------------------------------------------

interface StepProps {
  state: MarmitariaFormState
  dispatch: React.Dispatch<MarmitariaFormAction>
}

function Step1({ state, dispatch }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Responsável pela marmitaria</h2>

      <div className="space-y-1">
        <Label htmlFor="responsavelName" className="text-sm font-medium">
          Nome completo <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="responsavelName"
          value={state.responsavelName}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'responsavelName', value: e.target.value })}
          placeholder="Maria da Silva"
          autoComplete="name"
        />
      </div>

      <DocumentInput
        type="cpf"
        label="CPF"
        value={state.cpf}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'cpf', value: v })}
        required
      />

      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm font-medium">
          E-mail <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={state.email}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
          placeholder="contato@marmitaria.com.br"
          autoComplete="email"
          inputMode="email"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="password" className="text-sm font-medium">
          Senha <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          value={state.password}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirmar senha <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={state.confirmPassword}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'confirmPassword', value: e.target.value })}
          placeholder="Repita a senha"
          autoComplete="new-password"
        />
        {state.confirmPassword && state.password !== state.confirmPassword && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            As senhas não coincidem
          </p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Etapa 2 — Marmitaria
// ---------------------------------------------------------------------------

function Step2({ state, dispatch }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados da marmitaria</h2>

      <div className="space-y-1">
        <Label htmlFor="tradeName" className="text-sm font-medium">
          Nome da marmitaria <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="tradeName"
          value={state.tradeName}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'tradeName', value: e.target.value })}
          placeholder="Marmitaria da Dona Maria"
        />
      </div>

      <DocumentInput
        type="cnpj"
        label="CNPJ (opcional — marmitarias informais podem deixar em branco)"
        value={state.cnpj}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'cnpj', value: v })}
      />

      <PhoneInput
        value={state.phone}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'phone', value: v })}
        label="Telefone"
      />

      <PhotoUpload
        label="Foto do estabelecimento *"
        value={state.photoUrl}
        onChange={(url) => dispatch({ type: 'SET_FIELD', field: 'photoUrl', value: url })}
        onRemove={() => dispatch({ type: 'SET_FIELD', field: 'photoUrl', value: '' })}
        required
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Etapa 3 — Endereço + raio de entrega
// ---------------------------------------------------------------------------

function Step3({ state, dispatch }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Endereço e raio de entrega</h2>

      <CepInput
        value={state.cep}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'cep', value: v })}
        onAddressFill={({ logradouro, bairro, localidade, uf }) =>
          dispatch({ type: 'FILL_ADDRESS', logradouro, bairro, localidade, uf })
        }
        required
      />

      <div className="space-y-1">
        <Label htmlFor="logradouro" className="text-sm font-medium">
          Logradouro <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="logradouro"
          value={state.logradouro}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'logradouro', value: e.target.value })}
          placeholder="Rua das Flores"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="numero" className="text-sm font-medium">
            Número <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="numero"
            value={state.numero}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'numero', value: e.target.value })}
            placeholder="123"
            inputMode="numeric"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor="complemento" className="text-sm font-medium">Complemento</Label>
          <Input
            id="complemento"
            value={state.complemento}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'complemento', value: e.target.value })}
            placeholder="Apto 12, Bloco B"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="bairro" className="text-sm font-medium">
            Bairro <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="bairro"
            value={state.bairro}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'bairro', value: e.target.value })}
            placeholder="Centro"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cidade" className="text-sm font-medium">
            Cidade <span className="text-[var(--color-danger)]">*</span>
          </Label>
          <Input
            id="cidade"
            value={state.cidade}
            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cidade', value: e.target.value })}
            placeholder="São Paulo"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="estado" className="text-sm font-medium">
          Estado (UF) <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="estado"
          value={state.estado}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'estado', value: e.target.value.toUpperCase().slice(0, 2) })}
          placeholder="SP"
          maxLength={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryRadius" className="text-sm font-medium">
          Raio de entrega: <strong>{state.deliveryRadiusKm} km</strong>
        </Label>
        <input
          id="deliveryRadius"
          type="range"
          min={1}
          max={10}
          step={1}
          value={state.deliveryRadiusKm}
          onChange={(e) =>
            dispatch({ type: 'SET_FIELD', field: 'deliveryRadiusKm', value: Number(e.target.value) })
          }
          className="w-full accent-[var(--color-primary-raw)]"
        />
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>1 km</span>
          <span>10 km</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Etapa 4 — Capacidade
// ---------------------------------------------------------------------------

function Step4({ state, dispatch }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Capacidade e cardápio</h2>

      <div className="space-y-1">
        <Label htmlFor="dailyCapacity" className="text-sm font-medium">
          Capacidade diária (marmitas) <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="dailyCapacity"
          type="number"
          min={10}
          value={state.dailyCapacity}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'dailyCapacity', value: e.target.value })}
          placeholder="50"
          inputMode="numeric"
        />
        <p className="text-xs text-[var(--color-text-muted)]">Mínimo de 10 marmitas por dia.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Tipos de refeição <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <p className="text-xs text-[var(--color-text-muted)]">Selecione ao menos um tipo.</p>
        <div className="space-y-2">
          {TIPOS_REFEICAO.map((tipo) => (
            <label
              key={tipo}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--color-border-raw)] p-3 hover:bg-[var(--color-surface)] has-[input:checked]:border-[var(--color-primary-raw)] has-[input:checked]:bg-[var(--color-primary-raw)]/5"
            >
              <Checkbox
                checked={state.mealTypes.includes(tipo)}
                onCheckedChange={() => dispatch({ type: 'TOGGLE_MEAL_TYPE', value: tipo })}
              />
              <span className="text-sm">{tipo}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="pricePerMeal" className="text-sm font-medium">
          Preço unitário (R$) — opcional
        </Label>
        <Input
          id="pricePerMeal"
          type="number"
          min={0}
          step={0.01}
          value={state.pricePerMeal}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'pricePerMeal', value: e.target.value })}
          placeholder="15,00"
          inputMode="decimal"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Etapa 5 — Horários
// ---------------------------------------------------------------------------

function Step5({ state, dispatch }: StepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dias e horários de funcionamento</h2>

      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Dias de funcionamento <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {DIAS_SEMANA.map(({ label, value }) => {
            const isActive = state.deliveryDays.includes(value)
            return (
              <button
                key={value}
                type="button"
                onClick={() => dispatch({ type: 'TOGGLE_DELIVERY_DAY', day: value })}
                className={[
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-[var(--color-primary-raw)] bg-[var(--color-primary-raw)] text-white'
                    : 'border-[var(--color-border-raw)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-raw)]',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {state.deliveryDays.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Horários por dia</Label>
          {state.deliveryDays.map((day) => {
            const dayLabel = DIAS_SEMANA.find((d) => d.value === day)?.label ?? String(day)
            const hours = state.deliveryHours[String(day)] ?? { open: '08:00', close: '18:00' }
            return (
              <div key={day} className="rounded-md border border-[var(--color-border-raw)] p-3 space-y-2">
                <p className="text-sm font-medium">{dayLabel}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[var(--color-text-muted)]">Abertura</Label>
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) =>
                        dispatch({ type: 'SET_DELIVERY_HOUR', day, field: 'open', value: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-[var(--color-text-muted)]">Fechamento</Label>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) =>
                        dispatch({ type: 'SET_DELIVERY_HOUR', day, field: 'close', value: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="orderDeadline" className="text-sm font-medium">
          Prazo para pedido <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <select
          id="orderDeadline"
          value={state.orderDeadline}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'orderDeadline', value: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Selecione...</option>
          {ORDER_DEADLINE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="scheduleNote" className="text-sm font-medium">
          Observações sobre horários (opcional)
        </Label>
        <textarea
          id="scheduleNote"
          value={state.scheduleNote}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'scheduleNote', value: e.target.value })}
          placeholder="Ex.: Não atendemos em feriados nacionais."
          maxLength={200}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
        />
        <p className="text-xs text-[var(--color-text-muted)] text-right">
          {state.scheduleNote.length}/200
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Etapa 6 — Mercado Pago + Termos
// ---------------------------------------------------------------------------

interface Step6Props extends StepProps {
  isSubmitting: boolean
  onSubmit: () => void
}

function Step6({ state, dispatch, isSubmitting, onSubmit }: Step6Props) {
  const [mpDialogOpen, setMpDialogOpen] = React.useState(false)
  const canSubmit = state.termsAccepted && !isSubmitting

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Pagamentos e confirmação</h2>

      {/* Informação sobre Mercado Pago */}
      <div className="rounded-md border border-[var(--color-info,#0ea5e9)]/30 bg-[var(--color-info,#0ea5e9)]/5 p-4 space-y-3">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          Mercado Pago
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Para receber pagamentos de patrocínio, você precisará conectar sua conta do Mercado Pago após o cadastro.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMpDialogOpen(true)}
        >
          Conectar Mercado Pago
        </Button>
      </div>

      {/* Dialog informativo — NUNCA inicia OAuth */}
      <Dialog open={mpDialogOpen} onOpenChange={setMpDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Mercado Pago</DialogTitle>
            <DialogDescription>
              Você poderá configurar o Mercado Pago no seu painel após a aprovação da sua conta.
              Não é necessário agora.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <DialogClose
              render={
                <Button type="button" variant="default" />
              }
            >
              Entendido
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      {/* Termos de uso */}
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--color-border-raw)] p-3 hover:bg-[var(--color-surface)]">
        <Checkbox
          checked={state.termsAccepted}
          onCheckedChange={(checked) =>
            dispatch({ type: 'SET_FIELD', field: 'termsAccepted', value: Boolean(checked) })
          }
          className="mt-0.5 shrink-0"
        />
        <span className="text-sm leading-relaxed">
          Li e aceito os{' '}
          <a href={ROUTES.TERMOS} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary-raw)] underline underline-offset-2">
            Termos de Uso
          </a>{' '}
          e a{' '}
          <a href={ROUTES.PRIVACIDADE} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary-raw)] underline underline-offset-2">
            Política de Privacidade
          </a>
        </span>
      </label>

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Criando conta...
          </>
        ) : (
          'Criar conta'
        )}
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function CadastroMarmitariaPage() {
  const router = useRouter()
  const [state, dispatch] = React.useReducer(marmitariaFormReducer, INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit() {
    if (!state.termsAccepted) {
      toast.error('Aceite os Termos de Uso para continuar.')
      return
    }
    if (state.password !== state.confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }
    if (!state.photoUrl) {
      toast.error('Foto do estabelecimento é obrigatória.')
      return
    }

    setIsSubmitting(true)
    try {
      const dailyCapacityNum = parseInt(state.dailyCapacity, 10)
      const pricePerMealNum = state.pricePerMeal ? parseFloat(state.pricePerMeal) : undefined
      const cnpjStripped = stripMask(state.cnpj)

      const payload = {
        responsavelName: state.responsavelName,
        cpf: stripMask(state.cpf),
        email: state.email,
        password: state.password,
        tradeName: state.tradeName,
        cnpj: cnpjStripped.length >= 14 ? cnpjStripped : undefined,
        phone: state.phone || undefined,
        photoUrl: state.photoUrl || undefined,
        address: {
          cep: stripMask(state.cep),
          logradouro: state.logradouro,
          numero: state.numero,
          complemento: state.complemento || undefined,
          bairro: state.bairro,
          cidade: state.cidade,
          estado: state.estado,
        },
        deliveryRadiusKm: state.deliveryRadiusKm,
        dailyCapacity: dailyCapacityNum,
        mealTypes: state.mealTypes,
        pricePerMeal: pricePerMealNum,
        deliveryDays: state.deliveryDays,
        deliveryHours: state.deliveryHours,
        orderDeadline: state.orderDeadline,
        scheduleNote: state.scheduleNote || undefined,
      }

      const result = await registerMarmitariaAction(payload)

      if (!result.success) {
        toast.error(result.error ?? 'Erro ao criar conta. Tente novamente.')
        return
      }

      toast.success('Cadastro enviado! Verifique seu e-mail e aguarde aprovação.')
      router.push(`${ROUTES.VERIFICAR_EMAIL}?email=${encodeURIComponent(state.email)}`)
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    {
      label: 'Responsável',
      content: <Step1 state={state} dispatch={dispatch} />,
    },
    {
      label: 'Marmitaria',
      content: <Step2 state={state} dispatch={dispatch} />,
    },
    {
      label: 'Endereço',
      content: <Step3 state={state} dispatch={dispatch} />,
    },
    {
      label: 'Capacidade',
      content: <Step4 state={state} dispatch={dispatch} />,
    },
    {
      label: 'Horários',
      content: <Step5 state={state} dispatch={dispatch} />,
    },
    {
      label: 'Pagamentos',
      content: (
        <Step6
          state={state}
          dispatch={dispatch}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      ),
    },
  ]

  function handleBeforeNext(step: number): boolean {
    // Etapa 2 (index 1) — validar foto obrigatória
    if (step === 1 && !state.photoUrl) {
      toast.error('Foto do estabelecimento é obrigatória.')
      return false
    }
    return true
  }

  return (
    <WizardForm
      steps={steps}
      onBeforeNext={handleBeforeNext}
      onComplete={handleSubmit}
      completeLabel="Criar conta"
    />
  )
}
