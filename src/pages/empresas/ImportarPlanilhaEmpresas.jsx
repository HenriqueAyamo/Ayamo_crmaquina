import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { encontrarMelhorCorrespondencia } from '../../utils/produtoTexto.js'
import { lerLinhasExcel, valorPorAlias } from '../../utils/importarExcel.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'

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

export default function ImportarPlanilhaEmpresas({ onImportado }) {
  const { empresas } = useData()
  const [resumo, setResumo] = useState(null)

  function acharEmpresa(nome) {
    const exato = empresas.items.find((e) => e.nome.trim().toLowerCase() === nome.toLowerCase())
    if (exato) return exato
    const aproximado = encontrarMelhorCorrespondencia(nome, empresas.items, (e) => e.nome, 0.6)
    return aproximado?.item ?? null
  }

  function processarLinhas(linhas) {
    let criadas = 0
    let atualizadas = 0
    const erros = []

    linhas.forEach((linha, index) => {
      const numeroLinha = index + 2
      const nome = String(valorPorAlias(linha, ALIASES, 'nome') ?? '').trim()
      if (!nome) {
        erros.push(`Linha ${numeroLinha}: nome/fornecedor em branco`)
        return
      }

      const produtoNome = valorPorAlias(linha, ALIASES, 'produto')
      const novoProduto = produtoNome
        ? {
            nome: String(produtoNome).trim(),
            volumeMensal: Number(valorPorAlias(linha, ALIASES, 'volume') ?? 0),
            unidade: String(valorPorAlias(linha, ALIASES, 'unidade') ?? 'ton').trim(),
          }
        : null

      const existente = acharEmpresa(nome)

      if (existente) {
        const dados = {
          pais: existente.pais || valorPorAlias(linha, ALIASES, 'pais') || existente.pais,
          endereco: existente.endereco || valorPorAlias(linha, ALIASES, 'endereco') || existente.endereco,
          cnpj: existente.cnpj || valorPorAlias(linha, ALIASES, 'cnpj') || existente.cnpj,
          sif: existente.sif || valorPorAlias(linha, ALIASES, 'sif') || existente.sif,
          marca: existente.marca || valorPorAlias(linha, ALIASES, 'marca') || existente.marca,
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
          pais: String(valorPorAlias(linha, ALIASES, 'pais') ?? '').trim(),
          endereco: String(valorPorAlias(linha, ALIASES, 'endereco') ?? '').trim(),
          cnpj: String(valorPorAlias(linha, ALIASES, 'cnpj') ?? '').trim(),
          sif: String(valorPorAlias(linha, ALIASES, 'sif') ?? '').trim(),
          marca: String(valorPorAlias(linha, ALIASES, 'marca') ?? '').trim(),
          moedaPadrao: String(valorPorAlias(linha, ALIASES, 'moeda') ?? 'USD')
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

  return (
    <UploadPlanilha
      onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(processarLinhas)}
      hint="Cabeçalhos aceitos (PT ou EN): Nome/Supplier, País/Country, Endereço, CNPJ, SIF, Marca/Brand, Moeda/Currency,
        Produto/Product, Volume Mensal/Volume, Unidade/Unit. Empresa existente é encontrada por nome igual ou parecido
        e atualizada só nos campos em branco; um produto novo é adicionado à lista de capacidade."
      mensagemResumo={resumo && `${resumo.criadas} criada(s), ${resumo.atualizadas} atualizada(s) de ${resumo.total} linha(s).`}
      erros={resumo?.erros}
    />
  )
}
