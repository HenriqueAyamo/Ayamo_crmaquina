export const PAISES_QUALIFICACAO = [
  'Chile',
  'Colômbia',
  'Estados Unidos',
  'Equador',
  'Peru',
  'Bolívia',
  'China',
  'Filipinas',
  'Indonésia',
]

export const STATUS_QUALIFICACAO = ['Não iniciado', 'Em andamento', 'Aprovado']

export function contarAprovacoes(qualificacoesPaises) {
  const mapa = qualificacoesPaises ?? {}
  const total = PAISES_QUALIFICACAO.length
  const emAndamentoOuAprovado = PAISES_QUALIFICACAO.filter((p) => mapa[p] && mapa[p] !== 'Não iniciado').length
  return { emAndamentoOuAprovado, total }
}
