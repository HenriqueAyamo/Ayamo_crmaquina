import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import { PAISES_QUALIFICACAO, contarAprovacoes } from '../data/qualificacaoPaises.js'
import { chartColor } from '../utils/chartColors.js'

const TONE_QUALIFICACAO = { Aprovado: 'success', 'Em andamento': 'warning', 'Não iniciado': 'neutral', Vencido: 'danger' }

export default function Qualifications() {
  const { empresas } = useData()
  const navigate = useNavigate()

  const fornecedores = useMemo(
    () => empresas.items.filter((e) => e.tipo === 'Fornecedor' && e.situacao === 'Ativo'),
    [empresas.items],
  )

  const paises = useMemo(() => {
    const extras = new Set()
    fornecedores.forEach((f) => Object.keys(f.qualificacoesPaises ?? {}).forEach((p) => extras.add(p)))
    PAISES_QUALIFICACAO.forEach((p) => extras.delete(p))
    return [...PAISES_QUALIFICACAO, ...extras]
  }, [fornecedores])

  const aprovacoesPorPais = useMemo(() => {
    return paises
      .map((pais, indice) => ({
        rotulo: pais,
        valor: fornecedores.filter((f) => f.qualificacoesPaises?.[pais] === 'Aprovado').length,
        cor: chartColor(indice),
      }))
      .sort((a, b) => b.valor - a.valor)
  }, [paises, fornecedores])

  const colunas = [
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      toggleable: false,
      render: (item) => item.nome,
      sortValue: (item) => item.nome,
    },
    {
      key: 'aprovacoes',
      header: 'Aprovações',
      toggleable: false,
      render: (item) => {
        const { emAndamentoOuAprovado, total } = contarAprovacoes(item.qualificacoesPaises)
        return <span className="font-medium text-ayamo-text">{`${emAndamentoOuAprovado}/${total}`}</span>
      },
      sortValue: (item) => contarAprovacoes(item.qualificacoesPaises).emAndamentoOuAprovado,
    },
    ...paises.map((pais) => ({
      key: `pais-${pais}`,
      header: pais,
      sortable: false,
      render: (item) => {
        const status = item.qualificacoesPaises?.[pais] ?? 'Não iniciado'
        return <StatusBadge label={status} tone={TONE_QUALIFICACAO[status] ?? 'neutral'} />
      },
    })),
  ]

  return (
    <div>
      <PageHeader title="Qualificações por país" subtitle="Visão global da qualificação de todos os fornecedores" />

      {aprovacoesPorPais.some((p) => p.valor > 0) && (
        <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Fornecedores aprovados por país</h2>
          <BarraRanking linhas={aprovacoesPorPais} />
        </div>
      )}

      <CardList
        rowKey="id"
        storageKey="qualificacoes-globais"
        stickyFirstColumn
        data={fornecedores}
        onRowClick={(item) => navigate(`/empresas/${item.id}`)}
        emptyLabel="Nenhum fornecedor ativo cadastrado"
        columns={colunas}
      />
    </div>
  )
}
