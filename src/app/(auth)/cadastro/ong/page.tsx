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
import { WizardForm } from "@/components/shared/wizard-form"
import { DocumentInput } from "@/components/shared/document-input"
import { CepInput } from "@/components/shared/cep-input"
import { PhoneInput } from "@/components/shared/phone-input"
import { PhotoUpload } from "@/components/shared/photo-upload"
import { registerOngAction } from "./actions"
import { ROUTES } from "@/lib/constants"
import { stripMask } from "@/utils/formatters"

// ---------------------------------------------------------------------------
// Estado do formulário multi-etapas
// ---------------------------------------------------------------------------

interface OngFormState {
  // Etapa 1 — Representante legal
  representativeName: string
  representativeCpf: string
  representativeRole: string
  email: string
  phone: string
  password: string
  confirmPassword: string

  // Etapa 2 — Dados da ONG
  razaoSocial: string
  cnpj: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  atuacao: string[]
  logoUrl: string
  website: string
  instagram: string

  // Etapa 3 — Confirmação
  termsAccepted: boolean
  legalDeclaration: boolean
}

type OngFormAction =
  | { type: 'SET_FIELD'; field: keyof OngFormState; value: string | boolean | string[] }
  | { type: 'FILL_ADDRESS'; logradouro: string; bairro: string; localidade: string; uf: string }
  | { type: 'TOGGLE_ATUACAO'; value: string }

const INITIAL_STATE: OngFormState = {
  representativeName: '',
  representativeCpf: '',
  representativeRole: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  razaoSocial: '',
  cnpj: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  atuacao: [],
  logoUrl: '',
  website: '',
  instagram: '',
  termsAccepted: false,
  legalDeclaration: false,
}

function ongFormReducer(state: OngFormState, action: OngFormAction): OngFormState {
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
    case 'TOGGLE_ATUACAO': {
      const current = state.atuacao
      const exists = current.includes(action.value)
      return {
        ...state,
        atuacao: exists ? current.filter((a) => a !== action.value) : [...current, action.value],
      }
    }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Áreas de atuação disponíveis
// ---------------------------------------------------------------------------

const AREAS_ATUACAO = [
  'Alimentação',
  'Educação',
  'Saúde',
  'Habitação',
  'Inclusão Digital',
  'Outro',
]

// ---------------------------------------------------------------------------
// Helpers de validação por etapa
// ---------------------------------------------------------------------------

function isPersonalEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  return ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'live.com'].includes(domain)
}

// ---------------------------------------------------------------------------
// Etapa 1 — Representante legal
// ---------------------------------------------------------------------------

interface Step1Props {
  state: OngFormState
  dispatch: React.Dispatch<OngFormAction>
}

function Step1({ state, dispatch }: Step1Props) {
  const showEmailWarning = state.email.includes('@') && isPersonalEmailDomain(state.email)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Representante legal</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Dados do responsável pela ONG perante a lei.
      </p>

      <div className="space-y-1">
        <Label htmlFor="representativeName" className="text-sm font-medium">
          Nome do representante <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="representativeName"
          value={state.representativeName}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'representativeName', value: e.target.value })}
          placeholder="Maria da Silva"
          autoComplete="name"
        />
      </div>

      <DocumentInput
        type="cpf"
        label="CPF do representante"
        value={state.representativeCpf}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'representativeCpf', value: v })}
        required
      />

      <div className="space-y-1">
        <Label htmlFor="representativeRole" className="text-sm font-medium">
          Cargo / função
        </Label>
        <Input
          id="representativeRole"
          value={state.representativeRole}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'representativeRole', value: e.target.value })}
          placeholder="Presidente, Diretor, Coordenador..."
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm font-medium">
          E-mail institucional <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={state.email}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
          placeholder="contato@suaong.org.br"
          autoComplete="email"
          inputMode="email"
        />
        {showEmailWarning && (
          <p className="text-xs text-[var(--color-warning,#b45309)]">
            Recomendamos usar e-mail institucional (@suaong.org.br)
          </p>
        )}
      </div>

      <PhoneInput
        value={state.phone}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'phone', value: v })}
        label="Telefone"
      />

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
// Etapa 2 — Dados da ONG
// ---------------------------------------------------------------------------

interface Step2Props {
  state: OngFormState
  dispatch: React.Dispatch<OngFormAction>
}

