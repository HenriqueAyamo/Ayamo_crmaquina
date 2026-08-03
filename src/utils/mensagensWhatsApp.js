import { formatarPreco } from './formato.js'

export function diasSemResposta(proposta) {
  const ultimaData = proposta.historicoNegociacao[proposta.historicoNegociacao.length - 1]?.data ?? proposta.dataEnvio
  return Math.floor((Date.now() - new Date(ultimaData).getTime()) / (1000 * 60 * 60 * 24))
}

export function mensagemCobrancaProposta(proposta, produtoNome) {
  const item = proposta.itens[0]
  const dias = diasSemResposta(proposta)
  return `Olá! Estou dando seguimento à proposta ${proposta.numero} (${produtoNome}), sem retorno há ${dias} dia${dias === 1 ? '' : 's'}:

- Quantidade: ${item.quantidade.toLocaleString('pt-BR')} ${item.unidade}${item.numeroContainers ? ` (${item.numeroContainers} contêiner${item.numeroContainers > 1 ? 'es' : ''})` : ''}
- Preço: ${formatarPreco(item.precoVenda.valor, item.precoVenda.moeda, item.precoVenda.unidade)}
- Incoterm: ${proposta.incoterm || '—'}
- Embarque: ${proposta.embarqueDe || 'a definir'} até ${proposta.embarqueAte || 'a definir'}
- Prazo de pagamento: ${proposta.prazoPagamento || '—'}
- Status atual: ${proposta.status}

Poderia nos dar um retorno para seguirmos com o fechamento? Ficamos no aguardo.`
}
