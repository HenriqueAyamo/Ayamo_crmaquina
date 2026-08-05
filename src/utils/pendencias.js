import { diasAte, ehFollowUpAberto } from './followups.js'
import { empresaIncompleta, faltandoNaEmpresa, faltandoNoProduto, produtoIncompleto } from './cadastroPendente.js'

// Cadastros criados pela importação ficam só com o nome. Sem isso aqui, o aviso
// só apareceria para quem abrisse a lista de Empresas ou Cadastros por acaso.
function pendenciasDeCadastro(ctx) {
  const { empresas, produtos } = ctx
  if (!empresas || !produtos) return []
  const pendencias = []

  empresas.items
    .filter((e) => e.situacao === 'Ativo' && empresaIncompleta(e))
    .forEach((e) => {
      const faltando = faltandoNaEmpresa(e)
      pendencias.push({
        tipo: 'cadastro',
        id: `empresa-${e.id}`,
        empresaId: e.id,
        titulo: e.nome,
        descricao: `Cadastro de ${(e.tipo ?? 'empresa').toLowerCase()} incompleto${faltando.length > 0 ? ` — falta: ${faltando.join(', ')}` : ' — criado pela importação'}`,
        data: new Date().toISOString().slice(0, 10),
      })
    })

  produtos.items
    .filter((p) => p.situacao === 'Ativo' && produtoIncompleto(p))
    .forEach((p) => {
      const faltando = faltandoNoProduto(p)
      pendencias.push({
        tipo: 'cadastro',
        id: `produto-${p.id}`,
        titulo: p.nome,
        descricao: `Cadastro de produto incompleto${faltando.length > 0 ? ` — falta: ${faltando.join(', ')}` : ' — criado pela importação'}`,
        data: new Date().toISOString().slice(0, 10),
      })
    })

  return pendencias
}

// Uma pendência pode apontar para uma oferta, uma proposta ou um follow-up (que herda o
// destino do registro de origem, ou cai na empresa quando não veio de compra/venda).
export function linkDaPendencia(item) {
  if (item.tipo === 'cadastro') return item.empresaId ? `/empresas/${item.empresaId}` : '/cadastros'
  if (item.tipo === 'oferta') return `/compras/${item.id}`
  if (item.tipo === 'proposta') return `/vendas/${item.id}`
  if (item.refTipo === 'oferta' && item.refId) return `/compras/${item.refId}`
  if (item.refTipo === 'proposta' && item.refId) return `/vendas/${item.refId}`
  return `/empresas/${item.empresaId}`
}

// Follow-up vencido ou vencendo hoje vira pendência de quem é responsável.
// Vale para qualquer perfil — inclusive Administrador, que antes não tinha nenhuma pendência.
function pendenciasDeFollowUp(usuario, ctx, { todos = false } = {}) {
  const { interacoes, getEmpresa, getUsuario } = ctx
  if (!interacoes) return []

  return interacoes.items
    .filter(ehFollowUpAberto)
    .filter((i) => todos || i.followUpResponsavelId === usuario.id)
    .filter((i) => diasAte(i.followUpEm) <= 0)
    .map((i) => {
      const dias = diasAte(i.followUpEm)
      const empresa = getEmpresa(i.empresaId)?.nome ?? ''
      const responsavel = todos ? ` (resp. ${getUsuario(i.followUpResponsavelId)?.nome ?? '—'})` : ''
      return {
        tipo: 'followup',
        id: i.id,
        empresaId: i.empresaId,
        refTipo: i.refTipo,
        refId: i.refId,
        titulo: i.refId || empresa,
        descricao:
          dias === 0
            ? `Follow-up para hoje — ${empresa}: ${i.observacao}${responsavel}`
            : `Follow-up vencido há ${Math.abs(dias)} dia(s) — ${empresa}: ${i.observacao}${responsavel}`,
        data: i.followUpEm,
      }
    })
}

function pendenciasVendedor(usuario, ctx, { todos = false } = {}) {
  const { propostas, getEmpresa, getUsuario } = ctx
  return propostas.items
    .filter((p) => todos || p.vendedorId === usuario.id)
    .flatMap((p) => {
      const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
      const precisaAgir = p.status === 'Rascunho' || (p.status === 'Em negociação' && ultima?.autor === 'Cliente')
      if (!precisaAgir) return []
      const dono = todos ? ` (vendedor ${getUsuario(p.vendedorId)?.nome ?? '—'})` : ''
      return [
        {
          tipo: 'proposta',
          id: p.numero,
          titulo: p.numero,
          descricao:
            (p.status === 'Rascunho'
              ? 'Rascunho aguardando envio ao cliente'
              : `Cliente enviou contraproposta — ${getEmpresa(p.clienteId)?.nome ?? ''}`) + dono,
          data: ultima?.data ?? p.dataEnvio,
        },
      ]
    })
}

