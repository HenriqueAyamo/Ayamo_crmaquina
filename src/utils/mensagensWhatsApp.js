import { converterDeUSD, converterParaUSD, DATA_REFERENCIA_CAMBIO } from '../data/cambio.js'
import { converterPeso } from './conversao.js'

export const IDIOMAS_MENSAGEM = [
  { codigo: 'pt', nome: 'Português' },
  { codigo: 'en', nome: 'English' },
  { codigo: 'es', nome: 'Español' },
]

const LOCALE_POR_IDIOMA = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }

export function diasSemResposta(proposta) {
  const ultimaData = proposta.historicoNegociacao[proposta.historicoNegociacao.length - 1]?.data ?? proposta.dataEnvio
  return Math.floor((Date.now() - new Date(ultimaData).getTime()) / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// Conversão
// ---------------------------------------------------------------------------

// Preço vem sempre como "moeda por unidade" (ex.: USD/ton). Trocar a moeda passa pelo USD;
// trocar a unidade divide pelo fator de peso — 1.200 USD/ton vira 1,20 USD/kg.
export function converterPreco(preco, moedaAlvo, unidadeAlvo) {
  const valorNaMoeda =
    preco.moeda === moedaAlvo ? preco.valor : converterDeUSD(converterParaUSD(preco.valor, preco.moeda), moedaAlvo)
  const fator = preco.unidade === unidadeAlvo ? 1 : converterPeso(1, unidadeAlvo, preco.unidade)
  return { valor: valorNaMoeda * fator, moeda: moedaAlvo, unidade: unidadeAlvo }
}

export function converterQuantidade(quantidade, unidadeAlvo) {
  if (quantidade.valor == null) return { valor: null, unidade: unidadeAlvo }
  return { valor: converterPeso(quantidade.valor, quantidade.unidade, unidadeAlvo), unidade: unidadeAlvo }
}

function numero(valor, idioma, casas = 2) {
  if (valor == null || valor === '' || Number.isNaN(Number(valor))) return ''
  return Number(valor).toLocaleString(LOCALE_POR_IDIOMA[idioma] ?? 'pt-BR', { maximumFractionDigits: casas })
}

// ---------------------------------------------------------------------------
// Textos
// ---------------------------------------------------------------------------

const TEXTOS = {
  pt: {
    saudacao: 'Olá!',
    introNegociacao: (produto, ref) => `Sobre a negociação de ${produto} (${ref}):`,
    introProposta: (produto, ref) => `Sobre a proposta ${ref} (${produto}):`,
    introCobranca: (produto, ref, dias) => `Estou dando seguimento à proposta ${ref} (${produto}), sem retorno há ${dias}:`,
    dias: (n) => `${n} dia${n === 1 ? '' : 's'}`,
    containers: (n) => `${n} contêiner${n > 1 ? 'es' : ''}`,
    aDefinir: 'a definir',
    labels: {
      preco: 'Preço atual',
      precoVenda: 'Preço',
      quantidade: 'Quantidade',
      incoterm: 'Incoterm',
      embarque: 'Embarque',
      prazoPagamento: 'Prazo de pagamento',
      validade: 'Validade da oferta',
      status: 'Status atual',
    },
    ate: 'até',
    fechamentoNegociacao: 'Poderia confirmar se segue tudo certo ou se há alguma atualização?',
    fechamentoProposta: 'Aguardamos seu retorno para seguirmos com o fechamento.',
    fechamentoCobranca: 'Poderia nos dar um retorno para seguirmos com o fechamento? Ficamos no aguardo.',
  },
  en: {
    saudacao: 'Hello!',
    introNegociacao: (produto, ref) => `Regarding the negotiation of ${produto} (${ref}):`,
    introProposta: (produto, ref) => `Regarding proposal ${ref} (${produto}):`,
    introCobranca: (produto, ref, dias) => `Following up on proposal ${ref} (${produto}), pending for ${dias}:`,
    dias: (n) => `${n} day${n === 1 ? '' : 's'}`,
    containers: (n) => `${n} container${n > 1 ? 's' : ''}`,
    aDefinir: 'to be defined',
    labels: {
      preco: 'Current price',
      precoVenda: 'Price',
      quantidade: 'Quantity',
      incoterm: 'Incoterm',
      embarque: 'Shipment',
      prazoPagamento: 'Payment terms',
      validade: 'Offer validity',
      status: 'Current status',
    },
    ate: 'to',
    fechamentoNegociacao: 'Could you confirm whether everything stands as agreed, or if there is any update?',
    fechamentoProposta: 'We look forward to your reply so we can move ahead with the closing.',
    fechamentoCobranca: 'Could you get back to us so we can move ahead with the closing? We remain at your disposal.',
  },
  es: {
    saudacao: '¡Hola!',
    introNegociacao: (produto, ref) => `Sobre la negociación de ${produto} (${ref}):`,
    introProposta: (produto, ref) => `Sobre la propuesta ${ref} (${produto}):`,
    introCobranca: (produto, ref, dias) => `Doy seguimiento a la propuesta ${ref} (${produto}), sin respuesta desde hace ${dias}:`,
    dias: (n) => `${n} día${n === 1 ? '' : 's'}`,
    containers: (n) => `${n} contenedor${n > 1 ? 'es' : ''}`,
    aDefinir: 'a definir',
    labels: {
      preco: 'Precio actual',
      precoVenda: 'Precio',
      quantidade: 'Cantidad',
      incoterm: 'Incoterm',
      embarque: 'Embarque',
      prazoPagamento: 'Plazo de pago',
      validade: 'Validez de la oferta',
      status: 'Estado actual',
    },
    ate: 'hasta',
    fechamentoNegociacao: '¿Podría confirmar si todo sigue igual o si hay alguna actualización?',
    fechamentoProposta: 'Quedamos a la espera de su respuesta para avanzar con el cierre.',
    fechamentoCobranca: '¿Podría darnos una respuesta para avanzar con el cierre? Quedamos atentos.',
  },
}

export function fechamentoPadrao(tipo, idioma) {
  const t = TEXTOS[idioma] ?? TEXTOS.pt
  if (tipo === 'negociacaoFornecedor') return t.fechamentoNegociacao
  if (tipo === 'propostaCliente') return t.fechamentoProposta
  return t.fechamentoCobranca
}

export function saudacaoPadrao(idioma) {
  return (TEXTOS[idioma] ?? TEXTOS.pt).saudacao
}

// ---------------------------------------------------------------------------
// Montagem da mensagem
// ---------------------------------------------------------------------------

function linhaPreco(t, idioma, preco, rotulo) {
  return `- ${rotulo}: ${numero(preco.valor, idioma)} ${preco.moeda}/${preco.unidade}`
}

function linhaQuantidade(t, idioma, quantidade, numeroContainers) {
  const base = quantidade.valor == null ? t.aDefinir : `${numero(quantidade.valor, idioma)} ${quantidade.unidade}`
  const sufixo = numeroContainers ? ` (${t.containers(numeroContainers)})` : ''
  return `- ${t.labels.quantidade}: ${base}${sufixo}`
}

export function montarMensagemWhatsApp(tipo, dados, idioma) {
  const t = TEXTOS[idioma] ?? TEXTOS.pt
  const linhas = []

  if (tipo === 'negociacaoFornecedor') {
    linhas.push(linhaPreco(t, idioma, dados.preco, t.labels.preco))
    linhas.push(linhaQuantidade(t, idioma, dados.quantidade, dados.numeroContainers))
    linhas.push(`- ${t.labels.incoterm}: ${dados.incoterm}`)
    linhas.push(`- ${t.labels.embarque}: ${dados.embarqueDe} ${t.ate} ${dados.embarqueAte}`)
    linhas.push(`- ${t.labels.prazoPagamento}: ${dados.prazoPagamento}`)
    linhas.push(`- ${t.labels.validade}: ${dados.validade}`)
  } else {
    linhas.push(linhaQuantidade(t, idioma, dados.quantidade, dados.numeroContainers))
    linhas.push(linhaPreco(t, idioma, dados.preco, t.labels.precoVenda))
    linhas.push(`- ${t.labels.incoterm}: ${dados.incoterm}`)
    linhas.push(`- ${t.labels.embarque}: ${dados.embarqueDe} ${t.ate} ${dados.embarqueAte}`)
    linhas.push(`- ${t.labels.prazoPagamento}: ${dados.prazoPagamento}`)
    linhas.push(`- ${t.labels.status}: ${dados.status}`)
  }

  let intro
  if (tipo === 'negociacaoFornecedor') intro = t.introNegociacao(dados.produto, dados.referencia)
  else if (tipo === 'propostaCliente') intro = t.introProposta(dados.produto, dados.referencia)
  else intro = t.introCobranca(dados.produto, dados.referencia, t.dias(dados.dias))

  return `${dados.saudacao} ${intro}\n\n${linhas.join('\n')}\n\n${dados.fechamento}`
}

// ---------------------------------------------------------------------------
// Modelos — extraem os dados estruturados de cada registro do sistema
// ---------------------------------------------------------------------------

export function modeloNegociacaoFornecedor(oferta, produtoNome, idioma = 'pt') {
  const t = TEXTOS[idioma] ?? TEXTOS.pt
  return {
    tipo: 'negociacaoFornecedor',
    dados: {
      saudacao: t.saudacao,
      produto: produtoNome ?? '',
      referencia: oferta.codigo ?? '',
      preco: { ...oferta.precoCusto },
      quantidade: { valor: oferta.quantidade, unidade: oferta.unidade ?? 'ton' },
      numeroContainers: oferta.numeroContainers ?? null,
      incoterm: oferta.incoterm || '—',
      embarqueDe: oferta.embarqueDe || t.aDefinir,
      embarqueAte: oferta.embarqueAte || t.aDefinir,
      prazoPagamento: oferta.prazoPagamento || '—',
      validade: oferta.validadeAte || '—',
      fechamento: t.fechamentoNegociacao,
    },
  }
}

export function modeloPropostaCliente(proposta, produtoNome, idioma = 'pt') {
  const t = TEXTOS[idioma] ?? TEXTOS.pt
  const item = proposta.itens[0]
  return {
    tipo: 'propostaCliente',
    dados: {
      saudacao: t.saudacao,
      produto: produtoNome ?? '',
      referencia: proposta.numero,
      preco: { ...item.precoVenda },
      quantidade: { valor: item.quantidade, unidade: item.unidade ?? 'ton' },
      numeroContainers: item.numeroContainers ?? null,
      incoterm: proposta.incoterm || '—',
      embarqueDe: proposta.embarqueDe || t.aDefinir,
      embarqueAte: proposta.embarqueAte || t.aDefinir,
      prazoPagamento: proposta.prazoPagamento || '—',
      status: proposta.status,
      fechamento: t.fechamentoProposta,
    },
  }
}

export function modeloCobrancaProposta(proposta, produtoNome, idioma = 'pt') {
  const t = TEXTOS[idioma] ?? TEXTOS.pt
  const item = proposta.itens[0]
  return {
    tipo: 'cobrancaProposta',
    dados: {
      saudacao: t.saudacao,
      produto: produtoNome ?? '',
      referencia: proposta.numero,
      dias: diasSemResposta(proposta),
      preco: { ...item.precoVenda },
      quantidade: { valor: item.quantidade, unidade: item.unidade ?? 'ton' },
      numeroContainers: item.numeroContainers ?? null,
      incoterm: proposta.incoterm || '—',
      embarqueDe: proposta.embarqueDe || t.aDefinir,
      embarqueAte: proposta.embarqueAte || t.aDefinir,
      prazoPagamento: proposta.prazoPagamento || '—',
      status: proposta.status,
      fechamento: t.fechamentoCobranca,
    },
  }
}

export const NOTA_CAMBIO = `Taxas de referência de ${DATA_REFERENCIA_CAMBIO}`
