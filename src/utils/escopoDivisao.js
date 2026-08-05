// Regras de escopo por divisão.
//
// Decisão de modelo: empresas, contatos, fretes e categorias são GLOBAIS — o
// mesmo fornecedor atende várias divisões e duplicá-lo criaria cadastros
// concorrentes. O movimento (ofertas, propostas, demandas, claims) é DA DIVISÃO.
//
// A divisão fica gravada no próprio registro, não derivada de produto → família
// → divisão. Derivar significaria que mover um produto de família reescreveria a
// divisão de todo o histórico, e o dono de um dado não pode mudar por efeito
// colateral de um cadastro.

export const COLECOES_POR_DIVISAO = ['ofertas', 'propostas', 'demandas', 'claims']
export const COLECOES_GLOBAIS = ['empresas', 'contatos', 'fretes', 'categoriasContato', 'usuarios', 'dadosAyamo']

// Perfis transversais enxergam todas as divisões; os demais só as suas.
const PERFIS_TRANSVERSAIS = ['Administrador', 'Financeiro', 'Controladoria']

export function divisoesDoUsuario(usuario, divisoes) {
  const todas = divisoes.filter((d) => d.situacao === 'Ativo')
  if (!usuario) return []
  if (PERFIS_TRANSVERSAIS.includes(usuario.perfil)) return todas

  const ids = new Set((usuario.responsabilidades ?? []).map((r) => r.divisaoId))
  const minhas = todas.filter((d) => ids.has(d.id))

  // Sem responsabilidade cadastrada o usuário ficaria sem nenhum módulo e não
  // conseguiria usar o sistema. Enquanto o cadastro não é completado, libera
  // tudo — o aviso de cadastro incompleto é quem cobra o acerto.
  return minhas.length > 0 ? minhas : todas
}

export function podeVerDivisao(usuario, divisoes, divisaoId) {
  return divisoesDoUsuario(usuario, divisoes).some((d) => d.id === divisaoId)
}

// Filtro único usado por todas as telas. Registro sem divisão aparece para
// todos: é dado antigo, anterior ao carimbo, e esconder seria pior que mostrar.
export function filtrarPorDivisao(itens, divisaoAtivaId) {
  if (divisaoAtivaId == null) return itens
  return itens.filter((item) => item.divisaoId == null || item.divisaoId === divisaoAtivaId)
}
