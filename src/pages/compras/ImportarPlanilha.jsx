import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { encontrarMelhorCorrespondencia } from '../../utils/produtoTexto.js'
import { lerLinhasExcel, valorPorAlias } from '../../utils/importarExcel.js'
import { formatarPreco } from '../../utils/formato.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'
import PreviewImportacao from '../../components/PreviewImportacao.jsx'

const COLUNAS_ACEITAS =
  'Ref., Product - Packing (ou Produto), Supplier (ou Fornecedor), Brand, Currency, Price, Volume FCL (ou Quantidade), Incoterm, Shipment Period, Destination, Offer Validity, Payment Term, Offer date, Purchase Trader, Comments'

const ALIASES = {
  ref: ['ref.', 'ref', 'reference'],
  produto: ['produto', 'product', 'product - packing', 'product-packing'],
  fornecedor: ['fornecedor', 'supplier'],
  brand: ['brand', 'marca'],
  moeda: ['moeda', 'currency'],
  preco: ['preço', 'preco', 'price'],
  quantidade: ['quantidade', 'volume fcl', 'volume', 'qty'],
  incoterm: ['incoterm'],
  embarque: ['shipment period', 'embarque'],
  destino: ['destination', 'destino'],
  validade: ['offer validity', 'validade'],
  prazoPagamento: ['payment term', 'prazo de pagamento', 'prazo pagamento'],
  data: ['offer date', 'data'],
  trader: ['purchase trader', 'trader', 'comprador'],
  comentarios: ['comments', 'comentarios', 'comentários', 'business', 'market'],
}

function nomeProdutoDaColuna(bruto) {
  // "Product - Packing" às vezes vem como "Fish Meal 60% - Bulk" — separa só o nome do produto.
  return String(bruto ?? '').split(' - ')[0].trim()
}

function primeiroNumero(bruto) {
  const texto = String(bruto ?? '').replace(',', '.')
  const match = texto.match(/[\d.]+/)
  return match ? Number(match[0]) : NaN
}

function separarPeriodo(bruto) {
  const texto = String(bruto ?? '').trim()
  if (!texto) return { de: '', ate: '' }
  const partes = texto.split(/\s+to\s+|\s+-\s+|–/i)
  if (partes.length === 2) return { de: partes[0].trim(), ate: partes[1].trim() }
  return { de: texto, ate: '' }
}

function paraDataISO(bruto) {
  if (bruto == null || bruto === '') return null
  if (bruto instanceof Date) return bruto.toISOString().slice(0, 10)
  const texto = String(bruto).trim()
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(texto)
  if (match) {
    const [, dia, mes, ano] = match
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  }
  const data = new Date(texto)
  return Number.isNaN(data.getTime()) ? null : data.toISOString().slice(0, 10)
}

