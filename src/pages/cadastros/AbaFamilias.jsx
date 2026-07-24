import { useData } from '../../DataContext.jsx'
import CrudTab, { colunaSituacao } from './CrudTab.jsx'

export default function AbaFamilias() {
  const { familias, divisoes } = useData()

  const opcoesDivisao = divisoes.items
    .filter((d) => d.situacao === 'Ativo')
    .map((d) => ({ value: d.id, label: d.nome }))

  const nomeDivisao = (divisaoId) => divisoes.items.find((d) => d.id === divisaoId)?.nome ?? '—'

  return (
    <CrudTab
      collection={familias}
      itemLabel="família"
      fields={[
        { key: 'nome', label: 'Nome', type: 'text', required: true },
        { key: 'divisaoId', label: 'Divisão', type: 'select', required: true, options: opcoesDivisao },
      ]}
      columns={[
        { key: 'nome', header: 'Nome' },
        { key: 'divisao', header: 'Divisão', render: (item) => nomeDivisao(item.divisaoId), sortValue: (item) => nomeDivisao(item.divisaoId) },
        colunaSituacao(),
      ]}
    />
  )
}
