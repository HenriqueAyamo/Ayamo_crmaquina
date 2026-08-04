export function hojeISO() {
  return new Date().toISOString().slice(0, 10)
}

export function diasAte(dataISO) {
  if (!dataISO) return null
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const alvo = new Date(`${dataISO}T00:00:00`)
  alvo.setHours(0, 0, 0, 0)
  return Math.round((alvo - hoje) / (1000 * 60 * 60 * 24))
}

// Um follow-up é uma interação que ficou com data de retorno marcada e ainda não foi concluída.
export function ehFollowUpAberto(interacao) {
  return Boolean(interacao.followUpEm) && !interacao.followUpConcluido
}

export const SITUACOES_FOLLOWUP = {
  vencido: { rotulo: 'Vencido', tone: 'danger' },
  hoje: { rotulo: 'Hoje', tone: 'warning' },
  proximos: { rotulo: 'Próximos 7 dias', tone: 'accent' },
  futuro: { rotulo: 'Mais adiante', tone: 'neutral' },
}

export function situacaoFollowUp(interacao) {
  const dias = diasAte(interacao.followUpEm)
  if (dias == null) return null
  if (dias < 0) return 'vencido'
  if (dias === 0) return 'hoje'
  if (dias <= 7) return 'proximos'
  return 'futuro'
}

export function followUpsAbertos(interacoes, { responsavelId } = {}) {
  return interacoes
    .filter(ehFollowUpAberto)
    .filter((i) => responsavelId == null || i.followUpResponsavelId === responsavelId)
    .sort((a, b) => (a.followUpEm < b.followUpEm ? -1 : 1))
}

export function contarVencidos(interacoes, responsavelId) {
  return followUpsAbertos(interacoes, { responsavelId }).filter((i) => diasAte(i.followUpEm) < 0).length
}

// Última interação real registrada com a empresa (não derivada de oferta/proposta).
export function ultimaInteracaoRegistrada(interacoes, empresaId) {
  const daEmpresa = interacoes.filter((i) => i.empresaId === empresaId)
  if (daEmpresa.length === 0) return null
  return daEmpresa.reduce((maisRecente, i) => (i.data > maisRecente.data ? i : maisRecente))
}
