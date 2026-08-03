import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalEnviarWhatsApp from '../components/ModalEnviarWhatsApp.jsx'
import { formatarData } from '../utils/formato.js'
import { mensagemCobrancaProposta } from '../utils/mensagensWhatsApp.js'

const ROTULO_TIPO = { proposta: 'Proposta', oferta: 'Oferta' }
const STATUS_COBRAVEIS = ['Rascunho', 'Enviada', 'Em negociação']

export default function Pendencias() {
  const { usuarioLogado, getPendencias, propostas, contatos, getProduto } = useData()
  const navigate = useNavigate()
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [cobrancaAlvo, setCobrancaAlvo] = useState(null)

  const pendencias = useMemo(() => getPendencias(usuarioLogado), [getPendencias, usuarioLogado])

  const pendenciasFiltradas = useMemo(
    () => pendencias.filter((p) => !tipoFiltro || p.tipo === tipoFiltro),
    [pendencias, tipoFiltro],
  )

  function propostaCobravel(item) {
    if (item.tipo !== 'proposta') return null
    const proposta = propostas.items.find((p) => p.numero === item.id)
    return proposta && STATUS_COBRAVEIS.includes(proposta.status) ? proposta : null
  }

  const contatosAlvo = cobrancaAlvo ? contatos.items.filter((c) => c.empresaId === cobrancaAlvo.clienteId) : []

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
          {
            key: '_acoes',
            header: '',
            render: (item) => {
              const proposta = propostaCobravel(item)
              if (!proposta) return null
              return (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCobrancaAlvo(proposta)
                  }}
                  className="rounded border border-ayamo-warning px-3 py-1.5 text-xs font-medium text-ayamo-warning hover:bg-ayamo-bg"
                >
                  Cobrar via WhatsApp
                </button>
              )
            },
          },
        ]}
      />

      <ModalEnviarWhatsApp
        open={Boolean(cobrancaAlvo)}
        onClose={() => setCobrancaAlvo(null)}
        titulo={`Cobrar resposta via WhatsApp — ${cobrancaAlvo?.numero ?? ''}`}
        contatos={contatosAlvo}
        mensagemInicial={cobrancaAlvo ? mensagemCobrancaProposta(cobrancaAlvo, getProduto(cobrancaAlvo.itens[0].produtoId)?.nome ?? '') : ''}
      />
    </div>
  )
}
