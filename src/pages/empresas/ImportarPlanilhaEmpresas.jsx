import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { useData } from '../../DataContext.jsx'

const ALIASES = {
  nome: ['nome', 'fornecedor', 'supplier', 'producer', 'empresa', 'company'],
  pais: ['pais', 'país', 'country'],
  endereco: ['endereco', 'endereço', 'address'],
  cnpj: ['cnpj'],
  sif: ['sif', 'sipeagro', 'sif/sipeagro'],
  marca: ['marca', 'brand'],
  moeda: ['moeda', 'currency', 'moeda padrao', 'moeda padrão'],
  produto: ['produto', 'product'],
  volume: ['volume mensal', 'volume', 'monthly volume'],
  unidade: ['unidade', 'unit'],
}

function valorPorAlias(linha, chave) {
  const chavesLinha = Object.keys(linha)
  const alvo = chavesLinha.find((k) => ALIASES[chave].includes(k.trim().toLowerCase()))
  return alvo ? linha[alvo] : undefined
}

export default function ImportarPlanilhaEmpresas({ onImportado }) {
  const { empresas } = useData()
  const inputRef = useRef(null)
  const [resumo, setResumo] = useState(null)

  function processarLinhas(linhas) {
    let criadas = 0
    let atualizadas = 0
    const erros = []

    linhas.forEach((linha, index) => {
      const numeroLinha = index + 2
      const nome = String(valorPorAlias(linha, 'nome') ?? '').trim()
      if (!nome) {
        erros.push(`Linha ${numeroLinha}: nome/fornecedor em branco`)
        return
      }

      const produtoNome = valorPorAlias(linha, 'produto')
      const novoProduto = produtoNome
        ? {
            nome: String(produtoNome).trim(),
            volumeMensal: Number(valorPorAlias(linha, 'volume') ?? 0),
            unidade: String(valorPorAlias(linha, 'unidade') ?? 'ton').trim(),
          }
        : null

      const existente = empresas.items.find((e) => e.nome.trim().toLowerCase() === nome.toLowerCase())

      if (existente) {
        const dados = {
          pais: existente.pais || valorPorAlias(linha, 'pais') || existente.pais,
          endereco: existente.endereco || valorPorAlias(linha, 'endereco') || existente.endereco,
          cnpj: existente.cnpj || valorPorAlias(linha, 'cnpj') || existente.cnpj,
          sif: existente.sif || valorPorAlias(linha, 'sif') || existente.sif,
          marca: existente.marca || valorPorAlias(linha, 'marca') || existente.marca,
        }
        if (novoProduto && !(existente.produtosCapacidade ?? []).some((p) => p.nome.toLowerCase() === novoProduto.nome.toLowerCase())) {
          dados.produtosCapacidade = [...(existente.produtosCapacidade ?? []), novoProduto]
        }
        empresas.editar(existente.id, dados)
        atualizadas += 1
      } else {
        empresas.criar({
          nome,
          tipo: 'Fornecedor',
          pais: String(valorPorAlias(linha, 'pais') ?? '').trim(),
          endereco: String(valorPorAlias(linha, 'endereco') ?? '').trim(),
          cnpj: String(valorPorAlias(linha, 'cnpj') ?? '').trim(),
          sif: String(valorPorAlias(linha, 'sif') ?? '').trim(),
          marca: String(valorPorAlias(linha, 'marca') ?? '').trim(),
          moedaPadrao: String(valorPorAlias(linha, 'moeda') ?? 'USD')
            .trim()
            .toUpperCase(),
          limiteCredito: 0,
          creditoUtilizado: 0,
          situacao: 'Ativo',
          produtosCapacidade: novoProduto ? [novoProduto] : [],
          qualificacoesPaises: {},
        })
        criadas += 1
      }
    })

    setResumo({ total: linhas.length, criadas, atualizadas, erros })
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
        Cabeçalhos aceitos (PT ou EN): Nome/Supplier, País/Country, Endereço, CNPJ, SIF, Marca/Brand, Moeda/Currency,
        Produto/Product, Volume Mensal/Volume, Unidade/Unit. Fornecedor existente (mesmo nome) é atualizado só nos
        campos em branco; um produto novo é adicionado à lista de capacidade.
      </p>

      {resumo && (
        <div className="mt-3 text-sm">
          <p className="text-ayamo-text">
            {resumo.criadas} criada(s), {resumo.atualizadas} atualizada(s) de {resumo.total} linha(s).
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
