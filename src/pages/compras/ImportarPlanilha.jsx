import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { useData } from '../../DataContext.jsx'
import { encontrarMelhorCorrespondencia } from '../../utils/produtoTexto.js'

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

function valorPorAlias(linha, chave) {
  const chavesLinha = Object.keys(linha)
  const alvo = chavesLinha.find((k) => ALIASES[chave].includes(k.trim().toLowerCase()))
  return alvo ? linha[alvo] : undefined
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
  const inputRef = useRef(null)
  const [resumo, setResumo] = useState(null)

  function acharProduto(nomeColuna) {
    const nome = nomeProdutoDaColuna(nomeColuna)
    const exato = produtos.items.find((p) => p.nome.toLowerCase() === nome.toLowerCase() || p.apelido.toLowerCase() === nome.toLowerCase())
    if (exato) return exato
    const aproximado = encontrarMelhorCorrespondencia(nome, produtos.items, (p) => p.nome, 0.6)
    return aproximado?.item ?? null
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

  function processarLinhas(linhas) {
    const jaImportadas = ofertas.items.filter((o) => o.codigo.startsWith('OF-IMP-')).length
    let importadas = 0
    const erros = []
    const hoje = new Date().toISOString().slice(0, 10)

    linhas.forEach((linha, index) => {
      const numeroLinha = index + 2
      const colunaProduto = valorPorAlias(linha, 'produto')
      const produto = acharProduto(colunaProduto)
      const fornecedor = acharFornecedor(valorPorAlias(linha, 'fornecedor'))
      const valor = primeiroNumero(valorPorAlias(linha, 'preco'))
      const quantidade = primeiroNumero(valorPorAlias(linha, 'quantidade'))
      const moeda = String(valorPorAlias(linha, 'moeda') ?? '')
        .trim()
        .toUpperCase()

      if (!produto) {
        erros.push(`Linha ${numeroLinha}: produto "${colunaProduto ?? ''}" não encontrado (nem por nome parecido) no cadastro`)
        return
      }
      if (!fornecedor) {
        erros.push(`Linha ${numeroLinha}: fornecedor "${valorPorAlias(linha, 'fornecedor') ?? ''}" não encontrado`)
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

      const { de: embarqueDe, ate: embarqueAte } = separarPeriodo(valorPorAlias(linha, 'embarque'))
      const trader = acharTrader(valorPorAlias(linha, 'trader'))
      const ref = valorPorAlias(linha, 'ref')
      const brand = valorPorAlias(linha, 'brand')
      const destino = valorPorAlias(linha, 'destino')
      const comentariosBrutos = [
        valorPorAlias(linha, 'comentarios'),
        destino ? `Destination: ${destino}` : null,
        brand && brand.toLowerCase() !== (fornecedor.marca ?? '').toLowerCase() ? `Brand: ${brand}` : null,
      ]
        .filter(Boolean)
        .join(' — ')

      const codigo = `OF-IMP-${jaImportadas + importadas + 1}`
      importadas += 1
      ofertas.criar({
        codigo,
        codigoBase: codigo,
        versao: 0,
        tipoRegistro: 'Position',
        produtoId: produto.id,
        fornecedorId: fornecedor.id,
        precoCusto: { valor, moeda: moeda || 'USD', unidade: 'ton' },
        quantidade,
        quantidadeOriginal: quantidade,
        unidade: 'ton',
        status: 'Disponível',
        data: paraDataISO(valorPorAlias(linha, 'data')) ?? hoje,
        usuarioId: trader.id,
        observacao: comentariosBrutos || 'Importado de planilha.',
        numeroContrato: ref ? String(ref) : '',
        incoterm: String(valorPorAlias(linha, 'incoterm') ?? 'CFR').trim().toUpperCase(),
        embarqueDe,
        embarqueAte,
        validadeAte: valorPorAlias(linha, 'validade') ?? '',
        prazoPagamento: valorPorAlias(linha, 'prazoPagamento') ?? '',
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
        Cabeçalhos aceitos (o modelo real de compras funciona direto): <strong>{COLUNAS_ACEITAS}</strong>. Produto e
        Fornecedor podem bater por nome parecido, não precisa ser idêntico.
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
