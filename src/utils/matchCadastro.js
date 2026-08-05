import { encontrarMelhorCorrespondencia } from './produtoTexto.js'

// Acha o produto do cadastro mais parecido com um nome vindo de fora (planilha, IA, etc.) —
// compara por nome completo e por apelido/sigla (ex.: "Chicken MDM"), nessa ordem: exato primeiro,
// depois o melhor score de aproximação entre os dois.
// "Frozen Pork Boneless Meat - Shoulder - Carton 20kg" traz o corte E a embalagem
// separados por " - ". Cortar no primeiro hífen jogava fora o corte junto com a
// embalagem, sobrava "Frozen Pork Boneless Meat" e isso casava com o produto
// errado — Shoulder entrava como Leg, silenciosamente.
//
// Em vez de adivinhar onde termina o nome, testamos do mais completo ao mais
// curto e ficamos com a melhor pontuação de todas as tentativas.
function variacoesDoNome(nomeBruto) {
  const completo = String(nomeBruto ?? '').trim()
  const partes = completo.split(' - ').map((p) => p.trim()).filter(Boolean)
  const variacoes = []
  for (let fim = partes.length; fim > 0; fim--) {
    const candidato = partes.slice(0, fim).join(' - ')
    if (candidato && !variacoes.includes(candidato)) variacoes.push(candidato)
  }
  return variacoes.length > 0 ? variacoes : [completo]
}

export function acharProdutoPorNome(nomeBruto, produtos) {
  const variacoes = variacoesDoNome(nomeBruto)
  if (variacoes[0] === '') return null

  // Exato vence sempre, e o mais completo é testado primeiro.
  for (const variacao of variacoes) {
    const alvo = variacao.toLowerCase()
    const exato = produtos.find((p) => p.nome?.toLowerCase() === alvo || p.apelido?.toLowerCase() === alvo)
    if (exato) return exato
  }

  const candidatos = variacoes.flatMap((variacao) =>
    [
      encontrarMelhorCorrespondencia(variacao, produtos, (p) => p.nome, 0.6),
      encontrarMelhorCorrespondencia(variacao, produtos, (p) => p.apelido, 0.6),
    ].filter(Boolean),
  )

  const melhor = candidatos.sort((a, b) => b.pontuacao - a.pontuacao)[0]
  return melhor?.item ?? null
}

export function acharFornecedorPorNome(nomeBruto, fornecedores) {
  const alvo = String(nomeBruto ?? '').trim()
  const exato = fornecedores.find((e) => e.nome.toLowerCase() === alvo.toLowerCase())
  if (exato) return exato
  const aproximado = encontrarMelhorCorrespondencia(alvo, fornecedores, (e) => e.nome, 0.6)
  return aproximado?.item ?? null
}
