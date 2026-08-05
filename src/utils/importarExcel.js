import * as XLSX from 'xlsx'

// Le a primeira aba de um arquivo .xlsx/.xls e devolve as linhas como array de objetos
// (cabeçalho da planilha vira as chaves), pronto pra passar num loop de importação.
export function lerLinhasExcel(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = (evento) => {
      const pasta = XLSX.read(evento.target.result, { type: 'array' })
      const planilha = pasta.Sheets[pasta.SheetNames[0]]
      // defval: '' é essencial. Sem ele o sheet_to_json omite a chave quando a
      // célula está vazia, e cada linha vira um objeto com um conjunto diferente
      // de colunas — o que fazia colunas inteiras sumirem da detecção.
      resolve(XLSX.utils.sheet_to_json(planilha, { defval: '' }))
    }
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsArrayBuffer(arquivo)
  })
}

// Todas as colunas que aparecem em qualquer linha, na ordem em que surgem.
// Olhar só a primeira linha perdia qualquer coluna vazia justamente ali.
export function colunasDaPlanilha(linhas) {
  const vistas = []
  linhas.forEach((linha) => {
    Object.keys(linha).forEach((coluna) => {
      if (!vistas.includes(coluna)) vistas.push(coluna)
    })
  })
  return vistas
}

// Busca o valor de uma linha da planilha por um conjunto de nomes de coluna possíveis (PT/EN),
// já que cada fornecedor de planilha nomeia a coluna de um jeito diferente.
export function valorPorAlias(linha, aliases, chave) {
  const chavesLinha = Object.keys(linha)
  const alvo = chavesLinha.find((k) => aliases[chave].includes(k.trim().toLowerCase()))
  return alvo ? linha[alvo] : undefined
}
