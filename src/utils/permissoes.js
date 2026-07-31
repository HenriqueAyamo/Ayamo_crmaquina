export const MOTIVOS = {
  negociarCompra: 'Apenas Comprador ou Administrador podem negociar com o fornecedor.',
  gerarVenda: 'Apenas Vendedor ou Administrador podem gerar uma venda a partir desta oferta.',
  gerenciarUsuarios: 'Apenas Administrador pode gerenciar usuários e papéis.',
  ultimoAdministrador: 'Precisa haver ao menos 1 Administrador ativo no sistema.',
  proprioUsuario: 'Você não pode remover ou inativar o próprio usuário.',
  excluirRegistro: 'Apenas Administrador pode excluir compras ou vendas.',
}

export function podeNegociarCompra(perfil) {
  return ['Comprador', 'Administrador'].includes(perfil)
}

export function podeGerarVenda(perfil) {
  return ['Vendedor', 'Administrador'].includes(perfil)
}

export function podeGerenciarUsuarios(perfil) {
  return perfil === 'Administrador'
}

export function podeExcluirRegistros(perfil) {
  return perfil === 'Administrador'
}
