'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { loginAction, loginSchema, type LoginInput } from './actions'
import { useSearchParams } from 'next/navigation'

/**
 * Client Component do formulario de login.
 * Usa loginAction real (Server Action com CSRF + account lock).
 * @see module-3-auth-login/TASK-1/ST002, TASK-7 (correcao pos-auditoria)
 */
export function LoginForm() {
  // RESOLVED: useRouter removido — redirect é feito server-side pelo loginAction
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = React.useState(false)
  const [state, setState] = React.useState<'idle' | 'loading' | 'error' | 'unverified'>('idle')
  const [globalError, setGlobalError] = React.useState<string | null>(null)
  const emailRef = React.useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  // Merge ref para email (react-hook-form + nosso ref)
  const { ref: rhfRef, ...emailRegister } = register('email')

  async function onSubmit(data: LoginInput) {
    setState('loading')
    setGlobalError(null)
    try {
      // Passar redirectTo da query string (sanitizado no server)
      const redirectTo = searchParams.get('redirectTo') ?? undefined
      const result = await loginAction({ ...data, redirectTo })
      if (result?.error) {
        if (result.error.includes('Verifique seu e-mail')) {
          setState('unverified')
        } else {
          setState('error')
        }
        setGlobalError(result.error)
        // Focus retorna ao campo email apos erro (UX spec)
        emailRef.current?.focus()
      }
      // Se nao retornou error, loginAction ja fez redirect() server-side
    } catch {
      setState('error')
      setGlobalError('E-mail ou senha incorretos')
      emailRef.current?.focus()
    }
  }

  return (
    <>
      {/* eslint-disable-next-line react-hooks/refs */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {globalError && state === 'error' && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 rounded-md bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 p-3 text-sm text-[var(--color-danger)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}
        {state === 'unverified' && (
          <div
            role="alert"
            aria-live="polite"
            className="flex items-center gap-2 rounded-md bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 p-3 text-sm text-[var(--color-warning)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {globalError}{' '}
              <button className="underline font-medium" type="button">
                Reenviar
              </button>
            </span>
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...emailRegister}
            ref={(e) => {
              rhfRef(e)
              emailRef.current = e
            }}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className={errors.email ? 'border-[var(--color-danger)]' : ''}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link
              href="/recuperar-senha"
              className="text-xs text-[var(--color-primary-raw)] hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="senha"
              type={showPassword ? 'text' : 'password'}
              placeholder="Sua senha"
              autoComplete="current-password"
              {...register('senha')}
              aria-invalid={!!errors.senha}
              aria-describedby={errors.senha ? 'senha-error' : undefined}
              className={`pr-10 ${errors.senha ? 'border-[var(--color-danger)]' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.senha && (
            <p id="senha-error" className="text-xs text-[var(--color-danger)]" role="alert">
              {errors.senha.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="lembrarMe" {...register('lembrarMe')} />
          <Label htmlFor="lembrarMe" className="text-sm font-normal cursor-pointer">
            Lembrar-me
          </Label>
        </div>

        <Button
          type="submit"
          variant="default"
          size="lg"
          className="w-full"
          disabled={state === 'loading'}
        >
          {state === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--color-text-muted)]">
        Nao tem conta?{' '}
        <Link
          href="/entrar"
          className="font-medium text-[var(--color-primary-raw)] hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </>
  )
}
