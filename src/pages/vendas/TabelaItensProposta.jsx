import { calcularMargem, avaliarMargem } from '../../data/cambio.js'
import { formatarPreco, formatarPercentual, formatarValor } from '../../utils/formato.js'

const CLASSE_TONE = { danger: 'text-ayamo-danger', warning: 'text-ayamo-warning', success: 'text-ayamo-success' }

const th = 'border-b border-ayamo-border px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ayamo-text-mut'
const thNum = `${th} text-right`
const td = 'px-4 py-3 text-[13px] text-ayamo-text'
const tdNum = `${td} text-right tabular-nums`

export default function TabelaItensProposta({ proposta, perfil, getProduto }) {
  const mostrarCustoMargem = perfil === 'Vendedor'

  // Total por linha e no rodapé: antes a tabela mostrava preço unitário e
  // quantidade, mas nunca quanto aquela linha valia — a conta ficava na cabeça.
  const totais = proposta.itens.reduce(
    (acc, item) => {
      const m = calcularMargem(item.precoCusto, item.precoVenda)
      acc.venda += m.vendaUSD * item.quantidade
      acc.custo += m.custoUSD * item.quantidade
      acc.quantidade += item.quantidade
      return acc
    },
    { venda: 0, custo: 0, quantidade: 0 },
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-ayamo-border bg-ayamo-surface">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-ayamo-bg">
          <tr>
            <th className={th}>Produto</th>
            <th className={thNum}>Quantidade</th>
            {mostrarCustoMargem && <th className={thNum}>Custo</th>}
            <th className={thNum}>Preço de venda</th>
            <th className={thNum}>Total</th>
            {mostrarCustoMargem && <th className={thNum}>Margem</th>}
          </tr>
        </thead>
        <tbody>
          {proposta.itens.map((item, index) => {
            const m = calcularMargem(item.precoCusto, item.precoVenda)
            const avaliacao = avaliarMargem(
              { margemPercentual: m.margemPercentual, margemUSDporTon: m.margemUSD },
              proposta,
            )
            return (
              <tr key={index} className="border-b border-ayamo-border last:border-b-0">
                <td className={`${td} font-medium`}>{getProduto(item.produtoId)?.nome}</td>
                <td className={tdNum}>
                  {item.quantidade.toLocaleString('pt-BR')} {item.unidade}
                </td>
                {mostrarCustoMargem && (
                  <td className={`${tdNum} text-ayamo-text-mut`}>
                    {formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade)}
                  </td>
                )}
                <td className={tdNum}>
                  {formatarPreco(item.precoVenda.valor, item.precoVenda.moeda, item.precoVenda.unidade)}
                </td>
                <td className={`${tdNum} font-medium`}>{formatarValor(m.vendaUSD * item.quantidade, 'USD')}</td>
                {mostrarCustoMargem && (
                  <td className={`${tdNum} font-medium ${CLASSE_TONE[avaliacao.tone] ?? 'text-ayamo-text'}`}>
                    {formatarPercentual(m.margemPercentual)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
        {proposta.itens.length > 1 && (
          <tfoot className="border-t-2 border-ayamo-border bg-ayamo-bg">
            <tr>
              <td className={`${td} font-semibold`}>Total</td>
              <td className={`${tdNum} font-semibold`}>{totais.quantidade.toLocaleString('pt-BR')}</td>
              {mostrarCustoMargem && <td className={tdNum}>{formatarValor(totais.custo, 'USD')}</td>}
              <td className={tdNum} />
              <td className={`${tdNum} font-semibold`}>{formatarValor(totais.venda, 'USD')}</td>
              {mostrarCustoMargem && <td className={tdNum} />}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
