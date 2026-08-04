import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import Field, { inputClass } from '../components/Field.jsx'

export default function Contatos() {
  const { contatos, empresas, categoriasContato } = useData()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')

  function nomeEmpresa(empresaId) {
    return empresas.items.find((e) => e.id === empresaId)?.nome ?? '—'
  }

  function nomesCategorias(categoriasIds) {
    return (
      categoriasIds
        .map((id) => categoriasContato.items.find((c) => c.id === id)?.nome)
        .filter(Boolean)
        .join(', ') || '—'
    )
  }

  const termo = busca.toLowerCase()
  const contatosFiltrados = contatos.items.filter(
    (c) => c.nome.toLowerCase().includes(termo) || nomeEmpresa(c.empresaId).toLowerCase().includes(termo),
  )

  return (
    <div>
      <PageHeader title={t('contatos.titulo')} subtitle={t('contatos.subtitulo')} />

      <FilterBar>
        <Field label={t('comum.buscar')}>
          <input
            className={inputClass}
            placeholder={t('contatos.buscaPlaceholder')}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
      </FilterBar>

      <CardList
        rowKey="id"
        data={contatosFiltrados}
        onRowClick={(item) => navigate(`/empresas/${item.empresaId}`)}
        columns={[
          { key: 'nome', header: t('contatos.nome') },
          {
            key: 'empresa',
            header: t('nav.empresas'),
            render: (item) => nomeEmpresa(item.empresaId),
            sortValue: (item) => nomeEmpresa(item.empresaId),
          },
          { key: 'cargo', header: t('contatos.cargo') },
          { key: 'telefone', header: t('contatos.telefone') },
          { key: 'email', header: t('contatos.email') },
          {
            key: 'categorias',
            header: t('contatos.categorias'),
            render: (item) => nomesCategorias(item.categoriasIds),
            sortValue: (item) => nomesCategorias(item.categoriasIds),
          },
        ]}
      />
    </div>
  )
}
