import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, CheckCircle2 } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Botao from '../components/Botao.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import { formatarData } from '../utils/formato.js'
import { SITUACOES_FOLLOWUP, diasAte, followUpsAbertos, situacaoFollowUp } from '../utils/followups.js'

const ORDEM_GRUPOS = ['vencido', 'hoje', 'proximos', 'futuro']

export default function FollowUps() {
  const { interacoes, usuarios, usuarioLogado, getEmpresa, getUsuario, contatos } = useData()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [responsavelFiltro, setResponsavelFiltro] = useState(String(usuarioLogado.id))
  const [mostrarConcluidos, setMostrarConcluidos] = useState(false)

  const usuariosAtivos = usuarios.items.filter((u) => u.situacao === 'Ativo')

  const abertos = useMemo(() => {
    const responsavelId = responsavelFiltro === '' ? null : Number(responsavelFiltro)
    return followUpsAbertos(interacoes.items, { responsavelId })
  }, [interacoes.items, responsavelFiltro])

  const concluidos = useMemo(() => {
    if (!mostrarConcluidos) return []
    const responsavelId = responsavelFiltro === '' ? null : Number(responsavelFiltro)
    return interacoes.items
      .filter((i) => i.followUpEm && i.followUpConcluido)
      .filter((i) => responsavelId == null || i.followUpResponsavelId === responsavelId)
      .sort((a, b) => (a.followUpEm < b.followUpEm ? 1 : -1))
  }, [interacoes.items, responsavelFiltro, mostrarConcluidos])

  const grupos = useMemo(() => {
    const mapa = { vencido: [], hoje: [], proximos: [], futuro: [] }
    abertos.forEach((i) => mapa[situacaoFollowUp(i)]?.push(i))
    return mapa
  }, [abertos])

  function concluir(interacao) {
    interacoes.editar(interacao.id, { followUpConcluido: true, followUpConcluidoEm: new Date().toISOString().slice(0, 10) })
  }

  function irParaOrigem(i) {
    if (i.refTipo === 'oferta' && i.refId) navigate(`/compras/${i.refId}`)
    else if (i.refTipo === 'proposta' && i.refId) navigate(`/vendas/${i.refId}`)
    else navigate(`/empresas/${i.empresaId}`)
  }

  function nomeContato(contatoId) {
    return contatos.items.find((c) => c.id === contatoId)?.nome
  }

  function Cartao({ interacao, concluido = false }) {
    const dias = diasAte(interacao.followUpEm)
    const situacao = situacaoFollowUp(interacao)
    return (
      <li className="rounded-lg border border-ayamo-border bg-ayamo-surface p-4 transition-shadow hover:shadow-card-hover">
        <div className="mb-1.5 flex flex-wrap items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => irParaOrigem(interacao)}
            className="text-left text-sm font-semibold text-ayamo-text hover:text-ayamo-primary hover:underline"
          >
            {getEmpresa(interacao.empresaId)?.nome ?? '—'}
            {interacao.refId && <span className="ml-2 font-normal text-ayamo-text-mut">· {interacao.refId}</span>}
          </button>
          <div className="flex items-center gap-2">
            {concluido ? (
              <StatusBadge label={t('followups.concluido')} tone="success" icon={CheckCircle2} />
            ) : (
              <StatusBadge
                label={situacao === 'vencido' ? `${t('followups.vencido')} ${Math.abs(dias)}d` : t(`followups.${situacao}`)}
                tone={SITUACOES_FOLLOWUP[situacao]?.tone}
              />
            )}
          </div>
        </div>

        <p className="text-sm text-ayamo-text-mut">{interacao.observacao}</p>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-ayamo-border pt-2 text-xs text-ayamo-text-mut">
          <span className="flex items-center gap-1.5">
            <CalendarClock size={13} />
            {formatarData(interacao.followUpEm)} · {getUsuario(interacao.followUpResponsavelId)?.nome ?? '—'}
            {nomeContato(interacao.contatoId) && ` · contato: ${nomeContato(interacao.contatoId)}`}
          </span>
          {!concluido && (
            <Botao variante="sucesso" tamanho="sm" icone={CheckCircle2} onClick={() => concluir(interacao)}>
              {t('followups.marcarFeito')}
            </Botao>
          )}
        </div>
      </li>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('followups.titulo')}
        subtitle={t('followups.subtitulo')}
      />

      <FilterBar>
        <Field label={t('followups.responsavel')}>
          <select className={inputClass} value={responsavelFiltro} onChange={(e) => setResponsavelFiltro(e.target.value)}>
            <option value="">{t('comum.todos')}</option>
            {usuariosAtivos.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome} — {u.perfil}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('followups.concluidos')}>
          <select
            className={inputClass}
            value={mostrarConcluidos ? '1' : '0'}
            onChange={(e) => setMostrarConcluidos(e.target.value === '1')}
          >
            <option value="0">{t('followups.ocultar')}</option>
            <option value="1">{t('followups.mostrar')}</option>
          </select>
        </Field>
      </FilterBar>

      {abertos.length === 0 && concluidos.length === 0 ? (
        <EmptyState
          title={t('followups.vazio')}
          description={t('followups.vazioDica')}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {ORDEM_GRUPOS.filter((g) => grupos[g].length > 0).map((g) => (
            <div key={g}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ayamo-text-mut">
                {t(`followups.${g}`)}
                <span className="rounded-full bg-ayamo-text-mut/10 px-2 py-0.5 text-[11px] font-medium">{grupos[g].length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {grupos[g].map((i) => (
                  <Cartao key={i.id} interacao={i} />
                ))}
              </ul>
            </div>
          ))}

          {concluidos.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ayamo-text-mut">{t('followups.concluidos')}</h2>
              <ul className="flex flex-col gap-2 opacity-70">
                {concluidos.map((i) => (
                  <Cartao key={i.id} interacao={i} concluido />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
