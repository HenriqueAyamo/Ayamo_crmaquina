import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import DataTable from '../components/DataTable.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import DisabledActionTooltip from '../components/DisabledActionTooltip.jsx'
import { MOTIVOS } from '../utils/permissoes.js'

const PERFIS = ['Comprador', 'Vendedor', 'Diretor', 'Financeiro', 'Controladoria', 'Administrador']

function valoresIniciais() {
  return { nome: '', email: '', perfil: 'Vendedor', responsabilidades: [] }
}

export default function Usuarios() {
  const { usuarios, divisoes, getDivisao, usuarioLogado } = useData()
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(valoresIniciais())

  const diretores = usuarios.items.filter((u) => u.perfil === 'Diretor' && u.situacao === 'Ativo')
  const divisoesAtivas = divisoes.items.filter((d) => d.situacao === 'Ativo')
  const ativos = usuarios.items.filter((u) => u.situacao === 'Ativo')

  const adminsAtivos = usuarios.items.filter((u) => u.perfil === 'Administrador' && u.situacao === 'Ativo')

  function podeInativarOuRemover(item) {
    if (item.id === usuarioLogado.id) return false
    if (item.situacao === 'Ativo' && ativos.length <= 1) return false
    if (item.perfil === 'Administrador' && item.situacao === 'Ativo' && adminsAtivos.length <= 1) return false
    return true
  }

  function motivoBloqueio(item) {
    if (item.id === usuarioLogado.id) return MOTIVOS.proprioUsuario
    if (item.perfil === 'Administrador' && item.situacao === 'Ativo' && adminsAtivos.length <= 1) return MOTIVOS.ultimoAdministrador
    if (item.situacao === 'Ativo' && ativos.length <= 1) return 'Precisa haver ao menos 1 usuário ativo no sistema.'
    return undefined
  }

  function mudarPerfilInline(item, novoPerfil) {
    if (item.perfil === 'Administrador' && novoPerfil !== 'Administrador' && adminsAtivos.length <= 1) {
      window.alert(MOTIVOS.ultimoAdministrador)
      return
    }
    if (!window.confirm(`Mudar o perfil de "${item.nome}" de ${item.perfil} para ${novoPerfil}?`)) return
    usuarios.editar(item.id, { perfil: novoPerfil })
  }

  function abrirNovo() {
    setEditando(null)
    setForm(valoresIniciais())
    setModalAberto(true)
  }

  function abrirEdicao(usuario) {
    setEditando(usuario)
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      responsabilidades: usuario.responsabilidades,
    })
    setModalAberto(true)
  }

  function adicionarResponsabilidade() {
    setForm((atual) => ({
      ...atual,
      responsabilidades: [...atual.responsabilidades, { divisaoId: '', diretorId: '' }],
    }))
  }

  function atualizarResponsabilidade(index, campo, valor) {
    setForm((atual) => ({
      ...atual,
      responsabilidades: atual.responsabilidades.map((r, i) => (i === index ? { ...r, [campo]: Number(valor) } : r)),
    }))
  }

  function removerResponsabilidade(index) {
    setForm((atual) => ({
      ...atual,
      responsabilidades: atual.responsabilidades.filter((_, i) => i !== index),
    }))
  }

  function salvar(e) {
    e.preventDefault()
    if (editando && editando.perfil === 'Administrador' && form.perfil !== 'Administrador' && adminsAtivos.length <= 1) {
      window.alert(MOTIVOS.ultimoAdministrador)
      return
    }
    if (editando) usuarios.editar(editando.id, form)
    else usuarios.criar(form)
    setModalAberto(false)
  }

  function resumoResponsabilidades(responsabilidades) {
    if (responsabilidades.length === 0) return '—'
    return responsabilidades
      .map((r) => `${getDivisao(r.divisaoId)?.nome ?? '?'} → ${usuarios.items.find((u) => u.id === r.diretorId)?.nome ?? '?'}`)
      .join(' · ')
  }

  return (
    <div>
      <PageHeader title="Usuários" subtitle="Colaboradores da Ayamo e hierarquia de aprovação" actionLabel="Novo usuário" onAction={abrirNovo} />

      <DataTable
        rowKey="id"
        data={usuarios.items}
        columns={[
          { key: 'nome', header: 'Nome' },
          { key: 'email', header: 'E-mail' },
          {
            key: 'perfil',
            header: 'Perfil',
            render: (item) => (
              <select
                className="rounded border border-ayamo-border bg-ayamo-surface px-2 py-1 text-xs text-ayamo-text outline-none focus:border-ayamo-primary"
                value={item.perfil}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => mudarPerfilInline(item, e.target.value)}
              >
                {PERFIS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            ),
          },
          { key: 'responsabilidades', header: 'Responsabilidades', render: (item) => resumoResponsabilidades(item.responsabilidades) },
          {
            key: 'situacao',
            header: 'Situação',
            render: (item) => <StatusBadge label={item.situacao} tone={item.situacao === 'Ativo' ? 'success' : 'neutral'} />,
          },
          {
            key: '_acoes',
            header: '',
            render: (item) => (
              <div className="flex justify-end gap-3 text-sm">
                <button type="button" onClick={() => abrirEdicao(item)} className="text-ayamo-primary hover:underline">
                  Editar
                </button>
                {item.situacao === 'Ativo' ? (
                  <DisabledActionTooltip desabilitado={!podeInativarOuRemover(item)} motivo={motivoBloqueio(item)}>
                    <button
                      type="button"
                      disabled={!podeInativarOuRemover(item)}
                      onClick={() => usuarios.inativar(item.id)}
                      className="text-ayamo-danger hover:underline disabled:cursor-not-allowed disabled:text-ayamo-text-mut disabled:no-underline"
                    >
                      Inativar
                    </button>
                  </DisabledActionTooltip>
                ) : (
                  <button
                    type="button"
                    onClick={() => usuarios.editar(item.id, { situacao: 'Ativo' })}
                    className="text-ayamo-success hover:underline"
                  >
                    Reativar
                  </button>
                )}
                <DisabledActionTooltip desabilitado={!podeInativarOuRemover(item)} motivo={motivoBloqueio(item)}>
                  <button
                    type="button"
                    disabled={!podeInativarOuRemover(item)}
                    onClick={() => {
                      if (window.confirm(`Excluir o usuário "${item.nome}" definitivamente?`)) usuarios.remover(item.id)
                    }}
                    className="text-ayamo-danger hover:underline disabled:cursor-not-allowed disabled:text-ayamo-text-mut disabled:no-underline"
                  >
                    Excluir
                  </button>
                </DisabledActionTooltip>
              </div>
            ),
          },
        ]}
      />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? 'Editar usuário' : 'Novo usuário'}
        width="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalAberto(false)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              Cancelar
            </button>
            <button type="submit" form="usuario-form" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Salvar
            </button>
          </>
        }
      >
        <form id="usuario-form" onSubmit={salvar} className="flex flex-col gap-4">
          <Field label="Nome" required>
            <input className={inputClass} required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Field>
          <Field label="E-mail" required>
            <input type="email" className={inputClass} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Perfil" required>
            <select className={inputClass} value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value })}>
              {PERFIS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-ayamo-text">Responsabilidades</span>
              <button type="button" onClick={adicionarResponsabilidade} className="flex items-center gap-1 text-sm text-ayamo-primary hover:underline">
                <Plus size={14} />
                Adicionar linha
              </button>
            </div>

            {form.responsabilidades.length === 0 && (
              <p className="text-sm text-ayamo-text-mut">Nenhuma responsabilidade definida.</p>
            )}

            <div className="flex flex-col gap-2">
              {form.responsabilidades.map((r, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    className={inputClass}
                    required
                    value={r.divisaoId}
                    onChange={(e) => atualizarResponsabilidade(index, 'divisaoId', e.target.value)}
                  >
                    <option value="">Divisão</option>
                    {divisoesAtivas.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClass}
                    required
                    value={r.diretorId}
                    onChange={(e) => atualizarResponsabilidade(index, 'diretorId', e.target.value)}
                  >
                    <option value="">Diretor aprovador</option>
                    {diretores.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.nome}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removerResponsabilidade(index)} className="p-2 text-ayamo-danger hover:opacity-70">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
