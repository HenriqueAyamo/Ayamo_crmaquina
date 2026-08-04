import { useMemo, useState } from 'react'
import { CalendarClock, CheckCircle2, MessageSquarePlus } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import SecaoRecolhivel from './SecaoRecolhivel.jsx'
import StatusBadge from './StatusBadge.jsx'
import Botao from './Botao.jsx'
import ModalRegistrarInteracao from './ModalRegistrarInteracao.jsx'
import { formatarData } from '../utils/formato.js'
import { SITUACOES_FOLLOWUP, diasAte, ehFollowUpAberto, situacaoFollowUp } from '../utils/followups.js'

// Linha do tempo de contatos com a empresa + follow-ups agendados.
// Usada em Empresas, Compras e Vendas — em Compras/Vendas filtra pelo registro (refTipo/refId).
export default function SecaoInteracoes({ empresaId, refTipo = null, refId = null, titulo }) {
  const { interacoes, getUsuario, contatos } = useData()
  const { t } = useI18n()
  const rotulo = titulo ?? t('followups.secaoTitulo')
  const [modalAberto, setModalAberto] = useState(false)

  const lista = useMemo(() => {
    return interacoes.items
      .filter((i) => i.empresaId === empresaId)
      .filter((i) => (refId ? i.refTipo === refTipo && i.refId === refId : true))
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [interacoes.items, empresaId, refTipo, refId])

  const abertos = lista.filter(ehFollowUpAberto).length

  function concluir(interacao) {
    interacoes.editar(interacao.id, { followUpConcluido: true, followUpConcluidoEm: new Date().toISOString().slice(0, 10) })
  }

  function nomeContato(contatoId) {
    return contatos.items.find((c) => c.id === contatoId)?.nome
  }

  return (
    <SecaoRecolhivel titulo={`${rotulo}${abertos > 0 ? ` (${abertos})` : ''}`} aberturaInicial={abertos > 0}>
      <div className="mb-3">
        <Botao variante="secundario" tamanho="sm" icone={MessageSquarePlus} onClick={() => setModalAberto(true)}>
          {t('followups.registrarContato')}
        </Botao>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-md border border-dashed border-ayamo-border px-4 py-6 text-center text-sm text-ayamo-text-mut">
          {t('followups.semContatos')}
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {lista.map((i) => {
            const situacao = ehFollowUpAberto(i) ? situacaoFollowUp(i) : null
            const dias = diasAte(i.followUpEm)
            return (
              <li key={i.id} className="rounded-lg border border-ayamo-border bg-ayamo-surface p-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ayamo-text">
                    {i.tipo}
                    {nomeContato(i.contatoId) && (
                      <span className="font-normal text-ayamo-text-mut">com {nomeContato(i.contatoId)}</span>
                    )}
                  </span>
                  <span className="text-xs text-ayamo-text-mut">
                    {formatarData(i.data)} · {getUsuario(i.usuarioId)?.nome ?? '—'}
                  </span>
                </div>

                {i.observacao && <p className="text-sm text-ayamo-text-mut">{i.observacao}</p>}

                {i.followUpEm && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-ayamo-border pt-2">
                    <CalendarClock size={14} className="text-ayamo-text-mut" />
                    <span className="text-xs text-ayamo-text-mut">
                      Follow-up em {formatarData(i.followUpEm)} · {getUsuario(i.followUpResponsavelId)?.nome ?? '—'}
                    </span>
                    {i.followUpConcluido ? (
                      <StatusBadge label={t('followups.concluido')} tone="success" icon={CheckCircle2} />
                    ) : (
                      <>
                        <StatusBadge
                          label={
                            situacao === 'vencido'
                              ? `${t('followups.vencido')} ${Math.abs(dias)}d`
                              : t(`followups.${situacao}`)
                          }
                          tone={SITUACOES_FOLLOWUP[situacao]?.tone}
                        />
                        <Botao variante="sutil" tamanho="sm" icone={CheckCircle2} onClick={() => concluir(i)}>
                          {t('followups.marcarFeito')}
                        </Botao>
                      </>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      <ModalRegistrarInteracao
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        empresaId={empresaId}
        refTipo={refTipo}
        refId={refId}
      />
    </SecaoRecolhivel>
  )
}
