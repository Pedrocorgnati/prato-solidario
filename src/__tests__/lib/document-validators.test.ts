import { describe, it, expect } from 'vitest'
import { isValidCpf } from '@/validators/cpf'
import { isValidCnpj } from '@/validators/cnpj'

describe('isValidCpf', () => {
  it('aceita CPF válido formatado', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
  })

  it('aceita CPF válido sem formatação', () => {
    expect(isValidCpf('52998224725')).toBe(true)
  })

  it('rejeita CPF com dígitos verificadores incorretos', () => {
    expect(isValidCpf('529.982.247-26')).toBe(false)
  })

  it('rejeita CPF com todos os dígitos iguais', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('000.000.000-00')).toBe(false)
  })

  it('rejeita CPF com menos de 11 dígitos', () => {
    expect(isValidCpf('123.456.789')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(isValidCpf('')).toBe(false)
  })
})

describe('isValidCnpj', () => {
  it('aceita CNPJ válido formatado', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('aceita CNPJ válido sem formatação', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
  })

  it('rejeita CNPJ com dígitos verificadores incorretos', () => {
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false)
  })

  it('rejeita CNPJ com todos os dígitos iguais', () => {
    expect(isValidCnpj('00.000.000/0000-00')).toBe(false)
  })

  it('rejeita CNPJ com menos de 14 dígitos', () => {
    expect(isValidCnpj('11.222.333')).toBe(false)
  })
})
