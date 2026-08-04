import { useMemo, useState } from 'react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import { formatarValor, formatarData } from '../utils/formato.js'

const TONE_ENVIO = { Enviado: 'success', 'Não enviado': 'neutral' }

export default function Documentos() {
  const { documentos } = useData()
  const { t } = useI18n()
  const [tipoFiltro, setTipoFiltro] = useState('')

  const documentosFiltrados = useMemo(() => {
    return [...documentos.items]
      .filter((d) => !tipoFiltro || d.tipo === tipoFiltro)
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [documentos.items, tipoFiltro])

  return (
    <div>
      <PageHeader title={t('documentos.titulo')} subtitle={t('documentos.subtitulo')} />

      <FilterBar>
        <Field label={t('comum.tipo')}>
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">{t('comum.todos')}</option>
            <option value="PO">PO</option>
            <option value="Proforma Invoice">Proforma Invoice</option>
          </select>
        </Field>
      </FilterBar>

      <CardList
        rowKey="id"
        data={documentosFiltrados}
        emptyLabel={t('documentos.vazio')}
        columns={[
          { key: 'tipo', header: t('comum.tipo') },
          { key: 'numero', header: t('vendas.numero') },
          { key: 'propostaNumero', header: t('documentos.propostaOrigem') },
          { key: 'clienteNome', header: t('documentos.destinatario') },
          { key: 'valor', header: t('documentos.valor'), render: (item) => formatarValor(item.valor, item.moeda) },
          { key: 'moeda', header: t('documentos.moeda') },
          { key: 'data', header: t('comum.data'), render: (item) => formatarData(item.data) },
          {
            key: 'statusEnvio',
            header: t('documentos.statusEnvio'),
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
