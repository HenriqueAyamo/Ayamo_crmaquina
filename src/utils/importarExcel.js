import * as XLSX from 'xlsx'

// Le a primeira aba de um arquivo .xlsx/.xls e devolve as linhas como array de objetos
// (cabeçalho da planilha vira as chaves), pronto pra passar num loop de importação.
export function lerLinhasExcel(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = (evento) => {
      const pasta = XLSX.read(evento.target.result, { type: 'array' })
      const planilha = pasta.Sheets[pasta.SheetNames[0]]
      resolve(XLSX.utils.sheet_to_json(planilha))
    }
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsArrayBuffer(arquivo)
  })
}

// Busca o valor de uma linha da planilha por um conjunto de nomes de coluna possíveis (PT/EN),
// já que cada fornecedor de planilha nomeia a coluna de um jeito diferente.
export function valorPorAlias(linha, aliases, chave) {
  const chavesLinha = Object.keys(linha)
  const alvo = chavesLinha.find((k) => aliases[chave].includes(k.trim().toLowerCase()))
  return alvo ? linha[alvo] : undefined
}
