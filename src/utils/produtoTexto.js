function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function bigramas(texto) {
  const normalizado = normalizar(texto).replace(/\s/g, '')
  const conjunto = new Set()
  for (let i = 0; i < normalizado.length - 1; i += 1) conjunto.add(normalizado.slice(i, i + 2))
  return conjunto
}

// Coeficiente de Dice sobre bigramas — 1 = identico, 0 = nada em comum.
export function similaridade(a, b) {
  if (!a || !b) return 0
  const setA = bigramas(a)
  const setB = bigramas(b)
  if (setA.size === 0 || setB.size === 0) return normalizar(a) === normalizar(b) ? 1 : 0
  let intersecao = 0
  setA.forEach((bg) => {
    if (setB.has(bg)) intersecao += 1
  })
  return (2 * intersecao) / (setA.size + setB.size)
}

// Encontra o item de `lista` mais parecido com `nome` (por `obterNome`), acima do limiar.
export function encontrarMelhorCorrespondencia(nome, lista, obterNome, limiar = 0.6) {
  let melhor = null
  let melhorPontuacao = 0
  lista.forEach((item) => {
    const pontuacao = similaridade(nome, obterNome(item))
    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao
      melhor = item
    }
  })
  return melhorPontuacao >= limiar ? { item: melhor, pontuacao: melhorPontuacao } : null
}

export function paraTitleCase(texto) {
  return texto
    .toLowerCase()
    .replace(/(^|\s|-|\/)([a-zà-ú])/g, (match, separador, letra) => separador + letra.toUpperCase())
}
