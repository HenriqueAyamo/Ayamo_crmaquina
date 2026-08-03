import { useMemo, useState } from 'react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import { formatarValor, formatarData } from '../utils/formato.js'

const TONE_ENVIO = { Enviado: 'success', 'Não enviado': 'neutral' }

export default function Documentos() {
  const { documentos } = useData()
  const [tipoFiltro, setTipoFiltro] = useState('')

  const documentosFiltrados = useMemo(() => {
    return [...documentos.items]
      .filter((d) => !tipoFiltro || d.tipo === tipoFiltro)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [documentos.items, tipoFiltro])

  return (
    <div>
      <PageHeader title="Documentos" subtitle="POs e Proforma Invoices emitidos" />

      <FilterBar>
        <Field label="Tipo">
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="PO">PO</option>
            <option value="Proforma Invoice">Proforma Invoice</option>
          </select>
        </Field>
      </FilterBar>

      <CardList
        rowKey="id"
        data={documentosFiltrados}
        emptyLabel="Nenhum documento emitido ainda"
        columns={[
          { key: 'tipo', header: 'Tipo' },
          { key: 'numero', header: 'Número' },
          { key: 'propostaNumero', header: 'Proposta de origem' },
          { key: 'clienteNome', header: 'Destinatário' },
          { key: 'valor', header: 'Valor', render: (item) => formatarValor(item.valor, item.moeda) },
          { key: 'moeda', header: 'Moeda' },
          { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
          {
            key: 'statusEnvio',
            header: 'Status de envio',
            render: (item) => <StatusBadge label={item.statusEnvio} tone={TONE_ENVIO[item.statusEnvio] ?? 'neutral'} />,
          },
          {
            key: '_acoes',
            header: '',
            sortable: false,
            render: (item) =>
              item.statusEnvio === 'Não enviado' && (
                <button
                  type="button"
                  onClick={() => documentos.editar(item.id, { statusEnvio: 'Enviado' })}
                  className="text-sm text-ayamo-primary hover:underline"
                >
                  Marcar como enviado
                </button>
              ),
          },
        ]}
      />
    </div>
  )
}
