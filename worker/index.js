// Backend minimo do CRM: hoje so serve duas coisas de IA (extracao de oferta e consulta de uso),
// alem de continuar servindo os arquivos estaticos do build (Vite) pra quem acessar direto por aqui.
// A chave da OpenAI fica só aqui (secret do Worker), nunca no bundle do frontend.

const ORIGENS_PERMITIDAS = [
  'https://henriqueayamo.github.io',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

// Preco por 1M tokens -- atualizar aqui se a OpenAI mudar o preco do modelo.
const PRECOS_MODELO = {
  'gpt-5.4-mini': { input: 0.375, output: 2.25 },
}

const SCHEMA_OFERTA = {
  type: 'object',
  properties: {
    ref: { type: ['string', 'null'] },
    produto: { type: ['string', 'null'] },
    produtoIdCatalogo: { type: ['integer', 'null'], description: 'id da lista de produtos do catálogo, se algum corresponder claramente' },
    fornecedor: { type: ['string', 'null'] },
    fornecedorIdCatalogo: { type: ['integer', 'null'], description: 'id da lista de fornecedores do catálogo, se algum corresponder claramente' },
    brand: { type: ['string', 'null'] },
    moeda: { type: ['string', 'null'] },
    preco: { type: ['number', 'null'] },
    quantidade: { type: ['number', 'null'] },
    incoterm: { type: ['string', 'null'] },
    embarqueDe: { type: ['string', 'null'] },
    embarqueAte: { type: ['string', 'null'] },
    destino: { type: ['string', 'null'] },
    sif: { type: ['string', 'null'] },
    validadeOferta: { type: ['string', 'null'] },
    prazoPagamento: { type: ['string', 'null'] },
    trader: { type: ['string', 'null'] },
    comentarios: { type: ['string', 'null'] },
  },
  required: [
    'ref', 'produto', 'produtoIdCatalogo', 'fornecedor', 'fornecedorIdCatalogo', 'brand', 'moeda', 'preco',
    'quantidade', 'incoterm', 'embarqueDe', 'embarqueAte', 'destino', 'sif', 'validadeOferta', 'prazoPagamento',
    'trader', 'comentarios',
  ],
  additionalProperties: false,
}

const SCHEMA = {
  type: 'object',
  properties: { ofertas: { type: 'array', items: SCHEMA_OFERTA } },
  required: ['ofertas'],
  additionalProperties: false,
}

const SYSTEM_PROMPT = `Você transforma qualquer oferta de proteína animal (frango, suíno, bovino ou peixe) recebida em
formato livre (texto de WhatsApp, e-mail, foto de planilha, foto de lista de preço, PDF de contrato ou proforma)
numa lista estruturada de ofertas.

Regras:
- Cada oferta identificada no material vira um item da lista "ofertas".
- quantidade: número de toneladas. Se a carga for menor que um contêiner completo, estime a
  quantidade em toneladas a partir do contexto — nunca deixe a palavra "mix" como valor.
- preco: só o número, sem símbolo de moeda.
- moeda: código de 3 letras (USD, BRL, EUR...).
- Datas sempre em dd/mm/aaaa. Se o ano não for informado, use o ano corrente.
- validadeOferta: só preencha se a oferta tiver uma data explícita de validade — não converta
  referências relativas tipo "até sexta" em data, deixe null.
- Se um dado não puder ser inferido com confiança, retorne null nesse campo — nunca invente.
- trader e fornecedor: use exatamente o nome como aparece na oferta, sem abreviar.
- Você vai receber, junto da mensagem, uma lista de produtos e uma lista de fornecedores já
  cadastrados no sistema (id + nome). Se o produto/fornecedor da oferta corresponder claramente a
  um item dessas listas — mesmo que escrito diferente, abreviado, em outro idioma, ou com sufixo
  societário diferente (ex.: "Frimesa Cooperativa Central" = "Frimesa", "peito de frango congelado"
  = "Frozen Chicken Leg Quarters") — preencha produtoIdCatalogo/fornecedorIdCatalogo com o id
  correspondente. Se não tiver certeza razoável, deixe null — nunca chute um id.`

function montarPromptCatalogo(produtos, fornecedores) {
  const listaProdutos = (produtos ?? []).map((p) => `${p.id}: ${p.nome}${p.apelido ? ` (${p.apelido})` : ''}`).join('\n')
  const listaFornecedores = (fornecedores ?? []).map((f) => `${f.id}: ${f.nome}`).join('\n')
  return `Produtos cadastrados (id: nome):\n${listaProdutos}\n\nFornecedores cadastrados (id: nome):\n${listaFornecedores}`
}

function cabecalhosCors(origin) {
  const permitida = ORIGENS_PERMITIDAS.includes(origin)
  return {
    'Access-Control-Allow-Origin': permitida ? origin : ORIGENS_PERMITIDAS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(dados, status, origin) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'Content-Type': 'application/json', ...cabecalhosCors(origin) },
  })
}

function calcularCustoUSD(modelo, tokensInput, tokensOutput) {
  const preco = PRECOS_MODELO[modelo] ?? PRECOS_MODELO['gpt-5.4-mini']
  return (tokensInput / 1e6) * preco.input + (tokensOutput / 1e6) * preco.output
}

