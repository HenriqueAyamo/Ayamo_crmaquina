// Cadastros criados automaticamente pela importação nascem só com o nome.
// Em vez de confiar apenas na marca gravada no registro, conferimos os campos
// de verdade — assim o aviso some sozinho quando alguém termina de preencher,
// e aparece também em cadastros antigos que ficaram pela metade.

const CAMPOS_EMPRESA = [
  { chave: 'pais', rotulo: 'País' },
  { chave: 'moedaPadrao', rotulo: 'Moeda padrão' },
  { chave: 'responsavelAyamoId', rotulo: 'Responsável Ayamo' },
]

const CAMPOS_PRODUTO = [
  { chave: 'familiaId', rotulo: 'Família' },
  { chave: 'embalagem', rotulo: 'Embalagem' },
]

function vazio(valor) {
  return valor == null || valor === '' || valor === 0
}

export function faltandoNaEmpresa(empresa) {
  if (!empresa) return []
  const faltando = CAMPOS_EMPRESA.filter((c) => vazio(empresa[c.chave])).map((c) => c.rotulo)
  // Limite de crédito só faz sentido cobrar de cliente — fornecedor não compra da gente.
  if (empresa.tipo === 'Cliente' && vazio(empresa.limiteCredito)) faltando.push('Limite de crédito')
  return faltando
}

export function faltandoNoProduto(produto) {
  if (!produto) return []
  const faltando = CAMPOS_PRODUTO.filter((c) => vazio(produto[c.chave])).map((c) => c.rotulo)
  // Apelido igual ao nome é o que a importação gera quando não tem nada melhor.
  if (produto.apelido && produto.nome && produto.apelido.trim() === produto.nome.trim()) {
    faltando.push('Apelido (está igual ao nome)')
  }
  return faltando
}

// Só chama de "incompleto" o que foi criado pela importação ou o que perdeu
// campo essencial — não queremos poluir a tela com cadastros legados aceitáveis.
export function empresaIncompleta(empresa) {
  return Boolean(empresa?.revisarCadastro) || faltandoNaEmpresa(empresa).length > 0
}

export function produtoIncompleto(produto) {
  return Boolean(produto?.revisarCadastro) || faltandoNoProduto(produto).length > 0
}

export function resumoFaltando(faltando) {
  if (faltando.length === 0) return 'Cadastro criado pela importação — confira os dados.'
  return `Falta preencher: ${faltando.join(', ')}.`
}
