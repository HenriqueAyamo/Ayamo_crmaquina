import { useNavigate } from 'react-router-dom'
import { useData } from '../../DataContext.jsx'
import DataTable from '../../components/DataTable.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatarPreco, formatarValor, formatarData, formatarPercentual } from '../../utils/formato.js'

const TONE_OFERTA = { Disponível: 'success', 'Em revisão': 'warning', Esgotada: 'neutral', Expirada: 'danger' }
const TONE_PROPOSTA = {
  Rascunho: 'neutral',
  Enviada: 'info',
  'Em negociação': 'warning',
  'Aguardando aprovação': 'accent',
  'Aguardando aprovação financeira': 'warning',
  Aceita: 'success',
  Recusada: 'danger',
  Expirada: 'neutral',
}

function nomesProdutos(item, getProduto) {
  return item.itens.map((i) => getProduto(i.produtoId)?.nome ?? '—').join(', ')
}

export default function HistoricoNegocios({ empresa }) {
  const { ofertas, propostas, getProduto, calcularResumoProposta } = useData()
  const navigate = useNavigate()

  if (empresa.tipo === 'Fornecedor') {
    const ofertasDoFornecedor = ofertas.items
      .filter((o) => o.fornecedorId === empresa.id)
      .sort((a, b) => a.codigoBase.localeCompare(b.codigoBase) || a.versao - b.versao)

    return (
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-ayamo-text">Histórico de ofertas</h2>
        <DataTable
          rowKey="id"
          data={ofertasDoFornecedor}
          emptyLabel="Nenhuma oferta registrada para este fornecedor"
          onRowClick={(item) => navigate(`/compras/${item.codigoBase}`)}
          columns={[
            { key: 'codigo', header: 'Código' },
            {
              key: 'produto',
              header: 'Produto',
              render: (item) => getProduto(item.produtoId)?.nome ?? '—',
              sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
            },
            {
              key: 'precoCusto',
              header: 'Preço de custo',
              render: (item) => formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade),
              sortValue: (item) => item.precoCusto.valor,
            },
            { key: 'quantidade', header: 'Quantidade', render: (item) => item.quantidade.toLocaleString('pt-BR') },
            {
              key: 'status',
              header: 'Status',
              render: (item) => <StatusBadge label={item.status} tone={TONE_OFERTA[item.status] ?? 'neutral'} />,
            },
            { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
          ]}
        />
      </div>
    )
  }

  if (empresa.tipo === 'Cliente') {
    const propostasDoCliente = propostas.items.filter((p) => p.clienteId === empresa.id)

    return (
      <div className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-ayamo-text">Histórico de propostas</h2>
        <DataTable
          rowKey="id"
          data={propostasDoCliente}
          emptyLabel="Nenhuma proposta registrada para este cliente"
          onRowClick={(item) => navigate(`/vendas/${item.numero}`)}
          columns={[
            { key: 'numero', header: 'Número' },
            {
              key: 'produto',
              header: 'Produto',
              render: (item) => nomesProdutos(item, getProduto),
              sortValue: (item) => nomesProdutos(item, getProduto),
            },
            {
              key: 'valorTotal',
              header: 'Valor total',
              render: (item) => formatarValor(calcularResumoProposta(item).vendaUSD, 'USD'),
              sortValue: (item) => calcularResumoProposta(item).vendaUSD,
            },
            {
              key: 'margem',
              header: 'Margem %',
              render: (item) => formatarPercentual(calcularResumoProposta(item).margemPercentual),
              sortValue: (item) => calcularResumoProposta(item).margemPercentual,
            },
            {
              key: 'status',
              header: 'Status',
              render: (item) => <StatusBadge label={item.status} tone={TONE_PROPOSTA[item.status] ?? 'neutral'} />,
            },
            { key: 'dataEnvio', header: 'Data de envio', render: (item) => formatarData(item.dataEnvio) },
          ]}
        />
      </div>
    )
  }

  return null
}
