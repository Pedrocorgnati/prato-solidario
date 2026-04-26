import {
  format,
  formatDistanceToNow,
  isWithinInterval,
  endOfDay,
  addDays as addDaysFns,
  isValid,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateRange } from '@/types/common'

/**
 * Utilitários de data com locale pt-BR.
 * @see module-2-shared-foundations/TASK-3/ST003
 */

/** Placeholder para datas inválidas ou ausentes */
const INVALID_DATE_PLACEHOLDER = '—'

/** Garante que o valor é uma Date válida */
function toSafeDate(date: Date | string | number | null | undefined): Date | null {
  if (date === null || date === undefined) return null
  const d = date instanceof Date ? date : new Date(date)
  return isValid(d) ? d : null
}

/** Formata data em pt-BR: '01/01/2025' */
export function formatDateBr(date: Date | string | number | null | undefined): string {
  const d = toSafeDate(date)
  if (!d) return INVALID_DATE_PLACEHOLDER
  return format(d, 'dd/MM/yyyy', { locale: ptBR })
}

/** Formata data e hora em pt-BR: '01/01/2025 14:30' */
export function formatDateTimeBr(date: Date | string | number | null | undefined): string {
  const d = toSafeDate(date)
  if (!d) return INVALID_DATE_PLACEHOLDER
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
}

/**
 * Formata tempo relativo em português.
 * Ex: 'há 2 horas', 'há 3 dias'
 */
export function formatRelative(date: Date | string | number | null | undefined): string {
  const d = toSafeDate(date)
  if (!d) return INVALID_DATE_PLACEHOLDER
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true })
}

/**
 * Verifica se uma data está dentro de uma janela de tempo.
 */
export function isWithinWindow(date: Date, start: Date, end: Date): boolean {
  return isWithinInterval(date, { start, end })
}

/**
 * Retorna o fim do dia (23:59:59.999) para uma data.
 */
export function endOfDayBr(date: Date): Date {
  return endOfDay(date)
}

/**
 * Adiciona N dias a uma data.
 */
export function addDays(date: Date, days: number): Date {
  return addDaysFns(date, days)
}

/**
 * Verifica se um DateRange é válido (end >= start).
 */
export function isValidDateRange(range: DateRange): boolean {
  return range.end >= range.start
}

/**
 * Formata um intervalo de horários: '08:00 – 10:30'
 */
export function formatTimeWindow(start: string, end: string): string {
  return `${start} – ${end}`
}

/**
 * Calcula a duração de uma janela de horário em minutos.
 * Espera formato HH:MM.
 */
export function calculateWindowDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

/**
 * Formata duração em minutos para string legível.
 * `formatDuration(150)` → '2h30'
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0min'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

/**
 * Retorna 23:59:59.999 no fuso BRT (UTC-3) do dia atual, como UTC Date.
 * Independente do timezone do servidor.
 * @see module-9-retirada-publica/TASK-1/ST004
 */
export function endOfDayBRT(): Date {
  const now = new Date()
  // Calcular data atual no fuso BRT (UTC-3)
  const brtOffsetMs = -3 * 60 * 60 * 1000
  const brtNow = new Date(now.getTime() + brtOffsetMs)
  // Montar 23:59:59.999 no fuso BRT como UTC
  const endBrt = new Date(
    Date.UTC(
      brtNow.getUTCFullYear(),
      brtNow.getUTCMonth(),
      brtNow.getUTCDate(),
      // 23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte
      26, // 23 + 3
      59,
      59,
      999
    )
  )
  return endBrt
}
