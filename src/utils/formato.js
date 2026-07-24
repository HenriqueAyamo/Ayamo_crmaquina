import { MOEDAS } from '../data/unidades.js'

export function formatarValor(valor, moeda) {
  const info = MOEDAS.find((m) => m.codigo === moeda)
  if (!info) throw new Error(`Moeda desconhecida: ${moeda}`)

  const numero = valor.toLocaleString(info.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${info.simbolo} ${numero}`
}

export function formatarPreco(valor, moeda, unidade) {
  return `${formatarValor(valor, moeda)} / ${unidade}`
}

export function formatarData(data) {
  const d = data instanceof Date ? data : new Date(data)
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const ano = d.getFullYear()
  return `${dia}/${mes}/${ano}`
}

export function formatarPercentual(valor, casasDecimais = 1) {
  return `${valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  })}%`
}
