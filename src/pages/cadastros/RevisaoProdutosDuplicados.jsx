import { useMemo, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { similaridade } from '../../utils/produtoTexto.js'

// Limiar alto de propósito: variações legítimas do mesmo produto (ex.: "Fish Meal 55%" vs
// "Fish Meal 60%", ou cortes diferentes "Pork Leg" vs "Pork Shoulder") têm alta similaridade
// textual mas são produtos DIFERENTES — só sinaliza como duplicado o que é quase idêntico
// (erro de digitação, acentuação, singular/plural), nunca variações reais de especificação.
const LIMIAR = 0.92

export default function RevisaoProdutosDuplicados() {
  const { produtos, ofertas, propostas, demandas, claims } = useData()
  const [mescladosAgora, setMescladosAgora] = useState([])

  const pares = useMemo(() => {
    const ativos = produtos.items.filter((p) => p.situacao === 'Ativo')
    const encontrados = []
    for (let i = 0; i < ativos.length; i += 1) {
      for (let j = i + 1; j < ativos.length; j += 1) {
        const pontuacao = similaridade(ativos[i].nome, ativos[j].nome)
        if (pontuacao >= LIMIAR) {
          const [canonico, duplicado] = ativos[i].id < ativos[j].id ? [ativos[i], ativos[j]] : [ativos[j], ativos[i]]
          encontrados.push({ canonico, duplicado, pontuacao })
        }
      }
    }
    return encontrados.sort((a, b) => b.pontuacao - a.pontuacao)
  }, [produtos.items])

  function contarReferencias(produtoId) {
    const nOfertas = ofertas.items.filter((o) => o.produtoId === produtoId).length
    const nPropostas = propostas.items.filter((p) => p.itens.some((i) => i.produtoId === produtoId)).length
    const nDemandas = demandas.items.filter((d) => d.produtoId === produtoId).length
    const nClaims = claims.items.filter((c) => c.produtoId === produtoId).length
    return nOfertas + nPropostas + nDemandas + nClaims
  }

  function mesclar(canonico, duplicado) {
    if (
      !window.confirm(
        `Mesclar "${duplicado.nome}" em "${canonico.nome}"? Todas as ofertas, propostas, demandas e claims que referenciam "${duplicado.nome}" passam a referenciar "${canonico.nome}", e o produto duplicado é removido do catálogo.`,
      )
    )
      return

    ofertas.items
      .filter((o) => o.produtoId === duplicado.id)
      .forEach((o) => ofertas.editar(o.id, { produtoId: canonico.id }))

    propostas.items
      .filter((p) => p.itens.some((i) => i.produtoId === duplicado.id))
      .forEach((p) =>
        propostas.editar(p.id, {
          itens: p.itens.map((i) => (i.produtoId === duplicado.id ? { ...i, produtoId: canonico.id } : i)),
        }),
      )

    demandas.items.filter((d) => d.produtoId === duplicado.id).forEach((d) => demandas.editar(d.id, { produtoId: canonico.id }))
    claims.items.filter((c) => c.produtoId === duplicado.id).forEach((c) => claims.editar(c.id, { produtoId: canonico.id }))

    produtos.remover(duplicado.id)
    setMescladosAgora((atual) => [...atual, duplicado.id])
  }

  const paresPendentes = pares.filter((p) => !mescladosAgora.includes(p.duplicado.id))

  if (paresPendentes.length === 0) return null

  return (
    <div className="mb-4 rounded border border-ayamo-warning/25 bg-ayamo-warning/10 p-4">
      <h2 className="mb-3 text-sm font-semibold text-ayamo-text">
        {paresPendentes.length} possível(is) produto(s) duplicado(s) no catálogo
      </h2>
      <div className="flex flex-col gap-2">
        {paresPendentes.map(({ canonico, duplicado, pontuacao }) => (
          <div key={duplicado.id} className="flex items-center justify-between gap-3 rounded border border-ayamo-border bg-ayamo-surface p-2.5 text-sm">
            <div>
              <span className="text-ayamo-text-mut">&ldquo;{duplicado.nome}&rdquo;</span>
              <span className="mx-1 text-ayamo-text-mut">→ parece ser</span>
              <span className="font-medium text-ayamo-text">&ldquo;{canonico.nome}&rdquo;</span>
              <span className="ml-2 text-xs text-ayamo-text-mut">
                ({Math.round(pontuacao * 100)}% parecido · {contarReferencias(duplicado.id)} referência(s) a mesclar)
              </span>
            </div>
            <button
              type="button"
              onClick={() => mesclar(canonico, duplicado)}
              className="flex-shrink-0 rounded border border-ayamo-primary px-3 py-1.5 text-xs font-medium text-ayamo-primary hover:bg-ayamo-primary/10"
            >
              Mesclar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
