import { useData } from '../../DataContext.jsx'
import CrudTab, { colunaSituacao } from './CrudTab.jsx'

export default function AbaDadosAyamo() {
  const { dadosAyamo } = useData()

  return (
    <div>
      <p className="mb-4 text-sm text-ayamo-text-mut">
        Cada entidade da Ayamo (ex.: Ayamo DMCC, Ayamo Brasil, etc.) usada para preencher o PO e a Proforma Invoice.
        Fica salvo só no seu navegador — os dados bancários não vêm preenchidos por padrão.
      </p>
      <CrudTab
        collection={dadosAyamo}
        itemLabel="entidade"
        fields={[
          { key: 'razaoSocial', label: 'Razão social', type: 'text', required: true },
          { key: 'endereco', label: 'Endereço completo', type: 'textarea' },
          { key: 'bancoNome', label: 'Banco', type: 'text' },
          { key: 'bancoSwift', label: 'SWIFT', type: 'text' },
          { key: 'bancoIban', label: 'IBAN', type: 'text' },
        ]}
        columns={[
          { key: 'razaoSocial', header: 'Razão social' },
          { key: 'endereco', header: 'Endereço', render: (item) => item.endereco || '—' },
          { key: 'bancoNome', header: 'Banco', render: (item) => item.bancoNome || '—' },
          colunaSituacao(),
        ]}
      />
    </div>
  )
}
