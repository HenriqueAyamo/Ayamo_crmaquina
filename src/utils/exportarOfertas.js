export async function exportarOfertasExcel(ofertasLista, { getProduto, getEmpresa }) {
  const XLSX = await import('xlsx')

  const linhas = ofertasLista.map((o) => ({
    Código: o.codigo,
    Produto: getProduto(o.produtoId)?.nome ?? '',
    Fornecedor: getEmpresa(o.fornecedorId)?.nome ?? '',
    Preço: o.precoCusto.valor,
    Moeda: o.precoCusto.moeda,
    'Quantidade original': o.quantidadeOriginal ?? o.quantidade,
    'Quantidade restante': o.quantidade,
    Unidade: o.unidade,
    Incoterm: o.incoterm ?? '',
    'Site de fabricação': o.mfgSite ?? '',
    'Válida até': o.validadeAte ?? '',
    Status: o.status,
    Data: o.data,
  }))

  const planilha = XLSX.utils.json_to_sheet(linhas)
  const pasta = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(pasta, planilha, 'Ofertas')
  XLSX.writeFile(pasta, `ofertas_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
