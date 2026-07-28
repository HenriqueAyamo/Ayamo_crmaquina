function maiorData(datas) {
  return datas.filter(Boolean).sort().at(-1) ?? null
}

export function ultimaInteracaoEmpresa(empresa, { ofertas, propostas }) {
  let ultimaData = null

  if (empresa.tipo === 'Fornecedor') {
    const registros = ofertas.items.filter((o) => o.fornecedorId === empresa.id)
    const datas = registros.flatMap((o) => [o.data, ...(o.historicoNegociacao ?? []).map((n) => n.data)])
    ultimaData = maiorData(datas)
  } else if (empresa.tipo === 'Cliente') {
    const registros = propostas.items.filter((p) => p.clienteId === empresa.id)
    const datas = registros.flatMap((p) => [p.dataEnvio, ...(p.historicoNegociacao ?? []).map((n) => n.data)])
    ultimaData = maiorData(datas)
  }

  if (!ultimaData) return { data: null, dias: null }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const data = new Date(ultimaData)
  data.setHours(0, 0, 0, 0)
  const dias = Math.round((hoje - data) / (1000 * 60 * 60 * 24))

  return { data: ultimaData, dias }
}

export function toneUltimaInteracao(dias) {
  if (dias == null) return 'neutral'
  if (dias <= 30) return 'success'
  if (dias <= 90) return 'warning'
  return 'danger'
}
