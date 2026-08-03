import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import { formatarData } from '../utils/formato.js'

const ROTULO_TIPO = { proposta: 'Proposta', oferta: 'Oferta' }

export default function Pendencias() {
  const { usuarioLogado, getPendencias } = useData()
  const navigate = useNavigate()
  const [tipoFiltro, setTipoFiltro] = useState('')

  const pendencias = useMemo(() => getPendencias(usuarioLogado), [getPendencias, usuarioLogado])

  const pendenciasFiltradas = useMemo(
    () => pendencias.filter((p) => !tipoFiltro || p.tipo === tipoFiltro),
    [pendencias, tipoFiltro],
  )

  return (
    <div>
      <PageHeader
        title="Pendências"
        subtitle={`Visão de ${usuarioLogado.nome} (${usuarioLogado.perfil}) — troque o usuário logado no topo da tela para ver outra visão`}
      />

      <FilterBar>
        <Field label="Tipo">
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="proposta">Proposta</option>
            <option value="oferta">Oferta</option>
          </select>
        </Field>
      </FilterBar>

      <CardList
        rowKey={(item) => `${item.tipo}-${item.id}-${item.data}`}
        data={pendenciasFiltradas}
        emptyLabel="Nada pendente para este usuário"
        onRowClick={(item) => navigate(item.tipo === 'oferta' ? `/compras/${item.id}` : `/vendas/${item.id}`)}
        columns={[
          { key: 'titulo', header: 'Título' },
          { key: 'tipo', header: 'Tipo', render: (item) => ROTULO_TIPO[item.tipo] ?? item.tipo },
          { key: 'descricao', header: 'Descrição' },
          { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
        ]}
      />
    </div>
  )
}