function pendenciasComprador(usuario, ctx, { todos = false } = {}) {
  const { ofertas, propostas, getEmpresa, getUsuario, getProduto, getDivisaoIdDeProduto } = ctx
  const pendencias = []
  const divisoesResp = (usuario.responsabilidades ?? []).map((r) => r.divisaoId)

  propostas.items.forEach((p) => {
    const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
    if (ultima?.tipo !== 'Escalar para comprador') return
    const item = p.itens[0]
    const divisaoItem = getDivisaoIdDeProduto(item.produtoId)
    if (!todos && !divisoesResp.includes(divisaoItem)) return

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
    .filter((o) => (todos || o.usuarioId === usuario.id) && o.status === 'Em revisão')
    .forEach((o) => {
      pendencias.push({
        tipo: 'oferta',
        id: o.codigoBase,
        titulo: o.codigo,
        descricao: `Oferta em revisão — ${getProduto(o.produtoId)?.nome ?? ''}${
          todos ? ` (${getEmpresa(o.fornecedorId)?.nome ?? ''})` : ''
        }`,
        data: o.data,
      })
    })

  return pendencias
}

function pendenciasFinanceiro(ctx) {
  const { propostas, getEmpresa, getUsuario } = ctx
  return propostas.items
    .filter((p) => p.status === 'Aguardando aprovação financeira')
    .map((p) => {
      const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
      return {
        tipo: 'proposta',
        id: p.numero,
        titulo: p.numero,
        descricao: `Aprovação de crédito pendente — ${getEmpresa(p.clienteId)?.nome ?? ''} (vendedor ${getUsuario(p.vendedorId)?.nome ?? ''})`,
        data: ultima?.data ?? p.dataEnvio,
      }
    })
}

function pendenciasDiretor(usuario, ctx, { todos = false } = {}) {
  const { propostas, getUsuario, getDivisaoIdDeProduto } = ctx
  return propostas.items
    .filter((p) => p.status === 'Aguardando aprovação')
    .flatMap((p) => {
      const vendedor = getUsuario(p.vendedorId)
      const divisaoItem = getDivisaoIdDeProduto(p.itens[0].produtoId)
      const souEuOAprovador = (vendedor?.responsabilidades ?? []).some(
        (r) => r.divisaoId === divisaoItem && r.diretorId === usuario.id,
      )
      if (!todos && !souEuOAprovador) return []
      const ultima = p.historicoNegociacao[p.historicoNegociacao.length - 1]
      return [
        {
          tipo: 'proposta',
          id: p.numero,
          titulo: p.numero,
          descricao: `Aprovação de margem solicitada por ${vendedor?.nome ?? ''}`,
          data: ultima?.data ?? p.dataEnvio,
        },
      ]
    })
}

export function calcularPendencias(usuario, ctx) {
  if (!usuario) return []
  const pendencias = []

  if (usuario.perfil === 'Vendedor') pendencias.push(...pendenciasVendedor(usuario, ctx))
  if (usuario.perfil === 'Comprador') {
    pendencias.push(...pendenciasComprador(usuario, ctx), ...pendenciasDeCadastro(ctx))
  }
  if (usuario.perfil === 'Financeiro') pendencias.push(...pendenciasFinanceiro(ctx))
  if (usuario.perfil === 'Diretor') pendencias.push(...pendenciasDiretor(usuario, ctx))

  // O Administrador enxerga tudo que está parado no sistema, de todos os perfis — antes ele
  // era o único perfil sem nenhuma regra e via sempre "nada pendente".
  if (usuario.perfil === 'Administrador') {
    pendencias.push(
      ...pendenciasVendedor(usuario, ctx, { todos: true }),
      ...pendenciasComprador(usuario, ctx, { todos: true }),
      ...pendenciasFinanceiro(ctx),
      ...pendenciasDiretor(usuario, ctx, { todos: true }),
      ...pendenciasDeFollowUp(usuario, ctx, { todos: true }),
      ...pendenciasDeCadastro(ctx),
    )
  } else {
    pendencias.push(...pendenciasDeFollowUp(usuario, ctx))
  }

  // Remove duplicatas (o admin agrega várias fontes que podem apontar pro mesmo registro).
  const vistos = new Set()
  return pendencias
    .filter((p) => {
      const chave = `${p.tipo}-${p.id}-${p.descricao}`
      if (vistos.has(chave)) return false
      vistos.add(chave)
      return true
    })
    .sort((a, b) => (a.data < b.data ? 1 : -1))
}
