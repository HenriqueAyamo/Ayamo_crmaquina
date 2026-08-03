import { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { formatarPreco, formatarValor } from '../../utils/formato.js'
import { MOEDAS } from '../../data/unidades.js'
import { converterParaUSD, converterDeUSD } from '../../data/cambio.js'
import { TONELADAS_POR_CONTAINER } from '../../data/toneladasPorContainer.js'

export default function LinhaOfertaCliente({ oferta, produtoNome, clientesSelecionados, dados, onToggle, onAtualizar, travada }) {
  const marcada = travada || Boolean(dados)
  const totalAlocado = dados
    ? clientesSelecionados.reduce((soma, c) => soma + Number(dados.porCliente[c.id]?.quantidade || 0), 0)
    : 0
  const excedeDisponivel = oferta.quantidade != null && totalAlocado > oferta.quantidade

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
          · disponível: {oferta.quantidade == null ? 'a definir' : `${oferta.quantidade.toLocaleString('pt-BR')} ${oferta.unidade}`}
        </span>
        {oferta.statusProducao && oferta.statusProducao !== 'Pronto para embarque' && (
          <span className="rounded-full border border-ayamo-warning/25 bg-ayamo-warning/15 px-2 py-0.5 text-xs font-medium text-ayamo-warning">
            {oferta.statusProducao} — ainda não está pronto
          </span>
        )}
      </label>

      {marcada && (
        <div className="mt-3 flex flex-col gap-2">
          <div className="grid grid-cols-[1fr_repeat(5,120px)] gap-2 text-xs font-semibold uppercase text-ayamo-text-mut">
            <span>Cliente</span>
            <span>Contêineres</span>
            <span>Quantidade</span>
            <span>Preço de venda</span>
            <span>Moeda</span>
            <span>Total da venda</span>
          </div>
          {clientesSelecionados.map((cliente) => {
            const porCliente = dados?.porCliente[cliente.id] ?? { quantidade: '', numeroContainers: '', precoVenda: '', moedaVenda: oferta.precoCusto.moeda }
            const totalVenda = Number(porCliente.quantidade || 0) * Number(porCliente.precoVenda || 0)
            return (
              <div key={cliente.id} className="grid grid-cols-[1fr_repeat(5,120px)] items-center gap-2">
                <span className="text-sm text-ayamo-text">{cliente.nome}</span>
                <CampoNumerico
                  value={porCliente.numeroContainers ?? ''}
                  onChange={(valor) => {
                    onAtualizar(cliente.id, 'numeroContainers', valor)
                    if (valor !== '') onAtualizar(cliente.id, 'quantidade', String(Number(valor) * TONELADAS_POR_CONTAINER))
                  }}
                />
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
                  onChange={(e) => {
                    const novaMoeda = e.target.value
                    if (Number(porCliente.precoVenda) > 0) {
                      const precoUSD = converterParaUSD(Number(porCliente.precoVenda), porCliente.moedaVenda)
                      const precoConvertido = Math.round(converterDeUSD(precoUSD, novaMoeda) * 100) / 100
                      onAtualizar(cliente.id, 'precoVenda', precoConvertido)
                    }
                    onAtualizar(cliente.id, 'moedaVenda', novaMoeda)
                  }}
                >
                  {MOEDAS.map((m) => (
                    <option key={m.codigo} value={m.codigo}>
                      {m.codigo}
                    </option>
                  ))}
                </select>
                <span className="text-sm font-medium text-ayamo-text">
                  {totalVenda > 0 ? formatarValor(totalVenda, porCliente.moedaVenda) : '—'}
                </span>
              </div>
            )
          })}
          <p className={`text-xs ${excedeDisponivel ? 'font-medium text-ayamo-warning' : 'text-ayamo-text-mut'}`}>
            Total alocado: {totalAlocado.toLocaleString('pt-BR')} /{' '}
            {oferta.quantidade == null ? 'a definir' : `${oferta.quantidade.toLocaleString('pt-BR')} ${oferta.unidade}`}
            {excedeDisponivel && ' — acima do estoque disponível, confirme com o comprador antes de fechar'}
          </p>
        </div>
      )}
    </div>
  )
}
