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
  const paises = Array.from(new Set([...PAISES_QUALIFICACAO, ...Object.keys(mapa)]))
  const total = paises.length
  const emAndamentoOuAprovado = paises.filter((p) => mapa[p] && mapa[p] !== 'Não iniciado').length
  return { emAndamentoOuAprovado, total }
}
