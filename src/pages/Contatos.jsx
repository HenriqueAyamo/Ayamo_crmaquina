import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import DataTable from '../components/DataTable.jsx'
import Field, { inputClass } from '../components/Field.jsx'

export default function Contatos() {
  const { contatos, empresas, categoriasContato } = useData()
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
      <PageHeader title="Contatos" subtitle="Consulta consolidada de todos os contatos das empresas" />

      <FilterBar>
        <Field label="Buscar">
          <input
            className={inputClass}
            placeholder="Nome do contato ou da empresa"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
      </FilterBar>

      <DataTable
        rowKey="id"
        data={contatosFiltrados}
        onRowClick={(item) => navigate(`/empresas/${item.empresaId}`)}
        columns={[
          { key: 'nome', header: 'Nome' },
          {
            key: 'empresa',
            header: 'Empresa',
            render: (item) => nomeEmpresa(item.empresaId),
            sortValue: (item) => nomeEmpresa(item.empresaId),
          },
          { key: 'cargo', header: 'Cargo' },
          { key: 'telefone', header: 'Telefone' },
          { key: 'email', header: 'E-mail' },
          {
            key: 'categorias',
            header: 'Categorias',
            render: (item) => nomesCategorias(item.categoriasIds),
            sortValue: (item) => nomesCategorias(item.categoriasIds),
          },
        ]}
      />
    </div>
  )
}
