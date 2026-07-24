import { useData } from '../../DataContext.jsx'
import CrudTab, { colunaSituacao } from './CrudTab.jsx'

export default function AbaDivisoes() {
  const { divisoes } = useData()

  return (
    <CrudTab
      collection={divisoes}
      itemLabel="divisão"
      fields={[{ key: 'nome', label: 'Nome', type: 'text', required: true }]}
      columns={[{ key: 'nome', header: 'Nome' }, colunaSituacao()]}
    />
  )
}