function Step2({ state, dispatch }: Step2Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Dados da ONG</h2>

      <div className="space-y-1">
        <Label htmlFor="razaoSocial" className="text-sm font-medium">
          Razão social <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <Input
          id="razaoSocial"
          value={state.razaoSocial}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'razaoSocial', value: e.target.value })}
          placeholder="Associação ONG Esperança"
        />
      </div>

      <DocumentInput
        type="cnpj"
        label="CNPJ"
        value={state.cnpj}
        onChange={(v) => dispatch({ type: 'SET_FIELD', field: 'cnpj', value: v })}
        required
      />

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
            placeholder="Sala 1, Bloco B"
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
        <Label className="text-sm font-medium">
          Áreas de atuação <span className="text-[var(--color-danger)]">*</span>
        </Label>
        <p className="text-xs text-[var(--color-text-muted)]">Selecione ao menos uma área.</p>
        <div className="grid grid-cols-2 gap-2">
          {AREAS_ATUACAO.map((area) => (
            <label
              key={area}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border-raw)] p-2 hover:bg-[var(--color-surface)] has-[input:checked]:border-[var(--color-primary-raw)] has-[input:checked]:bg-[var(--color-primary-raw)]/5"
            >
              <Checkbox
                checked={state.atuacao.includes(area)}
                onCheckedChange={() => dispatch({ type: 'TOGGLE_ATUACAO', value: area })}
              />
              <span className="text-sm">{area}</span>
            </label>
          ))}
        </div>
      </div>

      <PhotoUpload
        label="Logo da ONG (opcional)"
        value={state.logoUrl}
        onChange={(url) => dispatch({ type: 'SET_FIELD', field: 'logoUrl', value: url })}
        onRemove={() => dispatch({ type: 'SET_FIELD', field: 'logoUrl', value: '' })}
      />

      <div className="space-y-1">
        <Label htmlFor="website" className="text-sm font-medium">Website (opcional)</Label>
        <Input
          id="website"
          type="url"
          value={state.website}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'website', value: e.target.value })}
          placeholder="https://www.suaong.org.br"
          inputMode="url"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="instagram" className="text-sm font-medium">Instagram / Facebook (opcional)</Label>
        <Input
          id="instagram"
          value={state.instagram}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'instagram', value: e.target.value })}
          placeholder="@suaong"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Etapa 3 — Confirmação
// ---------------------------------------------------------------------------

interface Step3Props {
  state: OngFormState
  dispatch: React.Dispatch<OngFormAction>
  isSubmitting: boolean
  onSubmit: () => void
}

function Step3({ state, dispatch, isSubmitting, onSubmit }: Step3Props) {
  const canSubmit = state.termsAccepted && state.legalDeclaration && !isSubmitting

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Confirmação e termos</h2>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Para concluir o cadastro, leia e confirme as declarações abaixo.
      </p>

      <div className="space-y-4">
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

        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[var(--color-border-raw)] p-3 hover:bg-[var(--color-surface)]">
          <Checkbox
            checked={state.legalDeclaration}
            onCheckedChange={(checked) =>
              dispatch({ type: 'SET_FIELD', field: 'legalDeclaration', value: Boolean(checked) })
            }
            className="mt-0.5 shrink-0"
          />
          <span className="text-sm leading-relaxed">
            Declaro que esta ONG está regularmente constituída e em situação jurídica regular
          </span>
        </label>
      </div>

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

export default function CadastroOngPage() {
  const router = useRouter()
  const [state, dispatch] = React.useReducer(ongFormReducer, INITIAL_STATE)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function handleSubmit() {
    if (!state.termsAccepted || !state.legalDeclaration) {
      toast.error('Confirme os termos e a declaração jurídica para continuar.')
      return
    }
    if (state.password !== state.confirmPassword) {
      toast.error('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        representativeName: state.representativeName,
        representativeCpf: stripMask(state.representativeCpf),
        representativeRole: state.representativeRole || undefined,
        email: state.email,
        phone: state.phone || undefined,
        password: state.password,
        razaoSocial: state.razaoSocial,
        cnpj: stripMask(state.cnpj),
        address: {
          cep: stripMask(state.cep),
          logradouro: state.logradouro,
          numero: state.numero,
          complemento: state.complemento || undefined,
          bairro: state.bairro,
          cidade: state.cidade,
          estado: state.estado,
        },
        atuacao: state.atuacao,
        logoUrl: state.logoUrl || undefined,
        website: state.website || undefined,
        instagram: state.instagram || undefined,
        legalDeclaration: true as const,
      }

      const result = await registerOngAction(payload)

      if (!result.success) {
        toast.error(result.error ?? 'Erro ao criar conta. Tente novamente.')
        return
      }

      toast.success('Conta criada! Verifique seu e-mail para ativar o cadastro.')
      router.push(`${ROUTES.VERIFICAR_EMAIL}?email=${encodeURIComponent(state.email)}`)
    } catch {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    {
      label: 'Representante',
      content: <Step1 state={state} dispatch={dispatch} />,
    },
    {
      label: 'Dados da ONG',
      content: <Step2 state={state} dispatch={dispatch} />,
    },
    {
      label: 'Confirmação',
      content: (
        <Step3
          state={state}
          dispatch={dispatch}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      ),
    },
  ]

  return (
    <WizardForm
      steps={steps}
      onComplete={handleSubmit}
      completeLabel="Criar conta"
    />
  )
}
