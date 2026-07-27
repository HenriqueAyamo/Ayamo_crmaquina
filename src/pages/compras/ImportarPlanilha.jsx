import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { useData } from '../../DataContext.jsx'

const COLUNAS_ESPERADAS = 'Produto, Fornecedor, Preço, Moeda, Unidade, Quantidade'

export default function ImportarPlanilha({ onImportado }) {
  const { ofertas, produtos, empresas, usuarioLogado } = useData()
  const inputRef = useRef(null)
  const [resumo, setResumo] = useState(null)

  function acharProduto(nome) {
    const alvo = String(nome ?? '').trim().toLowerCase()
    return produtos.items.find((p) => p.nome.toLowerCase() === alvo || p.apelido.toLowerCase() === alvo)
  }

  function acharFornecedor(nome) {
    const alvo = String(nome ?? '').trim().toLowerCase()
    return empresas.items.find((e) => e.tipo === 'Fornecedor' && e.nome.toLowerCase() === alvo)
  }

  function processarLinhas(linhas) {
    const jaImportadas = ofertas.items.filter((o) => o.codigo.startsWith('OF-IMP-')).length
    let importadas = 0
    const erros = []
    const hoje = new Date().toISOString().slice(0, 10)

    linhas.forEach((linha, index) => {
      const numeroLinha = index + 2
      const produto = acharProduto(linha.Produto)
      const fornecedor = acharFornecedor(linha.Fornecedor)
      const valor = Number(linha['Preço'] ?? linha.Preco)
      const quantidade = Number(linha.Quantidade)
      const moeda = String(linha.Moeda ?? '').trim().toUpperCase()
      const unidade = String(linha.Unidade ?? '').trim().toLowerCase()

      if (!produto) {
        erros.push(`Linha ${numeroLinha}: produto "${linha.Produto ?? ''}" não encontrado no cadastro`)
        return
      }
      if (!fornecedor) {
        erros.push(`Linha ${numeroLinha}: fornecedor "${linha.Fornecedor ?? ''}" não encontrado (deve ser uma empresa do tipo Fornecedor)`)
        return
      }
      if (!valor || Number.isNaN(valor)) {
        erros.push(`Linha ${numeroLinha}: preço inválido`)
        return
      }
      if (!quantidade || Number.isNaN(quantidade)) {
        erros.push(`Linha ${numeroLinha}: quantidade inválida`)
        return
      }

      const codigo = `OF-IMP-${jaImportadas + importadas + 1}`
      importadas += 1
      ofertas.criar({
        codigo,
        codigoBase: codigo,
        versao: 0,
        tipoRegistro: 'Position',
        produtoId: produto.id,
        fornecedorId: fornecedor.id,
        precoCusto: { valor, moeda, unidade },
        quantidade,
        quantidadeOriginal: quantidade,
        unidade,
        status: 'Disponível',
        data: hoje,
        usuarioId: usuarioLogado.id,
        observacao: 'Importado de planilha.',
        historicoNegociacao: [],
      })
    })

    setResumo({ total: linhas.length, importadas, erros })
    onImportado?.()
  }

  function processarArquivo(arquivo) {
    const leitor = new FileReader()
    leitor.onload = (evento) => {
      const pasta = XLSX.read(evento.target.result, { type: 'array' })
      const planilha = pasta.Sheets[pasta.SheetNames[0]]
      processarLinhas(XLSX.utils.sheet_to_json(planilha))
    }
    leitor.readAsArrayBuffer(arquivo)
  }

  return (
    <div className="rounded border border-dashed border-ayamo-border p-4">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          if (e.target.files[0]) processarArquivo(e.target.files[0])
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Selecionar planilha (.xlsx)
      </button>
      <p className="mt-2 text-xs text-ayamo-text-mut">
        A primeira linha deve ter os cabeçalhos: <strong>{COLUNAS_ESPERADAS}</strong>. Produto e Fornecedor precisam
        bater com o nome (ou apelido) já cadastrado no sistema.
      </p>

      {resumo && (
        <div className="mt-3 text-sm">
          <p className="text-ayamo-text">
            {resumo.importadas} de {resumo.total} linha(s) importadas com sucesso.
          </p>
          {resumo.erros.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-ayamo-danger">
              {resumo.erros.map((erro) => (
                <li key={erro}>{erro}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
