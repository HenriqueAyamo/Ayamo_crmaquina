export function saudacaoComercial(contatosDaEmpresa, categoriasContato) {
  const categoriasEspeciais = categoriasContato.filter((c) => c.especial).map((c) => c.id)
  const nomes = contatosDaEmpresa
    .filter((c) => c.categoriasIds.some((id) => categoriasEspeciais.includes(id)))
    .map((c) => c.nome.trim().split(' ')[0])

  if (nomes.length === 0) return 'Dear Team'
  if (nomes.length === 1) return `Dear ${nomes[0]}`
  if (nomes.length === 2) return `Dear ${nomes[0]} and ${nomes[1]}`
  return `Dear ${nomes.slice(0, -1).join(', ')} and ${nomes[nomes.length - 1]}`
}
