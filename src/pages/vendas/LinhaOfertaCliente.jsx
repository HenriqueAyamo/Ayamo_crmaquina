import { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { formatarPreco } from '../../utils/formato.js'
import { MOEDAS } from '../../data/unidades.js'

export default function LinhaOfertaCliente({ oferta, produtoNome, clientesSelecionados, dados, onToggle, onAtualizar, travada }) {
  const marcada = travada || Boolean(dados)
  const totalAlocado = dados
    ? clientesSelecionados.reduce((soma, c) => soma + Number(dados.porCliente[c.id]?.quantidade || 0), 0)
    : 0
  const excedeDisponivel = totalAlocado > oferta.quantidade

  return (
    <div className="rounded border border-ayamo-border p-3">
      <label className="flex items-center gap-2 text-sm font-medium text-ayamo-text">
        {travada ? (
          <span className="h-4 w-4 flex-shrink-0 rounded-sm bg-ayamo-primary" aria-hidden="true" />
        ) : (
          <input type="checkbox" checked={marcada} onChange={() => onToggle(oferta)} />
        )}
        {produtoNome} ({oferta.codigo}) — {formatarPreco(oferta.precoCusto.valor, oferta.precoCusto.moeda, oferta.precoCusto.unidade)}
        <span className="text-ayamo-text-mut">
          · disponível: {oferta.quantidade.toLocaleString('pt-BR')} {oferta.unidade}
        </span>
      </label>

      {marcada && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_repeat(3,140px)] gap-2 text-xs font-semibold uppercase text-ayamo-text-mut">
            <span>Cliente</span>
            <span>Quantidade</span>
            <span>Preço de venda</span>
            <span>Moeda</span>
          </div>
          {clientesSelecionados.map((cliente) => {
            const porCliente = dados?.porCliente[cliente.id] ?? { quantidade: '', precoVenda: '', moedaVenda: oferta.precoCusto.moeda }
            return (
              <div key={cliente.id} className="grid grid-cols-[1fr_repeat(3,140px)] items-center gap-2">
                <span className="text-sm text-ayamo-text">{cliente.nome}</span>
                <CampoNumerico
                  value={porCliente.quantidade}
                  onChange={(valor) => onAtualizar(cliente.id, 'quantidade', valor)}
                />
                <CampoNumerico
                  value={porCliente.precoVenda}
                  onChange={(valor) => onAtualizar(cliente.id, 'precoVenda', valor)}
                />
                <select
                  className={inputClass}
                  value={porCliente.moedaVenda}
                  onChange={(e) => onAtualizar(cliente.id, 'moedaVenda', e.target.value)}
                >
                  {MOEDAS.map((m) => (
                    <option key={m.codigo} value={m.codigo}>
                      {m.codigo}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
          <p className={`text-xs ${excedeDisponivel ? 'font-medium text-ayamo-danger' : 'text-ayamo-text-mut'}`}>
            Total alocado: {totalAlocado.toLocaleString('pt-BR')} / {oferta.quantidade.toLocaleString('pt-BR')} {oferta.unidade}
            {excedeDisponivel && ' — acima do disponível'}
          </p>
        </div>
      )}
    </div>
  )
}
