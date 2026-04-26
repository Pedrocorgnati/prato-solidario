/**
 * Formatadores brasileiros: CPF, CNPJ, CEP, telefone, moeda BRL, números.
 * @see module-2-shared-foundations/TASK-3/ST001 e ST002
 */

// ---------------------------------------------------------------------------
// Documentos e endereço
// ---------------------------------------------------------------------------

/** Remove toda formatação — retorna apenas dígitos */
export function stripMask(value: string): string {
  return value.replace(/\D/g, '')
}

/** Formata CPF: '52998224725' → '529.982.247-25' */
export function formatCpf(cpf: string): string {
  const stripped = stripMask(cpf)
  if (!stripped) return ''
  return stripped
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

/** Formata CNPJ: '11222333000181' → '11.222.333/0001-81' */
export function formatCnpj(cnpj: string): string {
  const stripped = stripMask(cnpj)
  if (!stripped) return ''
  return stripped
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

/** Formata CEP: '01310100' → '01310-100' */
export function formatCep(cep: string): string {
  const stripped = stripMask(cep)
  if (!stripped) return ''
  return stripped.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
}

/**
 * Formata telefone BR.
 * - 11 dígitos (celular): '11999999999' → '(11) 99999-9999'
 * - 10 dígitos (fixo): '1133334444' → '(11) 3333-4444'
 */
export function formatPhone(phone: string): string {
  const stripped = stripMask(phone)
  if (!stripped) return ''
  if (stripped.length <= 10) {
    return stripped.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
  }
  return stripped.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
}

// ---------------------------------------------------------------------------
// Moeda e números
// ---------------------------------------------------------------------------

/**
 * Formata valor monetário em Real (BRL).
 * `formatCurrency(1234.56)` → 'R$ 1.234,56'
 */
export function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

/** Formata número com decimais opcionais usando locale pt-BR */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Formata contagem de refeições com plural correto.
 * `formatRefeicoes(1)` → '1 refeição'
 * `formatRefeicoes(5)` → '5 refeições'
 */
export function formatRefeicoes(n: number): string {
  return n === 1 ? `${n} refeição` : `${n} refeições`
}

// Nota: formatDateBr e formatDateTimeBr estão em utils/date.ts (date-fns + pt-BR)
// @see module-2-shared-foundations/TASK-3/ST003
