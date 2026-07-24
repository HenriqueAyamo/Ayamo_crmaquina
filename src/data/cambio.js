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

  proposta.itens.forEach((item) => {
    const m = calcularMargem(
      { valor: item.precoCusto.valor, moeda: item.precoCusto.moeda },
      { valor: item.precoVenda.valor, moeda: item.precoVenda.moeda },
    )
    custoUSD += m.custoUSD * item.quantidade
    vendaUSD += m.vendaUSD * item.quantidade
  })

  const margemUSD = vendaUSD - custoUSD
  const margemPercentual = custoUSD !== 0 ? (margemUSD / custoUSD) * 100 : 0

  return { custoUSD, vendaUSD, margemUSD, margemPercentual }
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
