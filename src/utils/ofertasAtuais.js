export function obterOfertasAtuais(ofertasItems) {
  const ultimaPorBase = new Map()
  ofertasItems.forEach((o) => {
    const atual = ultimaPorBase.get(o.codigoBase)
    if (!atual || o.versao > atual.versao) ultimaPorBase.set(o.codigoBase, o)
  })
  return [...ultimaPorBase.values()].sort((a, b) => a.codigoBase.localeCompare(b.codigoBase))
}
