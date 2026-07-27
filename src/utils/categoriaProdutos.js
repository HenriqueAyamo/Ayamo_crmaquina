export const CATEGORIAS_PRODUTO = ['Aves', 'Suíno', 'Bovino', 'Peixe', 'Gordura', 'Outro']

const PALAVRAS_CHAVE = {
  Aves: ['chicken', 'frango', 'ave', 'poultry', 'turkey', 'peru'],
  Suíno: ['pork', 'suíno', 'suino', 'pig', 'swine'],
  Bovino: ['beef', 'bovino', 'boi', 'cattle'],
  Peixe: ['fish', 'peixe', 'tilapia', 'croaker', 'seafood', 'salmon', 'salmão', 'shrimp', 'camarão'],
  Gordura: ['fat', 'gordura', 'oil', 'óleo', 'tallow', 'sebo'],
}

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function classificarProduto(nome) {
  if (!nome) return 'Outro'
  const normalizado = normalizar(nome)
  for (const categoria of CATEGORIAS_PRODUTO) {
    if (categoria === 'Outro') continue
    const palavras = PALAVRAS_CHAVE[categoria] ?? []
    if (palavras.some((p) => normalizado.includes(normalizar(p)))) return categoria
  }
  return 'Outro'
}

export const CATEGORIA_TONE = {
  Aves: 'accent',
  Suíno: 'danger',
  Bovino: 'warning',
  Peixe: 'info',
  Gordura: 'success',
  Outro: 'neutral',
}

const VARIANTES_BRASIL = ['brasil', 'brazil', 'br']

export function isNacional(pais) {
  if (!pais) return false
  return VARIANTES_BRASIL.includes(normalizar(pais).trim())
}