async function registrarUso(db, { tipo, usuario, modelo, tokensInput, tokensOutput, custoUSD, sucesso, erro }) {
  await db
    .prepare(
      `INSERT INTO uso_ia (criado_em, tipo, usuario, modelo, tokens_input, tokens_output, custo_usd, sucesso, erro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(new Date().toISOString(), tipo, usuario ?? null, modelo, tokensInput, tokensOutput, custoUSD, sucesso ? 1 : 0, erro ?? null)
    .run()
}

async function handleExtrair(request, env, origin) {
  const modelo = 'gpt-5.4-mini'
  let corpo
  try {
    corpo = await request.json()
  } catch {
    return json({ erro: 'Corpo da requisição inválido.' }, 400, origin)
  }

  const { texto, arquivoBase64, mimeType, nomeArquivo, tipo, usuario, produtosCatalogo, fornecedoresCatalogo } = corpo
  if (!texto && !arquivoBase64) {
    return json({ erro: 'Envie "texto" ou "arquivoBase64".' }, 400, origin)
  }

  const conteudoUsuario = []
  conteudoUsuario.push({ type: 'input_text', text: montarPromptCatalogo(produtosCatalogo, fornecedoresCatalogo) })
  if (arquivoBase64) {
    conteudoUsuario.push({ type: 'input_text', text: texto || 'Extraia as ofertas presentes neste arquivo.' })
    if (mimeType === 'application/pdf') {
      conteudoUsuario.push({
        type: 'input_file',
        filename: nomeArquivo || 'documento.pdf',
        file_data: `data:application/pdf;base64,${arquivoBase64}`,
      })
    } else {
      conteudoUsuario.push({ type: 'input_image', image_url: `data:${mimeType || 'image/png'};base64,${arquivoBase64}` })
    }
  } else {
    conteudoUsuario.push({ type: 'input_text', text: texto })
  }

  let respostaOpenAI
  try {
    respostaOpenAI = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: modelo,
        input: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: conteudoUsuario },
        ],
        text: { format: { type: 'json_schema', name: 'ofertas_extraidas', schema: SCHEMA, strict: true } },
      }),
    })
  } catch (erroFetch) {
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario, modelo, tokensInput: 0, tokensOutput: 0, custoUSD: 0, sucesso: false, erro: String(erroFetch) })
    return json({ erro: 'Falha ao contatar a OpenAI.' }, 502, origin)
  }

  const dados = await respostaOpenAI.json()

  if (dados.error) {
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario, modelo, tokensInput: 0, tokensOutput: 0, custoUSD: 0, sucesso: false, erro: dados.error.message })
    return json({ erro: dados.error.message }, 500, origin)
  }

  const textoResposta = dados.output?.find((o) => o.type === 'message')?.content?.find((c) => c.type === 'output_text')?.text
  const tokensInput = dados.usage?.input_tokens ?? 0
  const tokensOutput = dados.usage?.output_tokens ?? 0
  const custoUSD = calcularCustoUSD(modelo, tokensInput, tokensOutput)

  if (!textoResposta) {
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario, modelo, tokensInput, tokensOutput, custoUSD, sucesso: false, erro: 'Resposta sem texto.' })
    return json({ erro: 'A IA não retornou um resultado utilizável.' }, 500, origin)
  }

  let ofertas
  try {
    ofertas = JSON.parse(textoResposta).ofertas
  } catch {
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario, modelo, tokensInput, tokensOutput, custoUSD, sucesso: false, erro: 'JSON inválido na resposta.' })
    return json({ erro: 'A IA retornou um formato inesperado.' }, 500, origin)
  }

  await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario, modelo, tokensInput, tokensOutput, custoUSD, sucesso: true })

  return json({ ofertas, tokensInput, tokensOutput, custoUSD }, 200, origin)
}

async function handleUso(request, env, origin) {
  const hoje = new Date()
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  const resumoMes = await env.DB.prepare(
    `SELECT COUNT(*) AS requisicoes, COALESCE(SUM(tokens_input),0) AS tokensInput,
            COALESCE(SUM(tokens_output),0) AS tokensOutput, COALESCE(SUM(custo_usd),0) AS custoUSD,
            COALESCE(SUM(CASE WHEN sucesso = 0 THEN 1 ELSE 0 END),0) AS erros
     FROM uso_ia WHERE criado_em >= ?`,
  )
    .bind(inicioMes)
    .first()

  const historico = await env.DB.prepare(
    `SELECT criado_em, tipo, usuario, modelo, tokens_input, tokens_output, custo_usd, sucesso, erro
     FROM uso_ia ORDER BY criado_em DESC LIMIT 200`,
  ).all()

  const porDia = await env.DB.prepare(
    `SELECT substr(criado_em, 1, 10) AS dia, COALESCE(SUM(custo_usd),0) AS custoUSD, COUNT(*) AS requisicoes
     FROM uso_ia WHERE criado_em >= ? GROUP BY dia ORDER BY dia ASC`,
  )
    .bind(inicioMes)
    .all()

  return json({ resumoMes, historico: historico.results, porDia: porDia.results }, 200, origin)
}

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') ?? ORIGENS_PERMITIDAS[0]

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cabecalhosCors(origin) })
    }

    if (url.pathname === '/api/ia/extrair' && request.method === 'POST') {
      return handleExtrair(request, env, origin)
    }
    if (url.pathname === '/api/ia/uso' && request.method === 'GET') {
      return handleUso(request, env, origin)
    }

    return env.ASSETS.fetch(request)
  },
}
