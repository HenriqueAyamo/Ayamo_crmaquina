export const DATA_REFERENCIA_CAMBIO = '24/07/2026'

export const TAXAS_CAMBIO = {
  USD_BRL: 5.42,
  EUR_USD: 1.08,
  GBP_USD: 1.27,
  CNY_USD: 0.14,
}

export function converterParaUSD(valor, moeda) {
  switch (moeda) {
    case 'USD':
      return valor
    case 'BRL':
      return valor / TAXAS_CAMBIO.USD_BRL
    case 'EUR':
      return valor * TAXAS_CAMBIO.EUR_USD
    case 'GBP':
      return valor * TAXAS_CAMBIO.GBP_USD
    case 'CNY':
      return valor * TAXAS_CAMBIO.CNY_USD
    default:
      throw new Error(`Moeda desconhecida: ${moeda}`)
  }
}

export function converterDeUSD(valorUSD, moeda) {
  switch (moeda) {
    case 'USD':
      return valorUSD
    case 'BRL':
      return valorUSD * TAXAS_CAMBIO.USD_BRL
    case 'EUR':
      return valorUSD / TAXAS_CAMBIO.EUR_USD
    case 'GBP':
      return valorUSD / TAXAS_CAMBIO.GBP_USD
    case 'CNY':
      return valorUSD / TAXAS_CAMBIO.CNY_USD
    default:
      throw new Error(`Moeda desconhecida: ${moeda}`)
  }
}

export function calcularMargem(itemCompra, itemVenda) {
  const custoUSD = converterParaUSD(itemCompra.valor, itemCompra.moeda)
  const vendaUSD = converterParaUSD(itemVenda.valor, itemVenda.moeda)
  const margemUSD = vendaUSD - custoUSD
  const margemPercentual = custoUSD !== 0 ? (margemUSD / custoUSD) * 100 : 0

  return {
    custoUSD,
    vendaUSD,
    margemUSD,
    margemPercentual,
    moedasDiferentes: itemCompra.moeda !== itemVenda.moeda,
  }
}

export function calcularResumoProposta(proposta) {
  let custoUSD = 0
  let vendaUSD = 0
  let quantidadeTotal = 0

  proposta.itens.forEach((item) => {
    const m = calcularMargem(
      { valor: item.precoCusto.valor, moeda: item.precoCusto.moeda },
      { valor: item.precoVenda.valor, moeda: item.precoVenda.moeda },
    )
    custoUSD += m.custoUSD * item.quantidade
    vendaUSD += m.vendaUSD * item.quantidade
    quantidadeTotal += item.quantidade
  })

  const margemUSD = vendaUSD - custoUSD
  const margemPercentual = custoUSD !== 0 ? (margemUSD / custoUSD) * 100 : 0
  const margemUSDporTon = quantidadeTotal > 0 ? margemUSD / quantidadeTotal : 0

  return { custoUSD, vendaUSD, margemUSD, margemPercentual, margemUSDporTon, quantidadeTotal }
}

// Uma proposta define sua margem mínima como percentual (ex.: 10%) ou como valor fixo
// por tonelada (ex.: US$ 40/ton) — não existe mais um piso fixo de 3% para todo mundo.
export function avaliarMargem(resumo, proposta) {
  const tipo = proposta.margemMinimaTipo ?? 'percentual'
  const minimo = proposta.margemMinima ?? 0
  const atual = tipo === 'valor' ? resumo.margemUSDporTon : resumo.margemPercentual
  const bufferAviso = tipo === 'valor' ? Math.max(1, Math.abs(minimo) * 0.1) : 3

  let tone = 'success'
  if (atual < minimo) tone = 'danger'
  else if (atual < minimo + bufferAviso) tone = 'warning'

  return { tone, atual, minimo, tipo }
}

const NOMES_TAXA = {
  BRL: `USD/BRL ${TAXAS_CAMBIO.USD_BRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  EUR: `EUR/USD ${TAXAS_CAMBIO.EUR_USD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  GBP: `GBP/USD ${TAXAS_CAMBIO.GBP_USD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
  CNY: `CNY/USD ${TAXAS_CAMBIO.CNY_USD.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
}

export function obterNotaCambio(itemCompra, itemVenda) {
  const moedasNaoUsd = [itemCompra.moeda, itemVenda.moeda].filter((m) => m !== 'USD')
  if (moedasNaoUsd.length === 0) return null

  const taxas = [...new Set(moedasNaoUsd)].map((m) => NOMES_TAXA[m]).join(' · ')
  return `Margem calculada em USD — taxa ${taxas} de ${DATA_REFERENCIA_CAMBIO}`
}
