import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { useDivisao } from '../../divisoes/DivisaoContext.jsx'
import { acharProdutoPorNome, acharFornecedorPorNome } from '../../utils/matchCadastro.js'
import { lerLinhasExcel, colunasDaPlanilha } from '../../utils/importarExcel.js'
import { formatarPreco } from '../../utils/formato.js'
import { extrairOfertaIA, arquivoParaBase64 } from '../../utils/iaImport.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'
import PreviewImportacao from '../../components/PreviewImportacao.jsx'
import MapeamentoColunas from '../../components/MapeamentoColunas.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import SecaoRecolhivel from '../../components/SecaoRecolhivel.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

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
  // Aliases no plural e nas variações que aparecem nas planilhas reais — a de
  // compras usa "Shipment" e "Payment Terms", que antes não casavam com nada.
  embarque: ['shipment period', 'shipment', 'shipment month', 'embarque', 'periodo de embarque', 'período de embarque'],
  destino: ['destination', 'destino'],
  validade: ['offer validity', 'validity', 'validade', 'validade da oferta'],
  prazoPagamento: ['payment terms', 'payment term', 'payment', 'prazo de pagamento', 'prazo pagamento'],
  data: ['offer date', 'date', 'data', 'data da oferta'],
  trader: ['purchase trader', 'trader', 'comprador'],
  familia: ['business', 'familia', 'família', 'categoria'],
  comentarios: ['comments', 'comentarios', 'comentários', 'market'],
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
  { chave: 'familia', label: 'Família / Business', obrigatorio: false },
  { chave: 'comentarios', label: 'Comentários', obrigatorio: false },
]

