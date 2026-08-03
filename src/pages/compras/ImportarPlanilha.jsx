import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { encontrarMelhorCorrespondencia } from '../../utils/produtoTexto.js'
import { lerLinhasExcel, valorPorAlias } from '../../utils/importarExcel.js'
import { formatarPreco } from '../../utils/formato.js'
import { extrairOfertaIA, arquivoParaBase64 } from '../../utils/iaImport.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'
import PreviewImportacao from '../../components/PreviewImportacao.jsx'
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
  const [textoIA, setTextoIA] = useState('')
  const [carregandoIA, setCarregandoIA] = useState(false)
  const [erroIA, setErroIA] = useState(null)

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

  // Recebe os campos já extraídos (de uma linha de planilha OU de uma oferta lida pela IA) e monta
  // a linha de preview — é o ponto em comum entre os dois jeitos de importar.
  function montarLinhaOferta(numeroLinha, bruto) {
    const hoje = new Date().toISOString().slice(0, 10)
    const produto = acharProduto(bruto.produtoNome)
    const fornecedor = acharFornecedor(bruto.fornecedorNome)
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

  function analisarLinhasExcel(linhas) {
    const linhasPreview = linhas.map((linha, index) =>
      montarLinhaOferta(index + 2, {
        ref: valorPorAlias(linha, ALIASES, 'ref'),
        produtoNome: valorPorAlias(linha, ALIASES, 'produto'),
        fornecedorNome: valorPorAlias(linha, ALIASES, 'fornecedor'),
        brand: valorPorAlias(linha, ALIASES, 'brand'),
        moeda: valorPorAlias(linha, ALIASES, 'moeda'),
        valor: valorPorAlias(linha, ALIASES, 'preco'),
        quantidade: valorPorAlias(linha, ALIASES, 'quantidade'),
        incoterm: valorPorAlias(linha, ALIASES, 'incoterm'),
        ...(({ de, ate }) => ({ embarqueDe: de, embarqueAte: ate }))(separarPeriodo(valorPorAlias(linha, ALIASES, 'embarque'))),
        destino: valorPorAlias(linha, ALIASES, 'destino'),
        validade: valorPorAlias(linha, ALIASES, 'validade'),
        prazoPagamento: valorPorAlias(linha, ALIASES, 'prazoPagamento'),
        traderNome: valorPorAlias(linha, ALIASES, 'trader'),
        comentarios: valorPorAlias(linha, ALIASES, 'comentarios'),
        data: valorPorAlias(linha, ALIASES, 'data'),
      }),
    )

    setResumoFinal(null)
    setPreview(linhasPreview)
  }

  function analisarOfertasIA(ofertasIA) {
    const linhasPreview = ofertasIA.map((o, index) =>
      montarLinhaOferta(index + 2, {
        ref: o.ref,
        produtoNome: o.produto,
        fornecedorNome: o.fornecedor,
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

  async function extrairComIA(imagemArquivo) {
    setCarregandoIA(true)
    setErroIA(null)
    try {
      const imagemBase64 = imagemArquivo ? await arquivoParaBase64(imagemArquivo) : undefined
      const { ofertas: ofertasExtraidas } = await extrairOfertaIA({
        texto: textoIA || undefined,
        imagemBase64,
        mimeType: imagemArquivo?.type,
        tipo: 'Importação de Compras (IA)',
        usuario: usuarioLogado.nome,
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
        onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(analisarLinhasExcel)}
        hint={
          <>
            Cabeçalhos aceitos (o modelo real de compras funciona direto): <strong>{COLUNAS_ACEITAS}</strong>. Produto e
            Fornecedor podem bater por nome parecido, não precisa ser idêntico.
          </>
        }
        mensagemResumo={resumoFinal && `${resumoFinal.importadas} de ${resumoFinal.total} linha(s) importadas com sucesso.`}
        erros={resumoFinal?.erros}
      />

      <SecaoRecolhivel titulo="Importar com IA (texto ou foto)" aberturaInicial={false}>
        <div className="flex flex-col gap-3 rounded border border-dashed border-ayamo-primary/40 bg-ayamo-primary/5 p-4">
          <p className="text-xs text-ayamo-text-mut">
            Cole o texto de uma oferta recebida (WhatsApp, e-mail) OU envie uma foto/print — a IA identifica os campos
            automaticamente. Nada é gravado até você conferir e confirmar, igual na importação por planilha.
          </p>
          <Field label="Texto da oferta (opcional se enviar imagem)">
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
              Selecionar imagem
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files[0]
                  e.target.value = ''
                  if (arquivo) extrairComIA(arquivo)
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
