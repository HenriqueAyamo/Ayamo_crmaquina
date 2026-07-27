import { formatarPreco } from './formato.js'

const STATUS_ENCERRADOS_PROPOSTA = ['Aceita', 'Recusada', 'Expirada']

export function criarAcoesOferta({ ofertas, propostas, usuarioLogado }) {
  function ajustarEstoqueOferta(ofertaCodigo, delta) {
    const oferta = ofertas.items.find((o) => o.codigo === ofertaCodigo)
    if (!oferta) return
    const novaQuantidade = Math.max(0, oferta.quantidade + delta)
    const novoStatus =
      novaQuantidade === 0 ? 'Esgotada' : oferta.status === 'Esgotada' ? 'Disponível' : oferta.status
    ofertas.editar(oferta.id, { quantidade: novaQuantidade, status: novoStatus })
  }

  function registrarNotaOferta(ofertaAtual, dados) {
    const hoje = new Date().toISOString().slice(0, 10)
    ofertas.editar(ofertaAtual.id, {
      status: dados.novoStatus ?? ofertaAtual.status,
      historicoNegociacao: [
        ...(ofertaAtual.historicoNegociacao ?? []),
        { autor: 'Comprador', tipo: dados.tipo, data: hoje, observacao: dados.observacao },
      ],
    })
  }

  function alterarStatusOferta(ofertaAtual, novoStatus, observacao) {
    const hoje = new Date().toISOString().slice(0, 10)
    ofertas.editar(ofertaAtual.id, {
      status: novoStatus,
      historicoNegociacao: [
        ...(ofertaAtual.historicoNegociacao ?? []),
        {
          autor: 'Comprador',
          tipo: 'Status alterado',
          data: hoje,
          observacao: observacao || `Status alterado para "${novoStatus}".`,
        },
      ],
    })
  }

  function registrarRevisaoOferta(ofertaAtual, dados) {
    const novaOferta = ofertas.criar({
      codigo: `${ofertaAtual.codigoBase}-R${ofertaAtual.versao + 1}`,
      codigoBase: ofertaAtual.codigoBase,
      versao: ofertaAtual.versao + 1,
      tipoRegistro: dados.tipoRegistro ?? ofertaAtual.tipoRegistro ?? 'Position',
      produtoId: ofertaAtual.produtoId,
      fornecedorId: ofertaAtual.fornecedorId,
      precoCusto: { valor: dados.valor, moeda: dados.moeda, unidade: ofertaAtual.unidade },
      quantidade: dados.quantidade,
      quantidadeOriginal: dados.quantidade,
      unidade: ofertaAtual.unidade,
      status: dados.status,
      data: new Date().toISOString().slice(0, 10),
      usuarioId: usuarioLogado.id,
      observacao: dados.observacao,
      numeroContrato: dados.numeroContrato,
      incoterm: dados.incoterm,
      portoOrigem: dados.portoOrigem,
      prazoPagamento: dados.prazoPagamento,
      embarqueDe: dados.embarqueDe,
      embarqueAte: dados.embarqueAte,
      mfgSite: dados.mfgSite,
      validadeAte: dados.validadeAte,
      ayamoEntidadeId: dados.ayamoEntidadeId ? Number(dados.ayamoEntidadeId) : null,
      historicoNegociacao: [
        ...(ofertaAtual.historicoNegociacao ?? []),
        {
          autor: 'Comprador',
          tipo: 'Novo preço registrado com o fornecedor',
          data: new Date().toISOString().slice(0, 10),
          observacao: dados.observacao || `Preço atualizado para ${formatarPreco(dados.valor, dados.moeda, ofertaAtual.unidade)}.`,
        },
      ],
    })

    // Qualquer proposta de venda ainda aberta que dependa deste código de oferta
    // recebe o novo custo automaticamente e volta para o vendedor decidir (margem recalculada).
    propostas.items
      .filter(
        (p) => !STATUS_ENCERRADOS_PROPOSTA.includes(p.status) && p.itens.some((item) => item.ofertaCodigo === ofertaAtual.codigo),
      )
      .forEach((p) => {
        const novosItens = p.itens.map((item) =>
          item.ofertaCodigo === ofertaAtual.codigo
            ? { ...item, ofertaCodigo: novaOferta.codigo, precoCusto: { ...novaOferta.precoCusto } }
            : item,
        )
        propostas.editar(p.id, {
          status: 'Em negociação',
          itens: novosItens,
          historicoNegociacao: [
            ...p.historicoNegociacao,
            {
              rodada: p.historicoNegociacao.length + 1,
              autor: 'Comprador',
              tipo: 'Novo custo do fornecedor',
              preco: { ...novaOferta.precoCusto },
              quantidade: novosItens[0].quantidade,
              data: novaOferta.data,
              observacao: `Custo atualizado (${novaOferta.codigo}). Margem recalculada — aguardando decisão do vendedor.`,
            },
          ],
        })
      })

    return novaOferta
  }

  function avisarConcorrenciaEstoque(ofertaCodigo, propostaFechadaId) {
    const oferta = ofertas.items.find((o) => o.codigo === ofertaCodigo)
    if (!oferta) return
    const hoje = new Date().toISOString().slice(0, 10)

    propostas.items
      .filter(
        (p) =>
          p.id !== propostaFechadaId &&
          !STATUS_ENCERRADOS_PROPOSTA.includes(p.status) &&
          p.itens.some((item) => item.ofertaCodigo === ofertaCodigo && item.quantidade > oferta.quantidade),
      )
      .forEach((p) => {
        const item = p.itens.find((i) => i.ofertaCodigo === ofertaCodigo)
        propostas.editar(p.id, {
          historicoNegociacao: [
            ...p.historicoNegociacao,
            {
              rodada: p.historicoNegociacao.length + 1,
              autor: 'Sistema',
              tipo: 'Alerta de estoque',
              preco: item.precoVenda,
              quantidade: item.quantidade,
              data: hoje,
              observacao: `Uma proposta concorrente sobre a oferta ${ofertaCodigo} foi fechada e consumiu o estoque. Restam apenas ${oferta.quantidade.toLocaleString('pt-BR')} ${oferta.unidade} — esta proposta pede ${item.quantidade.toLocaleString('pt-BR')} ${item.unidade}. Confirme com o comprador antes de fechar.`,
            },
          ],
        })
      })
  }

  return { ajustarEstoqueOferta, registrarNotaOferta, alterarStatusOferta, registrarRevisaoOferta, avisarConcorrenciaEstoque }
}