export default function ImportarPlanilha({ onImportado }) {
  const { ofertas, produtos, empresas, usuarios, usuarioLogado } = useData()
  const [preview, setPreview] = useState(null)
  const [resumoFinal, setResumoFinal] = useState(null)

  function acharProduto(nomeColuna) {
    const nome = nomeProdutoDaColuna(nomeColuna)
    const exato = produtos.items.find((p) => p.nome.toLowerCase() === nome.toLowerCase() || p.apelido.toLowerCase() === nome.toLowerCase())
    if (exato) return exato
    // Compara por nome completo E por apelido/sigla (ex.: "Chicken MDM") — a oferta às vezes vem só com a sigla.
    const porNome = encontrarMelhorCorrespondencia(nome, produtos.items, (p) => p.nome, 0.6)
    const porApelido = encontrarMelhorCorrespondencia(nome, produtos.items, (p) => p.apelido, 0.6)
    const melhor = [porNome, porApelido].filter(Boolean).sort((a, b) => b.pontuacao - a.pontuacao)[0]
    return melhor?.item ?? null
  }

  function acharFornecedor(nome) {
    const alvo = String(nome ?? '').trim()
    const fornecedoresAtivos = empresas.items.filter((e) => e.tipo === 'Fornecedor')
    const exato = fornecedoresAtivos.find((e) => e.nome.toLowerCase() === alvo.toLowerCase())
    if (exato) return exato
    const aproximado = encontrarMelhorCorrespondencia(alvo, fornecedoresAtivos, (e) => e.nome, 0.6)
    return aproximado?.item ?? null
  }

  function acharTrader(nome) {
    if (!nome) return usuarioLogado
    const alvo = String(nome).trim().toLowerCase()
    return usuarios.items.find((u) => u.nome.toLowerCase().includes(alvo) || alvo.includes(u.nome.toLowerCase())) ?? usuarioLogado
  }

  function analisarLinhas(linhas) {
    const hoje = new Date().toISOString().slice(0, 10)

    const linhasPreview = linhas.map((linha, index) => {
      const numeroLinha = index + 2
      const colunaProduto = valorPorAlias(linha, ALIASES, 'produto')
      const produto = acharProduto(colunaProduto)
      const fornecedor = acharFornecedor(valorPorAlias(linha, ALIASES, 'fornecedor'))
      const valor = primeiroNumero(valorPorAlias(linha, ALIASES, 'preco'))
      const quantidade = primeiroNumero(valorPorAlias(linha, ALIASES, 'quantidade'))
      const moeda = String(valorPorAlias(linha, ALIASES, 'moeda') ?? '')
        .trim()
        .toUpperCase()

      if (!produto) {
        return { numeroLinha, status: 'erro', mensagem: `Produto "${colunaProduto ?? ''}" não encontrado (nem por nome parecido) no cadastro` }
      }
      if (!fornecedor) {
        return {
          numeroLinha,
          status: 'erro',
          mensagem: `Fornecedor "${valorPorAlias(linha, ALIASES, 'fornecedor') ?? ''}" não encontrado`,
        }
      }
      if (!valor || Number.isNaN(valor)) {
        return { numeroLinha, status: 'erro', mensagem: 'Preço inválido' }
      }
      if (!quantidade || Number.isNaN(quantidade)) {
        return { numeroLinha, status: 'erro', mensagem: 'Quantidade inválida' }
      }

      const { de: embarqueDe, ate: embarqueAte } = separarPeriodo(valorPorAlias(linha, ALIASES, 'embarque'))
      const trader = acharTrader(valorPorAlias(linha, ALIASES, 'trader'))
      const ref = valorPorAlias(linha, ALIASES, 'ref')
      const brand = valorPorAlias(linha, ALIASES, 'brand')
      const destino = valorPorAlias(linha, ALIASES, 'destino')
      const comentariosBrutos = [
        valorPorAlias(linha, ALIASES, 'comentarios'),
        destino ? `Destination: ${destino}` : null,
        brand && brand.toLowerCase() !== (fornecedor.marca ?? '').toLowerCase() ? `Brand: ${brand}` : null,
      ]
        .filter(Boolean)
        .join(' — ')

      const dadosCriacao = {
        tipoRegistro: 'Position',
        produtoId: produto.id,
        fornecedorId: fornecedor.id,
        precoCusto: { valor, moeda: moeda || 'USD', unidade: 'ton' },
        quantidade,
        quantidadeOriginal: quantidade,
        unidade: 'ton',
        status: 'Disponível',
        data: paraDataISO(valorPorAlias(linha, ALIASES, 'data')) ?? hoje,
        usuarioId: trader.id,
        observacao: comentariosBrutos || 'Importado de planilha.',
        numeroContrato: ref ? String(ref) : '',
        incoterm: String(valorPorAlias(linha, ALIASES, 'incoterm') ?? 'CFR').trim().toUpperCase(),
        embarqueDe,
        embarqueAte,
        validadeAte: valorPorAlias(linha, ALIASES, 'validade') ?? '',
        prazoPagamento: valorPorAlias(linha, ALIASES, 'prazoPagamento') ?? '',
        historicoNegociacao: [],
      }

      return {
        numeroLinha,
        status: 'ok',
        titulo: `${produto.nome} — ${fornecedor.nome}`,
        detalhe: `${formatarPreco(valor, moeda || 'USD', 'ton')} · ${quantidade.toLocaleString('pt-BR')} ton · Trader: ${trader.nome}`,
        dadosCriacao,
      }
    })

    setResumoFinal(null)
    setPreview(linhasPreview)
  }

  function confirmarImportacao() {
    const jaImportadas = ofertas.items.filter((o) => o.codigo.startsWith('OF-IMP-')).length
    let importadas = 0
    const erros = []

    preview.forEach((linha) => {
      if (linha.status !== 'ok') {
        erros.push(`Linha ${linha.numeroLinha}: ${linha.mensagem}`)
        return
      }
      const codigo = `OF-IMP-${jaImportadas + importadas + 1}`
      importadas += 1
      ofertas.criar({ codigo, codigoBase: codigo, versao: 0, ...linha.dadosCriacao })
    })

    setResumoFinal({ total: preview.length, importadas, erros })
    setPreview(null)
    onImportado?.()
  }

  const validas = preview?.filter((l) => l.status === 'ok').length ?? 0

  return (
    <div>
      <UploadPlanilha
        onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(analisarLinhas)}
        hint={
          <>
            Cabeçalhos aceitos (o modelo real de compras funciona direto): <strong>{COLUNAS_ACEITAS}</strong>. Produto e
            Fornecedor podem bater por nome parecido, não precisa ser idêntico.
          </>
        }
        mensagemResumo={resumoFinal && `${resumoFinal.importadas} de ${resumoFinal.total} linha(s) importadas com sucesso.`}
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
