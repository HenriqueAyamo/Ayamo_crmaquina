import { useData } from '../../DataContext.jsx'
import CrudTab, { colunaSituacao } from './CrudTab.jsx'

export default function AbaProdutos() {
  const { produtos, familias, divisoes } = useData()

  const opcoesFamilia = familias.items
    .filter((f) => f.situacao === 'Ativo')
    .map((f) => ({ value: f.id, label: f.nome }))

  const nomeFamilia = (familiaId) => familias.items.find((f) => f.id === familiaId)?.nome ?? '—'

  function nomeDivisaoDeFamilia(familiaId) {
    const familia = familias.items.find((f) => f.id === familiaId)
    const divisao = divisoes.items.find((d) => d.id === familia?.divisaoId)
    return divisao?.nome ?? '—'
  }

  return (
    <CrudTab
      collection={produtos}
      itemLabel="produto"
      fields={[
        { key: 'nome', label: 'Nome', type: 'text', required: true },
        { key: 'apelido', label: 'Apelido', type: 'text', required: true },
        { key: 'familiaId', label: 'Família', type: 'select', required: true, options: opcoesFamilia },
        { key: 'divisao', label: 'Divisão', type: 'derived', compute: (form) => nomeDivisaoDeFamilia(form.familiaId) },
        { key: 'embalagem', label: 'Embalagem (para PO/Proforma)', type: 'text' },
        { key: 'validadeMeses', label: 'Validade (meses)', type: 'number' },
        { key: 'especificacaoRotulo', label: 'Especificação de rótulo', type: 'text' },
        { key: 'hsCode', label: 'HS Code', type: 'text' },
        { key: 'proteinaPercentual', label: 'Proteína (%)', type: 'number' },
        { key: 'parametros', label: 'Outros parâmetros', type: 'text' },
      ]}
      columns={[
        { key: 'nome', header: 'Nome' },
        { key: 'apelido', header: 'Apelido' },
        { key: 'familia', header: 'Família', render: (item) => nomeFamilia(item.familiaId) },
        { key: 'divisao', header: 'Divisão', render: (item) => nomeDivisaoDeFamilia(item.familiaId) },
        { key: 'proteinaPercentual', header: 'Proteína %', render: (item) => (item.proteinaPercentual ? `${item.proteinaPercentual}%` : '—') },
        colunaSituacao(),
      ]}
    />
  )
}
