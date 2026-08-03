import { obterOfertasAtuais } from './ofertasAtuais.js'

const DIAS_LIMITE_OFERTA_PARADA = 7

function diasDesde(dataISO) {
  return Math.floor((Date.now() - new Date(dataISO).getTime()) / (1000 * 60 * 60 * 24))
}

// Ofertas de compra "Disponível" com estoque, sem nenhuma proposta de venda vinculada, há mais de
// DIAS_LIMITE_OFERTA_PARADA dias — candidatas a virar uma demanda "achar cliente para isso".
export function sugerirDemandasOfertaParada({ ofertas, propostas, demandas, ignoradas }) {
  const codigosComProposta = new Set(propostas.items.flatMap((p) => p.itens.map((i) => i.ofertaCodigo)))
  const codigosJaSugeridos = new Set(
    demandas.items.filter((d) => d.origemAutomatica === 'oferta_parada').map((d) => d.ofertaCodigo),
  )

  return obterOfertasAtuais(ofertas.items)
    .filter((o) => (o.tipoRegistro ?? 'Position') === 'Position')
    .filter((o) => o.status === 'Disponível' && o.quantidade > 0)
    .filter((o) => !codigosComProposta.has(o.codigo) && !codigosComProposta.has(o.codigoBase))
    .filter((o) => !codigosJaSugeridos.has(o.codigoBase))
    .filter((o) => !ignoradas.includes(o.codigoBase))
    .map((o) => ({ oferta: o, diasParada: diasDesde(o.data) }))
    .filter((s) => s.diasParada >= DIAS_LIMITE_OFERTA_PARADA)
    .sort((a, b) => b.diasParada - a.diasParada)
}
