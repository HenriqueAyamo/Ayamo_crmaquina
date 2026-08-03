import { encontrarMelhorCorrespondencia } from './produtoTexto.js'

// Acha o produto do cadastro mais parecido com um nome vindo de fora (planilha, IA, etc.) —
// compara por nome completo e por apelido/sigla (ex.: "Chicken MDM"), nessa ordem: exato primeiro,
// depois o melhor score de aproximação entre os dois.
export function acharProdutoPorNome(nomeBruto, produtos) {
  const nome = String(nomeBruto ?? '').split(' - ')[0].trim()
  const exato = produtos.find((p) => p.nome.toLowerCase() === nome.toLowerCase() || p.apelido.toLowerCase() === nome.toLowerCase())
  if (exato) return exato
  const porNome = encontrarMelhorCorrespondencia(nome, produtos, (p) => p.nome, 0.6)
  const porApelido = encontrarMelhorCorrespondencia(nome, produtos, (p) => p.apelido, 0.6)
  const melhor = [porNome, porApelido].filter(Boolean).sort((a, b) => b.pontuacao - a.pontuacao)[0]
  return melhor?.item ?? null
}

export function acharFornecedorPorNome(nomeBruto, fornecedores) {
  const alvo = String(nomeBruto ?? '').trim()
  const exato = fornecedores.find((e) => e.nome.toLowerCase() === alvo.toLowerCase())
  if (exato) return exato
  const aproximado = encontrarMelhorCorrespondencia(alvo, fornecedores, (e) => e.nome, 0.6)
  return aproximado?.item ?? null
}
