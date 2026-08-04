import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { acharProdutoPorNome, acharFornecedorPorNome } from '../../utils/matchCadastro.js'
import { lerLinhasExcel } from '../../utils/importarExcel.js'
import { formatarPreco } from '../../utils/formato.js'
import { extrairOfertaIA, arquivoParaBase64 } from '../../utils/iaImport.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'
import PreviewImportacao from '../../components/PreviewImportacao.jsx'
import MapeamentoColunas from '../../components/MapeamentoColunas.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import SecaoRecolhivel from '../../components/SecaoRecolhivel.jsx'

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

const CAMPOS_MAPEAVEIS = [
  { chave: 'produto', label: 'Produto', obrigatorio: true },
  { chave: 'fornecedor', label: 'Fornecedor', obrigatorio: true },
  { chave: 'preco', label: 'Preço', obrigatorio: true },
  { chave: 'quantidade', label: 'Quantidade', obrigatorio: true },
  { chave: 'moeda', label: 'Moeda', obrigatorio: false },
  { chave: 'incoterm', label: 'Incoterm', obrigatorio: false },
  { chave: 'ref', label: 'Referência', obrigatorio: false },
  { chave: 'brand', label: 'Marca', obrigatorio: false },
  { chave: 'embarque', label: 'Período de embarque', obrigatorio: false },
  { chave: 'destino', label: 'Destino', obrigatorio: false },
  { chave: 'validade', label: 'Validade da oferta', obrigatorio: false },
  { chave: 'prazoPagamento', label: 'Prazo de pagamento', obrigatorio: false },
  { chave: 'data', label: 'Data da oferta', obrigatorio: false },
  { chave: 'trader', label: 'Trader / Comprador', obrigatorio: false },
  { chave: 'comentarios', label: 'Comentários', obrigatorio: false },
]

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
  const [linhasBrutas, setLinhasBrutas] = useState(null)
  const [colunasDetectadas, setColunasDetectadas] = useState([])
  const [mapeamento, setMapeamento] = useState({})
  const [textoIA, setTextoIA] = useState('')
  const [carregandoIA, setCarregandoIA] = useState(false)
  const [erroIA, setErroIA] = useState(null)

  function acharProduto(nomeColuna) {
    return acharProdutoPorNome(nomeColuna, produtos.items)
  }

  function acharFornecedor(nome) {
    return acharFornecedorPorNome(nome, empresas.items.filter((e) => e.tipo === 'Fornecedor'))
  }

  function acharTrader(nome) {
    if (!nome) return usuarioLogado
    const alvo = String(nome).trim().toLowerCase()
    return usuarios.items.find((u) => u.nome.toLowerCase().includes(alvo) || alvo.includes(u.nome.toLowerCase())) ?? usuarioLogado
  }

  // Recebe os campos já extraídos (de uma linha de planilha OU de uma oferta lida pela IA) e monta
  // a linha de preview — é o ponto em comum entre os dois jeitos de importar.
  function montarLinhaOferta(numeroLinha, bruto) {
    const hoje = new Date().toISOString().slice(0, 10)
    // Se a IA já sugeriu um id do catálogo (com base no nome, mesmo que escrito diferente/outro
    // idioma), usa direto — só cai pro matching por texto se ela não tiver certeza.
    const produto =
      (bruto.produtoIdCatalogo != null ? produtos.items.find((p) => p.id === bruto.produtoIdCatalogo) : null) ??
      acharProduto(bruto.produtoNome)
    const fornecedor =
      (bruto.fornecedorIdCatalogo != null ? empresas.items.find((e) => e.id === bruto.fornecedorIdCatalogo) : null) ??
      acharFornecedor(bruto.fornecedorNome)
    const valor = primeiroNumero(bruto.valor)
    const quantidade = primeiroNumero(bruto.quantidade)
    const moeda = String(bruto.moeda ?? '').trim().toUpperCase()

    if (!produto) {
      return { numeroLinha, status: 'erro', mensagem: `Produto "${bruto.produtoNome ?? ''}" não encontrado (nem por nome parecido) no cadastro` }
    }
    if (!fornecedor) {
      return { numeroLinha, status: 'erro', mensagem: `Fornecedor "${bruto.fornecedorNome ?? ''}" não encontrado` }
    }
    if (!valor || Number.isNaN(valor)) {
      return { numeroLinha, status: 'erro', mensagem: 'Preço inválido' }
    }
    if (!quantidade || Number.isNaN(quantidade)) {
      return { numeroLinha, status: 'erro', mensagem: 'Quantidade inválida' }
    }

    const trader = acharTrader(bruto.traderNome)
    const comentariosBrutos = [
      bruto.comentarios,
      bruto.destino ? `Destination: ${bruto.destino}` : null,
      bruto.brand && bruto.brand.toLowerCase() !== (fornecedor.marca ?? '').toLowerCase() ? `Brand: ${bruto.brand}` : null,
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
      data: paraDataISO(bruto.data) ?? hoje,
      usuarioId: trader.id,
      observacao: comentariosBrutos || 'Importado de planilha.',
      numeroContrato: bruto.ref ? String(bruto.ref) : '',
      incoterm: String(bruto.incoterm ?? 'CFR').trim().toUpperCase(),
      embarqueDe: bruto.embarqueDe || '',
      embarqueAte: bruto.embarqueAte || '',
      validadeAte: bruto.validade ?? '',
      prazoPagamento: bruto.prazoPagamento ?? '',
      historicoNegociacao: [],
    }

    return {
      numeroLinha,
      status: 'ok',
      titulo: `${produto.nome} — ${fornecedor.nome}`,
      detalhe: `${formatarPreco(valor, moeda || 'USD', 'ton')} · ${quantidade.toLocaleString('pt-BR')} ton · Trader: ${trader.nome}`,
      campos: [
        { label: 'Ref.', valor: bruto.ref ? String(bruto.ref) : '' },
        { label: 'Incoterm', valor: dadosCriacao.incoterm },
        { label: 'Destino', valor: bruto.destino ?? '' },
        { label: 'Embarque', valor: `${dadosCriacao.embarqueDe || '—'} → ${dadosCriacao.embarqueAte || '—'}` },
        { label: 'Validade da oferta', valor: dadosCriacao.validadeAte },
        { label: 'Prazo de pagamento', valor: dadosCriacao.prazoPagamento },
        { label: 'Marca', valor: bruto.brand ?? '' },
        { label: 'Observação', valor: dadosCriacao.observacao },
      ],
      dadosCriacao,
    }
  }

  function iniciarMapeamento(linhas) {
    setResumoFinal(null)
    if (linhas.length === 0) {
      setResumoFinal({ total: 0, importadas: 0, erros: ['A planilha não tem nenhuma linha de dados.'] })
      return
    }
    const colunas = Object.keys(linhas[0])
    const sugestao = {}
    CAMPOS_MAPEAVEIS.forEach(({ chave }) => {
      const aliasesCampo = ALIASES[chave] ?? []
      sugestao[chave] = colunas.find((c) => aliasesCampo.includes(c.trim().toLowerCase())) ?? ''
    })
    setColunasDetectadas(colunas)
    setMapeamento(sugestao)
    setLinhasBrutas(linhas)
  }

  function aplicarMapeamento() {
    const linhasPreview = linhasBrutas.map((linha, index) => {
      const valorDaColuna = (chave) => (mapeamento[chave] ? linha[mapeamento[chave]] : undefined)
      const { de: embarqueDe, ate: embarqueAte } = separarPeriodo(valorDaColuna('embarque'))
      return montarLinhaOferta(index + 2, {
        ref: valorDaColuna('ref'),
        produtoNome: valorDaColuna('produto'),
        fornecedorNome: valorDaColuna('fornecedor'),
        brand: valorDaColuna('brand'),
        moeda: valorDaColuna('moeda'),
        valor: valorDaColuna('preco'),
        quantidade: valorDaColuna('quantidade'),
        incoterm: valorDaColuna('incoterm'),
        embarqueDe,
        embarqueAte,
        destino: valorDaColuna('destino'),
        validade: valorDaColuna('validade'),
        prazoPagamento: valorDaColuna('prazoPagamento'),
        traderNome: valorDaColuna('trader'),
        comentarios: valorDaColuna('comentarios'),
        data: valorDaColuna('data'),
      })
    })

    setLinhasBrutas(null)
    setPreview(linhasPreview)
  }

  function analisarOfertasIA(ofertasIA) {
    const linhasPreview = ofertasIA.map((o, index) =>
      montarLinhaOferta(index + 2, {
        ref: o.ref,
        produtoNome: o.produto,
        produtoIdCatalogo: o.produtoIdCatalogo,
        fornecedorNome: o.fornecedor,
        fornecedorIdCatalogo: o.fornecedorIdCatalogo,
        brand: o.brand,
        moeda: o.moeda,
        valor: o.preco,
        quantidade: o.quantidade,
        incoterm: o.incoterm,
        embarqueDe: o.embarqueDe,
        embarqueAte: o.embarqueAte,
        destino: o.destino,
        validade: o.validadeOferta,
        prazoPagamento: o.prazoPagamento,
        traderNome: o.trader,
        comentarios: o.comentarios,
        data: null,
      }),
    )

    setResumoFinal(null)
    setPreview(linhasPreview)
  }

  function ehExcel(arquivo) {
    return /\.(xlsx|xls)$/i.test(arquivo.name)
  }

  async function selecionarArquivoIA(arquivo) {
    if (ehExcel(arquivo)) {
      lerLinhasExcel(arquivo).then(iniciarMapeamento)
      return
    }
    extrairComIA(arquivo)
  }

  async function extrairComIA(arquivo) {
    setCarregandoIA(true)
    setErroIA(null)
    try {
      const arquivoBase64 = arquivo ? await arquivoParaBase64(arquivo) : undefined
      const { ofertas: ofertasExtraidas } = await extrairOfertaIA({
        texto: textoIA || undefined,
        arquivoBase64,
        mimeType: arquivo?.type,
        nomeArquivo: arquivo?.name,
        tipo: 'Importação de Compras (IA)',
        produtosCatalogo: produtos.items.map((p) => ({ id: p.id, nome: p.nome, apelido: p.apelido })),
        fornecedoresCatalogo: empresas.items.filter((e) => e.tipo === 'Fornecedor').map((e) => ({ id: e.id, nome: e.nome })),
      })
      if (ofertasExtraidas.length === 0) {
        setErroIA('A IA não identificou nenhuma oferta nesse conteúdo.')
        return
      }
      analisarOfertasIA(ofertasExtraidas)
      setTextoIA('')
    } catch (erro) {
      setErroIA(erro.message)
    } finally {
      setCarregandoIA(false)
    }
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
    <div className="flex flex-col gap-3">
      <UploadPlanilha
        onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(iniciarMapeamento)}
        hint={
          <>
            Cabeçalhos aceitos (o modelo real de compras funciona direto): <strong>{COLUNAS_ACEITAS}</strong>. Se a sua
            planilha usar outros nomes de coluna, tudo bem — o próximo passo deixa você confirmar o mapeamento.
          </>
        }
        mensagemResumo={resumoFinal && `${resumoFinal.importadas} de ${resumoFinal.total} linha(s) importadas com sucesso.`}
        erros={resumoFinal?.erros}
      />

      {linhasBrutas && (
        <MapeamentoColunas
          campos={CAMPOS_MAPEAVEIS}
          colunasDetectadas={colunasDetectadas}
          mapeamento={mapeamento}
          onMudarCampo={(chave, coluna) => setMapeamento((atual) => ({ ...atual, [chave]: coluna }))}
          totalLinhas={linhasBrutas.length}
          onCancelar={() => setLinhasBrutas(null)}
          onContinuar={aplicarMapeamento}
        />
      )}

      <SecaoRecolhivel titulo="Importar com IA (texto, foto, PDF ou planilha)" aberturaInicial={false}>
        <div className="flex flex-col gap-3 rounded border border-dashed border-ayamo-primary/40 bg-ayamo-primary/5 p-4">
          <p className="text-xs text-ayamo-text-mut">
            Cole o texto de uma oferta recebida (WhatsApp, e-mail), envie uma foto/print/PDF (contrato, PO, proforma)
            OU uma planilha — o sistema identifica sozinho o que fazer com cada tipo. Nada é gravado até você
            conferir e confirmar.
          </p>
          <Field label="Texto da oferta (opcional se enviar arquivo)">
            <textarea
              className={inputClass}
              rows={4}
              placeholder="Cole aqui o texto recebido do fornecedor/trader..."
              value={textoIA}
              onChange={(e) => setTextoIA(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text hover:bg-ayamo-bg">
              Selecionar imagem, PDF ou planilha
              <input
                type="file"
                accept="image/*,application/pdf,.pdf,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files[0]
                  e.target.value = ''
                  if (arquivo) selecionarArquivoIA(arquivo)
                }}
              />
            </label>
            <button
              type="button"
              disabled={!textoIA.trim() || carregandoIA}
              onClick={() => extrairComIA(null)}
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {carregandoIA ? 'Extraindo...' : 'Extrair texto com IA'}
            </button>
          </div>
          {erroIA && <p className="text-sm text-ayamo-danger">{erroIA}</p>}
        </div>
      </SecaoRecolhivel>

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