// Números vindos de planilha chegam como número (ótimo) ou como texto em formato
// imprevisível: "USD 2.100", "2,100", "1.234,50". Tratar o ponto sempre como
// decimal transformava 2.100 em 2,1 — erro de mil vezes no preço.
function primeiroNumero(bruto) {
  if (typeof bruto === 'number') return bruto
  const texto = String(bruto ?? '').trim()
  if (!texto) return NaN

  const match = texto.match(/[\d.,]+/)
  if (!match) return NaN
  let numero = match[0]

  const temPonto = numero.includes('.')
  const temVirgula = numero.includes(',')

  if (temPonto && temVirgula) {
    // O separador decimal é o que aparece por último: "1.234,50" vs "1,234.50".
    const decimal = numero.lastIndexOf(',') > numero.lastIndexOf('.') ? ',' : '.'
    const milhar = decimal === ',' ? '.' : ','
    numero = numero.split(milhar).join('').replace(decimal, '.')
  } else if (temPonto || temVirgula) {
    const sep = temPonto ? '.' : ','
    const partes = numero.split(sep)
    // Grupos de exatamente 3 dígitos depois do separador = milhar ("2.100").
    const ehMilhar = partes.length > 1 && partes.slice(1).every((p) => p.length === 3)
    numero = ehMilhar ? partes.join('') : numero.replace(sep, '.')
  }

  const valor = Number(numero)
  return Number.isNaN(valor) ? NaN : valor
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
  const { t } = useI18n()
  const { ofertas, produtos, empresas, familias, usuarios, usuarioLogado, getDivisaoIdDeProduto } = useData()
  const { divisaoAtiva } = useDivisao()
  const [preview, setPreview] = useState(null)
  const [resumoFinal, setResumoFinal] = useState(null)
  const [linhasBrutas, setLinhasBrutas] = useState(null)
  const [colunasDetectadas, setColunasDetectadas] = useState([])
  const [mapeamento, setMapeamento] = useState({})
  const [textoIA, setTextoIA] = useState('')
  const [carregandoIA, setCarregandoIA] = useState(false)
  const [erroIA, setErroIA] = useState(null)
  // Cadastrar na hora o que não existe. Fica desligado por padrão: ligar cria
  // registros de verdade no sistema, e isso precisa ser uma escolha explícita.
  const [cadastrarFaltantes, setCadastrarFaltantes] = useState(false)

  // O matching só considera produtos do módulo aberto. Sem isso, importar no
  // módulo Seafood poderia vincular um produto de Meat e o registro nasceria na
  // divisão errada.
  const produtosDaDivisao = produtos.items.filter(
    (p) => !divisaoAtiva || getDivisaoIdDeProduto(p.id) === divisaoAtiva.id,
  )

  function acharProduto(nomeColuna) {
    return acharProdutoPorNome(nomeColuna, produtosDaDivisao)
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

    // Todos os problemas da linha de uma vez. Antes só o primeiro era mostrado,
    // então corrigir um revelava o seguinte e a importação virava tentativa e erro.
    const problemas = []

    // Nome vazio nunca dá para resolver sozinho — não há o que cadastrar.
    const nomeProduto = String(bruto.produtoNome ?? '').trim()
    const nomeFornecedor = String(bruto.fornecedorNome ?? '').trim()
    const aCriar = []

    if (!produto) {
      if (!nomeProduto) {
        problemas.push('Produto vazio nesta linha — confira se a coluna certa está mapeada em "Produto"')
      } else if (cadastrarFaltantes) {
        aCriar.push({ tipo: 'produto', nome: nomeProduto, familia: bruto.familia })
      } else {
        problemas.push(`Produto "${nomeProduto}" não encontrado no cadastro (nem por nome parecido)`)
      }
    }
    if (!fornecedor) {
      if (!nomeFornecedor) {
        problemas.push('Fornecedor vazio nesta linha — confira o mapeamento da coluna')
      } else if (cadastrarFaltantes) {
        aCriar.push({ tipo: 'fornecedor', nome: nomeFornecedor })
      } else {
        problemas.push(`Fornecedor "${nomeFornecedor}" não está cadastrado`)
      }
    }
    if (!valor || Number.isNaN(valor)) {
      problemas.push(`Preço inválido${bruto.valor ? ` (lido: "${bruto.valor}")` : ' — coluna vazia ou não mapeada'}`)
    }
    if (!quantidade || Number.isNaN(quantidade)) {
      problemas.push(
        `Quantidade inválida${bruto.quantidade ? ` (lido: "${bruto.quantidade}")` : ' — coluna vazia ou não mapeada'}`,
      )
    }

    if (problemas.length > 0) {
      return { numeroLinha, status: 'erro', mensagem: problemas.join(' · '), problemas }
    }

    const trader = acharTrader(bruto.traderNome)
    const comentariosBrutos = [
      bruto.comentarios,
      bruto.destino ? `Destination: ${bruto.destino}` : null,
      // fornecedor pode ser null quando ainda vai ser cadastrado na confirmação.
      // A marca só é redundante quando já existe cadastro para comparar.
      String(bruto.brand ?? '').trim() &&
      String(bruto.brand).trim().toLowerCase() !== String(fornecedor?.marca ?? '').toLowerCase()
        ? `Brand: ${String(bruto.brand).trim()}`
        : null,
    ]
      .filter(Boolean)
      .join(' — ')

    const dadosCriacao = {
      tipoRegistro: 'Position',
      divisaoId: divisaoAtiva?.id ?? null,
      // Pode ser null quando o registro ainda vai ser criado na confirmação —
      // aí o id real é preenchido em confirmarImportacao.
      produtoId: produto?.id ?? null,
      fornecedorId: fornecedor?.id ?? null,
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
      aCriar,
      titulo: `${produto?.nome ?? nomeProduto} — ${fornecedor?.nome ?? nomeFornecedor}`,
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
    const colunas = colunasDaPlanilha(linhas)
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
        familia: valorDaColuna('familia'),
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

  // Cria os cadastros que faltavam, uma vez por nome — 40 linhas do mesmo
  // fornecedor viram um registro só. Tudo marcado com revisarCadastro para dar
  // pra achar depois e completar os dados que a planilha não traz.
  function criarCadastrosFaltantes() {
    const produtosCriados = new Map()
    const fornecedoresCriados = new Map()

    preview.forEach((linha) => {
      ;(linha.aCriar ?? []).forEach((item) => {
        const chave = item.nome.toLowerCase()

        if (item.tipo === 'produto' && !produtosCriados.has(chave)) {
          // A coluna "Business" da planilha (Chicken, Pork...) casa com o cadastro
          // de famílias; sem ela o produto cai na primeira família disponível.
          const nomeFamilia = String(item.familia ?? '').trim().toLowerCase()
          // A família precisa ser da divisão aberta, senão o produto novo nasceria
          // fora do módulo de quem importou.
          const familiasDaDivisao = familias.items.filter(
            (f) => f.situacao === 'Ativo' && (!divisaoAtiva || f.divisaoId === divisaoAtiva.id),
          )
          const familia =
            familiasDaDivisao.find((f) => f.nome.toLowerCase() === nomeFamilia) ??
            familiasDaDivisao[0] ??
            familias.items[0]

          produtosCriados.set(
            chave,
            produtos.criar({
              nome: item.nome,
              apelido: item.nome,
              familiaId: familia?.id ?? null,
              situacao: 'Ativo',
              revisarCadastro: true,
            }),
          )
        }

        if (item.tipo === 'fornecedor' && !fornecedoresCriados.has(chave)) {
          fornecedoresCriados.set(
            chave,
            empresas.criar({
              nome: item.nome,
              tipo: 'Fornecedor',
              pais: '',
              responsavelAyamoId: usuarioLogado.id,
              moedaPadrao: 'USD',
              limiteCredito: 0,
              creditoUtilizado: 0,
              situacao: 'Ativo',
              produtosCapacidade: [],
              qualificacoesPaises: {},
              revisarCadastro: true,
            }),
          )
        }
      })
    })

    return { produtosCriados, fornecedoresCriados }
  }

  function confirmarImportacao() {
    const jaImportadas = ofertas.items.filter((o) => o.codigo.startsWith('OF-IMP-')).length
    let importadas = 0
    const erros = []

    const { produtosCriados, fornecedoresCriados } = criarCadastrosFaltantes()

    preview.forEach((linha) => {
      if (linha.status !== 'ok') {
        erros.push(`Linha ${linha.numeroLinha}: ${linha.mensagem}`)
        return
      }

      // Resolve os ids que ficaram pendentes até os cadastros existirem.
      const dados = { ...linha.dadosCriacao }
      ;(linha.aCriar ?? []).forEach((item) => {
        const chave = item.nome.toLowerCase()
        if (item.tipo === 'produto') dados.produtoId = produtosCriados.get(chave)?.id ?? dados.produtoId
        if (item.tipo === 'fornecedor') dados.fornecedorId = fornecedoresCriados.get(chave)?.id ?? dados.fornecedorId
      })

      if (!dados.produtoId || !dados.fornecedorId) {
        erros.push(`Linha ${linha.numeroLinha}: não foi possível vincular produto ou fornecedor.`)
        return
      }

      const codigo = `OF-IMP-${jaImportadas + importadas + 1}`
      importadas += 1
      ofertas.criar({ codigo, codigoBase: codigo, versao: 0, ...dados })
    })

    setResumoFinal({
      total: preview.length,
      importadas,
      erros,
      produtosCriados: produtosCriados.size,
      fornecedoresCriados: fornecedoresCriados.size,
    })
    setPreview(null)
    onImportado?.()
  }

  const validas = preview?.filter((l) => l.status === 'ok').length ?? 0

  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-dashed border-ayamo-border bg-ayamo-bg/50 px-4 py-3">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-[var(--ayamo-primary)]"
          checked={cadastrarFaltantes}
          onChange={(e) => setCadastrarFaltantes(e.target.checked)}
        />
        <span className="text-sm text-ayamo-text">
          Cadastrar automaticamente produtos e fornecedores que não existirem
          <span className="mt-0.5 block text-xs text-ayamo-text-mut">
            Útil para testar importações sem preparar o cadastro antes. Os registros criados ficam marcados para
            revisão e vêm só com o nome — país, moeda, limite de crédito e família precisam ser conferidos depois.
          </span>
        </span>
      </label>

      <UploadPlanilha
        onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(iniciarMapeamento)}
        hint={
          <>
            Cabeçalhos aceitos (o modelo real de compras funciona direto): <strong>{COLUNAS_ACEITAS}</strong>. Se a sua
            planilha usar outros nomes de coluna, tudo bem — o próximo passo deixa você confirmar o mapeamento.
          </>
        }
        mensagemResumo={
          resumoFinal &&
          `${resumoFinal.importadas} de ${resumoFinal.total} linha(s) importadas.` +
            (resumoFinal.fornecedoresCriados || resumoFinal.produtosCriados
              ? ` Cadastrados automaticamente: ${resumoFinal.produtosCriados} produto(s) e ${resumoFinal.fornecedoresCriados} fornecedor(es) — revise em Cadastros e Empresas.`
              : '')
        }
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
          <Field label={t('campo.textoOferta')}>
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
