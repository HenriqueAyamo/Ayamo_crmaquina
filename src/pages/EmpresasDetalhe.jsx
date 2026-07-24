import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ModalEditarEmpresa from './empresas/ModalEditarEmpresa.jsx'
import { formatarValor } from '../utils/formato.js'

const TONE_SITUACAO = { Ativo: 'success', Inativo: 'neutral', Bloqueado: 'danger' }

function valoresIniciaisContato() {
  return { nome: '', cargo: '', telefone: '', email: '', categoriasIds: [] }
}

export default function EmpresasDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { empresas, contatos, categoriasContato, getUsuario } = useData()

  const empresa = empresas.items.find((e) => e.id === Number(id))

  const [modalEditarAberto, setModalEditarAberto] = useState(false)
  const [modalContatoAberto, setModalContatoAberto] = useState(false)
  const [contatoEditando, setContatoEditando] = useState(null)
  const [formContato, setFormContato] = useState(valoresIniciaisContato())

  if (!empresa) {
    return <EmptyState title="Empresa não encontrada" />
  }

  const contatosDaEmpresa = contatos.items.filter((c) => c.empresaId === empresa.id)
  const categoriasAtivas = categoriasContato.items.filter((c) => c.situacao === 'Ativo')

  function abrirNovoContato() {
    setContatoEditando(null)
    setFormContato(valoresIniciaisContato())
    setModalContatoAberto(true)
  }

  function abrirEdicaoContato(contato) {
    setContatoEditando(contato)
    setFormContato({
      nome: contato.nome,
      cargo: contato.cargo,
      telefone: contato.telefone,
      email: contato.email,
      categoriasIds: contato.categoriasIds,
    })
    setModalContatoAberto(true)
  }

  function alternarCategoria(categoriaId) {
    setFormContato((atual) => ({
      ...atual,
      categoriasIds: atual.categoriasIds.includes(categoriaId)
        ? atual.categoriasIds.filter((id) => id !== categoriaId)
        : [...atual.categoriasIds, categoriaId],
    }))
  }

  function salvarContato(e) {
    e.preventDefault()
    if (contatoEditando) {
      contatos.editar(contatoEditando.id, formContato)
    } else {
      contatos.criar({ ...formContato, empresaId: empresa.id })
    }
    setModalContatoAberto(false)
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
        </dl>
      </div>

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

      <Modal
        open={modalContatoAberto}
        onClose={() => setModalContatoAberto(false)}
        title={contatoEditando ? 'Editar contato' : 'Adicionar contato'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalContatoAberto(false)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="contato-form"
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Salvar
            </button>
          </>
        }
      >
        <form id="contato-form" onSubmit={salvarContato} className="flex flex-col gap-4">
          <Field label="Nome" required>
            <input
              className={inputClass}
              required
              value={formContato.nome}
              onChange={(e) => setFormContato({ ...formContato, nome: e.target.value })}
            />
          </Field>
          <Field label="Cargo" required>
            <input
              className={inputClass}
              required
              value={formContato.cargo}
              onChange={(e) => setFormContato({ ...formContato, cargo: e.target.value })}
            />
          </Field>
          <Field label="Telefone" required>
            <input
              className={inputClass}
              required
              value={formContato.telefone}
              onChange={(e) => setFormContato({ ...formContato, telefone: e.target.value })}
            />
          </Field>
          <Field label="E-mail" required>
            <input
              type="email"
              className={inputClass}
              required
              value={formContato.email}
              onChange={(e) => setFormContato({ ...formContato, email: e.target.value })}
            />
          </Field>
          <Field label="Categorias">
            <div className="flex flex-wrap gap-3">
              {categoriasAtivas.map((c) => (
                <label key={c.id} className="flex items-center gap-1.5 text-sm text-ayamo-text">
                  <input
                    type="checkbox"
                    checked={formContato.categoriasIds.includes(c.id)}
                    onChange={() => alternarCategoria(c.id)}
                  />
                  {c.nome}
                </label>
              ))}
            </div>
          </Field>
        </form>
      </Modal>

      <ModalEditarEmpresa open={modalEditarAberto} onClose={() => setModalEditarAberto(false)} empresa={empresa} />
    </div>
  )
}
