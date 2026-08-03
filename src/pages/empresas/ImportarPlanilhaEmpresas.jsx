import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { encontrarMelhorCorrespondencia } from '../../utils/produtoTexto.js'
import { lerLinhasExcel, valorPorAlias } from '../../utils/importarExcel.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'
import PreviewImportacao from '../../components/PreviewImportacao.jsx'

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
  const [preview, setPreview] = useState(null)
  const [resumoFinal, setResumoFinal] = useState(null)

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

  function analisarLinhas(linhas) {
    const linhasPreview = linhas.map((linha, index) => {
      const numeroLinha = index + 2
      const nome = String(valorPorAlias(linha, ALIASES, 'nome') ?? '').trim()
      if (!nome) {
        return { numeroLinha, status: 'erro', mensagem: 'Nome/fornecedor em branco' }
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
      const responsavel = responsavelNome ? acharResponsavel(responsavelNome) : null

      const contatoNome = String(valorPorAlias(linha, ALIASES, 'contato') ?? '').trim()
      const contatoNovo = contatoNome
        ? {
            nome: contatoNome,
            cargo: String(valorPorAlias(linha, ALIASES, 'contatoCargo') ?? '').trim(),
            telefone: String(valorPorAlias(linha, ALIASES, 'telefone') ?? '').trim(),
            email: String(valorPorAlias(linha, ALIASES, 'email') ?? '').trim(),
          }
        : null

      const existente = acharEmpresa(nome)
      const detalhes = []
      detalhes.push(existente ? 'Atualiza empresa existente' : 'Nova empresa')
      if (existente?.pais || valorPorAlias(linha, ALIASES, 'pais')) detalhes.push(String(existente?.pais || valorPorAlias(linha, ALIASES, 'pais')))
      if (responsavelNome) detalhes.push(responsavel ? `Responsável: ${responsavel.nome}` : `Responsável "${responsavelNome}" não reconhecido`)
      if (novoProduto) detalhes.push(`+ produto: ${novoProduto.nome}`)
      if (contatoNovo) detalhes.push(`+ contato: ${contatoNovo.nome}`)

      return {
        numeroLinha,
        status: 'ok',
        titulo: nome,
        detalhe: detalhes.join(' · '),
        dadosAcao: { nome, existente, novoProduto, responsavelId: responsavel?.id ?? null, contatoNovo, linha },
      }
    })

    setResumoFinal(null)
    setPreview(linhasPreview)
  }

  function confirmarImportacao() {
    let criadas = 0
    let atualizadas = 0
    let responsaveisVinculados = 0
    let contatosCriados = 0
    const erros = []

    preview.forEach((linhaPreview) => {
      if (linhaPreview.status !== 'ok') {
        erros.push(`Linha ${linhaPreview.numeroLinha}: ${linhaPreview.mensagem}`)
        return
      }
      const { nome, existente, novoProduto, responsavelId, contatoNovo, linha } = linhaPreview.dadosAcao
      let empresaId

      if (responsavelId) responsaveisVinculados += 1

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

      if (contatoNovo) {
        const jaExiste = contatos.items.some(
          (c) => c.empresaId === empresaId && c.nome.trim().toLowerCase() === contatoNovo.nome.toLowerCase(),
        )
        if (!jaExiste) {
          contatos.criar({ ...contatoNovo, empresaId, categoriasIds: [] })
          contatosCriados += 1
        }
      }
    })

    setResumoFinal({ total: preview.length, criadas, atualizadas, responsaveisVinculados, contatosCriados, erros })
    setPreview(null)
    onImportado?.()
  }

  const validas = preview?.filter((l) => l.status === 'ok').length ?? 0

  return (
    <div>
      <UploadPlanilha
        onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(analisarLinhas)}
        hint="Cabeçalhos aceitos (PT ou EN): Nome/Supplier, País/Country, Endereço, CNPJ, SIF, Marca/Brand, Moeda/Currency,
          Produto/Product, Volume Mensal/Volume, Unidade/Unit, Responsável/Account Manager (nome do usuário Ayamo — bate por
          nome igual ou parecido), Contato/Contact Name, Cargo do contato, Telefone, E-mail. Empresa existente é encontrada
          por nome igual ou parecido e atualizada só nos campos em branco; um produto novo é adicionado à lista de
          capacidade; um contato novo é adicionado à empresa."
        mensagemResumo={
          resumoFinal &&
          `${resumoFinal.criadas} criada(s), ${resumoFinal.atualizadas} atualizada(s) de ${resumoFinal.total} linha(s).` +
            (resumoFinal.responsaveisVinculados > 0 ? ` ${resumoFinal.responsaveisVinculados} responsável(is) vinculado(s).` : '') +
            (resumoFinal.contatosCriados > 0 ? ` ${resumoFinal.contatosCriados} contato(s) adicionado(s).` : '')
        }
        erros={resumoFinal?.erros}
      />

      {preview && (
        <PreviewImportacao
          linhas={preview}
          validas={validas}
          onConfirmar={confirmarImportacao}
          onCancelar={() => setPreview(null)}
          labelConfirmar="Confirmar importação"
        />
      )}
    </div>
  )
}
