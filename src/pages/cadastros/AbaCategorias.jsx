import { useData } from '../../DataContext.jsx'
import CrudTab, { colunaSituacao } from './CrudTab.jsx'

export default function AbaCategorias() {
  const { categoriasContato } = useData()

  return (
    <CrudTab
      collection={categoriasContato}
      itemLabel="categoria"
      fields={[{ key: 'nome', label: 'Nome', type: 'text', required: true }]}
      columns={[
        {
          key: 'nome',
          header: 'Nome',
          render: (item) => (
            <span className={item.especial ? 'font-semibold text-ayamo-accent' : ''}>
              {item.nome}
              {item.especial && <span className="ml-2 text-xs font-normal">— usada nos disparos de WhatsApp/e-mail</span>}
            </span>
          ),
        },
        colunaSituacao(),
      ]}
    />
  )
}
