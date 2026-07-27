import { calcularMargem } from '../../data/cambio.js'
import { formatarPreco, formatarPercentual } from '../../utils/formato.js'

export default function TabelaItensProposta({ proposta, perfil, getProduto }) {
  const mostrarCustoMargem = perfil === 'Vendedor'

  return (
    <div className="mb-2 overflow-x-auto rounded border border-ayamo-border bg-ayamo-surface">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-ayamo-bg">
          <tr>
            <th className="border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase text-ayamo-text-mut">Produto</th>
            <th className="border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase text-ayamo-text-mut">Quantidade</th>
            {mostrarCustoMargem && (
              <th className="border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase text-ayamo-text-mut">Preço de custo</th>
            )}
            <th className="border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase text-ayamo-text-mut">Preço de venda</th>
            {mostrarCustoMargem && (
              <th className="border-b border-ayamo-border px-4 py-2.5 text-left text-xs font-semibold uppercase text-ayamo-text-mut">Margem</th>
            )}
          </tr>
        </thead>
        <tbody>
          {proposta.itens.map((item, index) => {
            const margemItem = calcularMargem(item.precoCusto, item.precoVenda)
            return (
              <tr key={index} className="border-b border-ayamo-border last:border-b-0">
                <td className="px-4 py-2.5 text-[13px] text-ayamo-text">{getProduto(item.produtoId)?.nome}</td>
                <td className="px-4 py-2.5 text-[13px] text-ayamo-text">
                  {item.quantidade.toLocaleString('pt-BR')} {item.unidade}
                </td>
                {mostrarCustoMargem && (
                  <td className="px-4 py-2.5 text-[13px] text-ayamo-text">
                    {formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade)}
                  </td>
                )}
                <td className="px-4 py-2.5 text-[13px] text-ayamo-text">
                  {formatarPreco(item.precoVenda.valor, item.precoVenda.moeda, item.precoVenda.unidade)}
                </td>
                {mostrarCustoMargem && (
                  <td className="px-4 py-2.5 text-[13px] font-medium text-ayamo-text">
                    {formatarPercentual(margemItem.margemPercentual)}
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
