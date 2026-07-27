export function calcularPendencias(usuario, ctx) {
  const { ofertas, propostas, getEmpresa, getUsuario, getProduto, getDivisaoIdDeProduto } = ctx
  if (!usuario) return []
  const pendencias = []

  if (usuario.perfil === 'Vendedor') {
    propostas.items
      .filter((p) => p.vendedorId === usuario.id)
      .forEach((p) => {
        const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
        const precisaAgir = p.status === 'Rascunho' || (p.status === 'Em negociação' && ultima?.autor === 'Cliente')
        if (!precisaAgir) return
        pendencias.push({
          tipo: 'proposta',
          id: p.numero,
          titulo: p.numero,
          descricao:
            p.status === 'Rascunho'
              ? 'Rascunho aguardando envio ao cliente'
              : `Cliente enviou contraproposta — ${getEmpresa(p.clienteId)?.nome ?? ''}`,
          data: ultima?.data ?? p.dataEnvio,
        })
      })
  }

  if (usuario.perfil === 'Comprador') {
    const divisoesResp = usuario.responsabilidades.map((r) => r.divisaoId)

    propostas.items.forEach((p) => {
      const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
      if (ultima?.tipo !== 'Escalar para comprador') return
      const item = p.itens[0]
      const divisaoItem = getDivisaoIdDeProduto(item.produtoId)
      if (!divisoesResp.includes(divisaoItem)) return

      const ofertaVinculada = ofertas.items.find((o) => o.codigo === item.ofertaCodigo)
      const produtoNome = getProduto(item.produtoId)?.nome ?? ''
      const custoAtual = `${item.precoCusto.valor.toLocaleString('pt-BR')} ${item.precoCusto.moeda}/${item.precoCusto.unidade}`
      const precoCliente = `${item.precoVenda.valor.toLocaleString('pt-BR')} ${item.precoVenda.moeda}/${item.precoVenda.unidade}`
      const margemMinimaTexto =
        (p.margemMinimaTipo ?? 'percentual') === 'valor' ? `US$ ${p.margemMinima}/ton` : `${p.margemMinima}%`

      pendencias.push({
        tipo: 'oferta',
        id: ofertaVinculada?.codigoBase ?? item.ofertaCodigo,
        titulo: ofertaVinculada?.codigoBase ?? item.ofertaCodigo,
        descricao: `${produtoNome} · qtd. ${item.quantidade.toLocaleString('pt-BR')} ${item.unidade} · custo atual ${custoAtual} · cliente topa ${precoCliente} · margem mínima ${margemMinimaTexto} (proposta ${p.numero}, vendedor ${getUsuario(p.vendedorId)?.nome ?? ''})`,
        data: ultima.data,
      })
    })

    ofertas.items
      .filter((o) => o.usuarioId === usuario.id && o.status === 'Em revisão')
      .forEach((o) => {
        pendencias.push({
          tipo: 'oferta',
          id: o.codigoBase,
          titulo: o.codigo,
          descricao: `Oferta em revisão — ${getProduto(o.produtoId)?.nome ?? ''}`,
          data: o.data,
        })
      })
  }

  if (usuario.perfil === 'Financeiro') {
    propostas.items
      .filter((p) => p.status === 'Aguardando aprovação financeira')
      .forEach((p) => {
        const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
        pendencias.push({
          tipo: 'proposta',
          id: p.numero,
          titulo: p.numero,
          descricao: `Aprovação de crédito pendente — ${getEmpresa(p.clienteId)?.nome ?? ''} (vendedor ${getUsuario(p.vendedorId)?.nome ?? ''})`,
          data: ultima?.data ?? p.dataEnvio,
        })
      })
  }

  if (usuario.perfil === 'Diretor') {
    propostas.items
      .filter((p) => p.status === 'Aguardando aprovação')
      .forEach((p) => {
        const vendedor = getUsuario(p.vendedorId)
        const divisaoItem = getDivisaoIdDeProduto(p.itens[0].produtoId)
        const souEuOAprovador = vendedor?.responsabilidades.some(
          (r) => r.divisaoId === divisaoItem && r.diretorId === usuario.id,
        )
        if (!souEuOAprovador) return
        const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
        pendencias.push({
          tipo: 'proposta',
          id: p.numero,
          titulo: p.numero,
          descricao: `Aprovação de margem solicitada por ${vendedor?.nome ?? ''}`,
          data: ultima?.data ?? p.dataEnvio,
        })
      })
  }

  return pendencias.sort((a, b) => (a.data < b.data ? 1 : -1))
}
