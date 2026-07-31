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
  responsavel: ['responsavel', 'responsável', 'account manager', 'responsavel ayamo', 'trader responsavel'],
  contato: ['contato', 'nome do contato', 'contact', 'contact name', 'contact person'],
  contatoCargo: ['cargo do contato', 'contact title', 'cargo contato'],
  telefone: ['telefone', 'telefone do contato', 'phone', 'contact phone'],
  email: ['email', 'e-mail', 'email do contato', 'contact email'],
}

export default function ImportarPlanilhaEmpresas({ onImportado }) {
  const { empresas, usuarios, contatos } = useData()
  const [resumo, setResumo] = useState(null)

  function acharEmpresa(nome) {
    const exato = empresas.items.find((e) => e.nome.trim().toLowerCase() === nome.toLowerCase())
    if (exato) return exato
    const aproximado = encontrarMelhorCorrespondencia(nome, empresas.items, (e) => e.nome, 0.6)
    return aproximado?.item ?? null
  }

  function acharResponsavel(nome) {
    const ativos = usuarios.items.filter((u) => u.situacao === 'Ativo')
    const exato = ativos.find((u) => u.nome.trim().toLowerCase() === nome.toLowerCase())
    if (exato) return exato
    const aproximado = encontrarMelhorCorrespondencia(nome, ativos, (u) => u.nome, 0.6)
    return aproximado?.item ?? null
  }

  function processarLinhas(linhas) {
    let criadas = 0
    let atualizadas = 0
    let responsaveisVinculados = 0
    let responsaveisNaoEncontrados = 0
    let contatosCriados = 0
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

      const responsavelNome = String(valorPorAlias(linha, ALIASES, 'responsavel') ?? '').trim()
      let responsavelId = null
      if (responsavelNome) {
        const responsavel = acharResponsavel(responsavelNome)
        if (responsavel) {
          responsavelId = responsavel.id
          responsaveisVinculados += 1
        } else {
          responsaveisNaoEncontrados += 1
        }
      }

      const existente = acharEmpresa(nome)
      let empresaId

      if (existente) {
        const dados = {
          pais: existente.pais || valorPorAlias(linha, ALIASES, 'pais') || existente.pais,
          endereco: existente.endereco || valorPorAlias(linha, ALIASES, 'endereco') || existente.endereco,
          cnpj: existente.cnpj || valorPorAlias(linha, ALIASES, 'cnpj') || existente.cnpj,
          sif: existente.sif || valorPorAlias(linha, ALIASES, 'sif') || existente.sif,
          marca: existente.marca || valorPorAlias(linha, ALIASES, 'marca') || existente.marca,
          responsavelAyamoId: existente.responsavelAyamoId || responsavelId,
        }
        if (novoProduto && !(existente.produtosCapacidade ?? []).some((p) => p.nome.toLowerCase() === novoProduto.nome.toLowerCase())) {
          dados.produtosCapacidade = [...(existente.produtosCapacidade ?? []), novoProduto]
        }
        empresas.editar(existente.id, dados)
        empresaId = existente.id
        atualizadas += 1
      } else {
        const nova = empresas.criar({
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
          responsavelAyamoId: responsavelId,
          limiteCredito: 0,
          creditoUtilizado: 0,
          situacao: 'Ativo',
          produtosCapacidade: novoProduto ? [novoProduto] : [],
          qualificacoesPaises: {},
        })
        empresaId = nova.id
        criadas += 1
      }

      const contatoNome = String(valorPorAlias(linha, ALIASES, 'contato') ?? '').trim()
      if (contatoNome) {
        const jaExiste = contatos.items.some(
          (c) => c.empresaId === empresaId && c.nome.trim().toLowerCase() === contatoNome.toLowerCase(),
        )
        if (!jaExiste) {
          contatos.criar({
            nome: contatoNome,
            cargo: String(valorPorAlias(linha, ALIASES, 'contatoCargo') ?? '').trim(),
            telefone: String(valorPorAlias(linha, ALIASES, 'telefone') ?? '').trim(),
            email: String(valorPorAlias(linha, ALIASES, 'email') ?? '').trim(),
            empresaId,
            categoriasIds: [],
          })
          contatosCriados += 1
        }
      }
    })

    setResumo({ total: linhas.length, criadas, atualizadas, responsaveisVinculados, responsaveisNaoEncontrados, contatosCriados, erros })
    onImportado?.()
  }

  return (
    <UploadPlanilha
      onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(processarLinhas)}
      hint="Cabeçalhos aceitos (PT ou EN): Nome/Supplier, País/Country, Endereço, CNPJ, SIF, Marca/Brand, Moeda/Currency,
        Produto/Product, Volume Mensal/Volume, Unidade/Unit, Responsável/Account Manager (nome do usuário Ayamo — bate por
        nome igual ou parecido), Contato/Contact Name, Cargo do contato, Telefone, E-mail. Empresa existente é encontrada
        por nome igual ou parecido e atualizada só nos campos em branco; um produto novo é adicionado à lista de
        capacidade; um contato novo é adicionado à empresa."
      mensagemResumo={
        resumo &&
        `${resumo.criadas} criada(s), ${resumo.atualizadas} atualizada(s) de ${resumo.total} linha(s).` +
          (resumo.responsaveisVinculados > 0 ? ` ${resumo.responsaveisVinculados} responsável(is) vinculado(s).` : '') +
          (resumo.responsaveisNaoEncontrados > 0 ? ` ${resumo.responsaveisNaoEncontrados} responsável(is) não reconhecido(s).` : '') +
          (resumo.contatosCriados > 0 ? ` ${resumo.contatosCriados} contato(s) adicionado(s).` : '')
      }
      erros={resumo?.erros}
    />
  )
}
