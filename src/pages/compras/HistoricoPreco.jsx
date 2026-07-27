import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../DataContext.jsx'
import FilterBar from '../../components/FilterBar.jsx'
import DataTable from '../../components/DataTable.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import { formatarPreco, formatarData } from '../../utils/formato.js'

export default function HistoricoPreco() {
  const { ofertas, produtos, empresas, getProduto, getEmpresa } = useData()
  const navigate = useNavigate()

  const [produtoFiltro, setProdutoFiltro] = useState('')
  const [fornecedorFiltro, setFornecedorFiltro] = useState('')

  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor')

  const revisoes = useMemo(() => {
    return [...ofertas.items]
      .filter((o) => (!produtoFiltro || o.produtoId === Number(produtoFiltro)) && (!fornecedorFiltro || o.fornecedorId === Number(fornecedorFiltro)))
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [ofertas.items, produtoFiltro, fornecedorFiltro])

  return (
    <div>
      <FilterBar>
        <Field label="Produto">
          <select className={inputClass} value={produtoFiltro} onChange={(e) => setProdutoFiltro(e.target.value)}>
            <option value="">Todos</option>
            {produtos.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Fornecedor">
          <select className={inputClass} value={fornecedorFiltro} onChange={(e) => setFornecedorFiltro(e.target.value)}>
            <option value="">Todos</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </Field>
      </FilterBar>

      <DataTable
        rowKey="id"
        data={revisoes}
        emptyLabel="Nenhuma revisão de preço registrada"
        onRowClick={(item) => navigate(`/compras/${item.codigoBase}`)}
        columns={[
          { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
          {
            key: 'produto',
            header: 'Produto',
            render: (item) => getProduto(item.produtoId)?.nome ?? '—',
            sortValue: (item) => getProduto(item.produtoId)?.nome ?? '',
          },
          {
            key: 'fornecedor',
            header: 'Fornecedor',
            render: (item) => getEmpresa(item.fornecedorId)?.nome ?? '—',
            sortValue: (item) => getEmpresa(item.fornecedorId)?.nome ?? '',
          },
          {
            key: 'versao',
            header: 'Versão',
            render: (item) => (item.versao === 0 ? 'Original' : `R${item.versao}`),
          },
          {
            key: 'preco',
            header: 'Preço',
            render: (item) => formatarPreco(item.precoCusto.valor, item.precoCusto.moeda, item.precoCusto.unidade),
            sortValue: (item) => item.precoCusto.valor,
          },
          { key: 'quantidade', header: 'Quantidade', render: (item) => `${item.quantidade.toLocaleString('pt-BR')} ${item.unidade}` },
        ]}
      />
    </div>
  )
}
