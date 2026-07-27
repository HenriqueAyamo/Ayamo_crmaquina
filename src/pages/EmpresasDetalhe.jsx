import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ModalEditarEmpresa from './empresas/ModalEditarEmpresa.jsx'
import ModalContato from './empresas/ModalContato.jsx'
import HistoricoNegocios from './empresas/HistoricoNegocios.jsx'
import ModalNovaOferta from './compras/ModalNovaOferta.jsx'
import NovaPropostaModal from './vendas/NovaPropostaModal.jsx'
import SecaoRecolhivel from '../components/SecaoRecolhivel.jsx'
import { formatarValor } from '../utils/formato.js'
import { PAISES_QUALIFICACAO, contarAprovacoes } from '../data/qualificacaoPaises.js'

const TONE_SITUACAO = { Ativo: 'success', Inativo: 'neutral', Bloqueado: 'danger' }
const TONE_QUALIFICACAO = { Aprovado: 'success', 'Em andamento': 'warning', 'Não iniciado': 'neutral' }

export default function EmpresasDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { empresas, contatos, categoriasContato, produtos, getUsuario } = useData()

  const empresa = empresas.items.find((e) => e.id === Number(id))

  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [modalContatoAberto, setModalContatoAberto] = useState(false)
  const [contatoEditando, setContatoEditando] = useState(null)
  const [modalCompraAberto, setModalCompraAberto] = useState(false)
  const [modalVendaAberto, setModalVendaAberto] = useState(false)

  if (!empresa) {
    return <EmptyState title="Empresa não encontrada" />
  }

  const contatosDaEmpresa = contatos.items.filter((c) => c.empresaId === empresa.id)
  const categoriasAtivas = categoriasContato.items.filter((c) => c.situacao === 'Ativo')

  function abrirNovoContato() {
    setContatoEditando(null)
    setModalContatoAberto(true)
  }

  function abrirEdicaoContato(contato) {
    setContatoEditando(contato)
    setModalContatoAberto(true)
  }

  function nomesCategorias(categoriasIds) {
    return categoriasIds
      .map((id) => categoriasContato.items.find((c) => c.id === id)?.nome)
      .filter(Boolean)
      .join(', ') || '—'
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/empresas')}
        className="mb-4 flex items-center gap-1 text-sm text-ayamo-text-mut hover:text-ayamo-text"
      >
        <ArrowLeft size={16} />
        Voltar para Empresas
      </button>

      <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ayamo-text">{empresa.nome}</h1>
            <p className="text-sm text-ayamo-text-mut">{empresa.pais} · {empresa.tipo}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge label={empresa.situacao} tone={TONE_SITUACAO[empresa.situacao] ?? 'neutral'} />
            {empresa.tipo === 'Fornecedor' && empresa.situacao === 'Ativo' && (
              <button
                type="button"
                onClick={() => setModalCompraAberto(true)}
                className="rounded bg-ayamo-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Gerar compra
              </button>
            )}
            {empresa.tipo === 'Cliente' && empresa.situacao === 'Ativo' && (
              <button
                type="button"
                onClick={() => setModalVendaAberto(true)}
                className="rounded bg-ayamo-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
              >
                Gerar venda
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalEditarAberto(true)}
              className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-bg"
            >
              Editar
            </button>
            {empresa.situacao === 'Ativo' ? (
              <button
                type="button"
                onClick={() => empresas.inativar(empresa.id)}
                className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-danger hover:bg-ayamo-bg"
              >
                Inativar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => empresas.editar(empresa.id, { situacao: 'Ativo' })}
                className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-success hover:bg-ayamo-bg"
              >
                Reativar
              </button>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-ayamo-text-mut">Responsável Ayamo</dt>
            <dd className="font-medium text-ayamo-text">{getUsuario(empresa.responsavelAyamoId)?.nome ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Moeda padrão</dt>
            <dd className="font-medium text-ayamo-text">{empresa.moedaPadrao}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Limite de crédito</dt>
            <dd className="font-medium text-ayamo-text">{formatarValor(empresa.limiteCredito, empresa.moedaPadrao)}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Crédito utilizado</dt>
            <dd className="font-medium text-ayamo-text">{formatarValor(empresa.creditoUtilizado, empresa.moedaPadrao)}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-ayamo-text-mut">Endereço</dt>
            <dd className="font-medium text-ayamo-text">{empresa.endereco || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">CNPJ</dt>
            <dd className="font-medium text-ayamo-text">{empresa.cnpj || '—'}</dd>
          </div>
          {empresa.tipo === 'Fornecedor' && (
            <div>
              <dt className="text-ayamo-text-mut">SIF / SIPEAGRO</dt>
              <dd className="font-medium text-ayamo-text">{empresa.sif || '—'}</dd>
            </div>
          )}
        </dl>
      </div>

      {empresa.tipo === 'Fornecedor' && (
        <SecaoRecolhivel
          titulo={`Produtos & capacidade (${(empresa.produtosCapacidade ?? []).length})`}
          aberturaInicial={false}
        >
          {(empresa.produtosCapacidade ?? []).length === 0 ? (
            <p className="text-sm text-ayamo-text-mut">Nenhum produto/capacidade informado — edite a empresa para adicionar.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {empresa.produtosCapacidade.map((p, index) => (
                <li key={index} className="flex items-center justify-between rounded border border-ayamo-border bg-ayamo-surface p-3 text-sm">
                  <span className="text-ayamo-text">{p.nome}</span>
                  <span className="text-ayamo-text-mut">
                    {Number(p.volumeMensal || 0).toLocaleString('pt-BR')} {p.unidade}/mês
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SecaoRecolhivel>
      )}

      {empresa.tipo === 'Fornecedor' && (
        <SecaoRecolhivel
          titulo={`Qualificação por país (${contarAprovacoes(empresa.qualificacoesPaises).emAndamentoOuAprovado}/${contarAprovacoes(empresa.qualificacoesPaises).total})`}
          aberturaInicial={false}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAISES_QUALIFICACAO.map((pais) => {
              const status = empresa.qualificacoesPaises?.[pais] ?? 'Não iniciado'
              return (
                <div key={pais} className="flex items-center justify-between gap-2 rounded border border-ayamo-border p-2 text-sm">
                  <span className="text-ayamo-text">{pais}</span>
                  <StatusBadge label={status} tone={TONE_QUALIFICACAO[status]} />
                </div>
              )
            })}
          </div>
        </SecaoRecolhivel>
      )}

      <HistoricoNegocios empresa={empresa} />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ayamo-text">Contatos</h2>
        <button
          type="button"
          onClick={abrirNovoContato}
          className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Adicionar contato
        </button>
      </div>

      <DataTable
        rowKey="id"
        data={contatosDaEmpresa}
        emptyLabel="Nenhum contato cadastrado para esta empresa"
        columns={[
          { key: 'nome', header: 'Nome' },
          { key: 'cargo', header: 'Cargo' },
          { key: 'telefone', header: 'Telefone' },
          { key: 'email', header: 'E-mail' },
          {
            key: 'categorias',
            header: 'Categorias',
            render: (item) => nomesCategorias(item.categoriasIds),
            sortValue: (item) => nomesCategorias(item.categoriasIds),
          },
          {
            key: '_acoes',
            header: '',
            render: (item) => (
              <div className="flex justify-end gap-3 text-sm">
                <button type="button" onClick={() => abrirEdicaoContato(item)} className="text-ayamo-primary hover:underline">
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => contatos.remover(item.id)}
                  className="text-ayamo-danger hover:underline"
                >
                  Remover
                </button>
              </div>
            ),
          },
        ]}
      />

      <ModalContato
        open={modalContatoAberto}
        onClose={() => setModalContatoAberto(false)}
        empresaId={empresa.id}
        contatoEditando={contatoEditando}
        categoriasAtivas={categoriasAtivas}
      />

      <ModalEditarEmpresa open={modalEditarAberto} onClose={() => setModalEditarAberto(false)} empresa={empresa} />

      {empresa.tipo === 'Fornecedor' && (
        <ModalNovaOferta
          open={modalCompraAberto}
          onClose={() => setModalCompraAberto(false)}
          produtosAtivos={produtos.items.filter((p) => p.situacao === 'Ativo')}
          fornecedores={[empresa]}
          inicial={{ fornecedorId: String(empresa.id) }}
          onCriada={(nova) => navigate(`/compras/${nova.codigoBase}`)}
        />
      )}

      {empresa.tipo === 'Cliente' && (
        <NovaPropostaModal
          open={modalVendaAberto}
          onClose={() => setModalVendaAberto(false)}
          clientes={[empresa]}
          clienteFixo={empresa}
          onCriada={(numeros) => {
            if (numeros.length === 1) navigate(`/vendas/${numeros[0]}`)
            else navigate('/vendas')
          }}
        />
      )}
    </div>
  )
}
