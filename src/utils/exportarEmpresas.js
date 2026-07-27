export async function exportarEmpresasExcel(empresasLista) {
  const XLSX = await import('xlsx')

  const linhas = empresasLista.map((e) => ({
    Nome: e.nome,
    Tipo: e.tipo,
    País: e.pais,
    Endereço: e.endereco ?? '',
    CNPJ: e.cnpj ?? '',
    'SIF/SIPEAGRO': e.sif ?? '',
    Marca: e.marca ?? '',
    'Moeda padrão': e.moedaPadrao,
    Produtos: (e.produtosCapacidade ?? []).map((p) => `${p.nome} (${p.volumeMensal ?? 0} ${p.unidade ?? ''}/mês)`).join('; '),
    Situação: e.situacao,
  }))

  const planilha = XLSX.utils.json_to_sheet(linhas)
  const pasta = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(pasta, planilha, 'Empresas')
  XLSX.writeFile(pasta, `empresas_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
