import { avaliarMargem } from '../../data/cambio.js'
import { formatarPercentual, formatarPreco, formatarValor } from '../../utils/formato.js'

// Os números que decidem a conversa, no topo e grandes. Antes o valor total do
// negócio não aparecia em lugar nenhum e a margem ficava numa célula de tabela,
// do mesmo tamanho do resto — sendo o dado que define se a venda fecha ou não.
const TOM_MARGEM = {
  success: { texto: 'text-ayamo-success', fundo: 'bg-ayamo-success/10', borda: 'border-ayamo-success/30' },
  warning: { texto: 'text-ayamo-warning', fundo: 'bg-ayamo-warning/10', borda: 'border-ayamo-warning/30' },
  danger: { texto: 'text-ayamo-danger', fundo: 'bg-ayamo-danger/10', borda: 'border-ayamo-danger/30' },
}

function Numero({ rotulo, valor, detalhe, destaque = false }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ayamo-text-mut">{rotulo}</p>
      <p className={`mt-1 truncate font-semibold tracking-tight ${destaque ? 'text-2xl' : 'text-xl'} text-ayamo-text`}>
        {valor}
      </p>
      {detalhe && <p className="mt-0.5 truncate text-xs text-ayamo-text-mut">{detalhe}</p>}
    </div>
  )
}

export default function ResumoNegocio({ proposta, resumo, mostrarMargem }) {
  const avaliacao = avaliarMargem(resumo, proposta)
  const tom = TOM_MARGEM[avaliacao.tone] ?? TOM_MARGEM.success
  const item = proposta.itens[0]

  const minimoTexto =
    avaliacao.tipo === 'valor' ? `mín. ${formatarValor(avaliacao.minimo, 'USD')}/ton` : `mín. ${formatarPercentual(avaliacao.minimo)}`

  const margemTexto =
    avaliacao.tipo === 'valor' ? `${formatarValor(avaliacao.atual, 'USD')}/ton` : formatarPercentual(avaliacao.atual)

  return (
    <div className="mb-6 grid grid-cols-2 divide-y divide-ayamo-border rounded-lg border border-ayamo-border bg-ayamo-surface sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      <Numero
        rotulo="Valor total"
        valor={formatarValor(resumo.vendaUSD, 'USD')}
        detalhe={`${resumo.quantidadeTotal.toLocaleString('pt-BR')} ${item.unidade} · ${proposta.itens.length} item(ns)`}
        destaque
      />

      {/* Com mais de um item o preço unitário do primeiro não representa a
          proposta — mostra a média ponderada em USD para não induzir a erro. */}
      {proposta.itens.length === 1 ? (
        <Numero
          rotulo="Preço de venda"
          valor={formatarPreco(item.precoVenda.valor, item.precoVenda.moeda, item.precoVenda.unidade)}
          detalhe={
            mostrarMargem ? `custo ${formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade)}` : null
          }
        />
      ) : (
        <Numero
          rotulo="Preço médio"
          valor={formatarPreco(
            resumo.quantidadeTotal > 0 ? resumo.vendaUSD / resumo.quantidadeTotal : 0,
            'USD',
            item.unidade,
          )}
          detalhe={`média ponderada de ${proposta.itens.length} itens`}
        />
      )}

      {mostrarMargem ? (
        <div className={`min-w-0 border-l-2 px-5 py-4 ${tom.fundo} ${tom.borda}`}>
          <p className="text-xs font-medium uppercase tracking-wide text-ayamo-text-mut">Margem</p>
          <p className={`mt-1 truncate text-2xl font-semibold tracking-tight ${tom.texto}`}>{margemTexto}</p>
          <p className="mt-0.5 truncate text-xs text-ayamo-text-mut">
            {minimoTexto}
            {avaliacao.tone === 'danger' && <span className="ml-1 font-medium text-ayamo-danger">abaixo do mínimo</span>}
            {avaliacao.tone === 'warning' && <span className="ml-1 font-medium text-ayamo-warning">no limite</span>}
          </p>
        </div>
      ) : (
        <Numero rotulo="Quantidade" valor={`${resumo.quantidadeTotal.toLocaleString('pt-BR')} ${item.unidade}`} />
      )}

      <Numero
        rotulo="Ganho no negócio"
        valor={mostrarMargem ? formatarValor(resumo.margemUSD, 'USD') : '—'}
        detalhe={mostrarMargem ? `${formatarValor(resumo.margemUSDporTon, 'USD')} por ${item.unidade}` : 'visível para o Vendedor'}
      />
    </div>
  )
}
