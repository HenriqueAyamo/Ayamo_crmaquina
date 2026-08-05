// Backend do CRM: autenticação por sessão, rotas de IA (extração de oferta e consulta de uso)
// e os arquivos estáticos do build (Vite).
// A chave da OpenAI fica só aqui (secret do Worker), nunca no bundle do frontend.

import {
  abrirSessao,
  auditar,
  conferirSenha,
  cookieDeSessao,
  criarHashSenha,
  dentroDoLimite,
  estaBloqueado,
  forcaDaSenha,
  lerCookieSessao,
  limparFalhasLogin,
  limparSessoesExpiradas,
  registrarFalhaLogin,
  revogarSessao,
  revogarTodasSessoes,
  temPerfil,
  usuarioDaRequisicao,
} from './auth.js'

// Chave geral da autenticação — precisa ficar igual a AUTH_HABILITADA em
// src/auth/config.js.
//
// false = as rotas de IA voltam a ficar abertas, sem exigir sessão. Todo o
//         código de login, sessão, bloqueio e auditoria continua aqui, apenas
//         não é acionado.
//
// ATENÇÃO: com false, qualquer pessoa que descubra a URL do Worker pode chamar
// /api/ia/extrair e consumir a chave da OpenAI, e ler o histórico de uso em
// /api/ia/uso. O rate limit por IP continua valendo e é a única barreira.
// Ver SEGURANCA.md.
const AUTH_HABILITADA = false

// Origens liberadas para chamar a API de outro host. Em produção o front é
// servido pelo próprio Worker, então a lista cobre só o desenvolvimento local.
const ORIGENS_PERMITIDAS = ['http://localhost:5173', 'http://127.0.0.1:5173']

// Preco por 1M tokens -- atualizar aqui se a OpenAI mudar o preco do modelo.
const PRECOS_MODELO = {
  'gpt-5.4-nano': { input: 0.20, output: 1.25 },
  'gpt-5.4-mini': { input: 0.75, output: 4.50 },
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

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function cabecalhosCors(origin) {
  if (!origin || !ORIGENS_PERMITIDAS.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

// CSP restrita: sem CDN, sem eval, sem iframe de terceiros. 'unsafe-inline' em
// style-peso porque o Tailwind injeta estilos inline em runtime.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const CABECALHOS_SEGURANCA = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

function json(dados, status, origin, extras = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...cabecalhosCors(origin),
      ...CABECALHOS_SEGURANCA,
      ...extras,
    },
  })
}

function ip(request) {
  return request.headers.get('CF-Connecting-IP') ?? 'desconhecido'
}

// ---------------------------------------------------------------------------
// Autenticação
// ---------------------------------------------------------------------------

async function handleLogin(request, env, origin) {
  // Limite por IP: trava força bruta antes de encostar no banco de usuários.
  if (!(await dentroDoLimite(env.DB, `login:${ip(request)}`, { max: 10, janelaMs: 15 * 60 * 1000 }))) {
    await auditar(env.DB, { acao: 'login.rate_limit', ip: ip(request), sucesso: false })
    return json({ erro: 'Muitas tentativas. Tente novamente em alguns minutos.' }, 429, origin)
  }

  let corpo
  try {
    corpo = await request.json()
  } catch {
    return json({ erro: 'Corpo da requisição inválido.' }, 400, origin)
  }

  const email = String(corpo.email ?? '').trim().toLowerCase()
  const senha = String(corpo.senha ?? '')
  if (!email || !senha) return json({ erro: 'Informe e-mail e senha.' }, 400, origin)

  const usuario = await env.DB.prepare('SELECT * FROM usuarios WHERE email = ?').bind(email).first()

  // Mensagem única para e-mail inexistente e senha errada: não entregamos a
  // quem está tentando invadir a informação de que o e-mail existe.
  const generico = { erro: 'E-mail ou senha inválidos.' }

  if (!usuario) {
    await auditar(env.DB, { email, acao: 'login.falha', detalhe: 'usuário inexistente', ip: ip(request), sucesso: false })
    return json(generico, 401, origin)
  }

  if (usuario.situacao !== 'Ativo') {
    await auditar(env.DB, { usuarioId: usuario.id, email, acao: 'login.falha', detalhe: 'usuário inativo', ip: ip(request), sucesso: false })
    return json(generico, 401, origin)
  }

  if (estaBloqueado(usuario)) {
    await auditar(env.DB, { usuarioId: usuario.id, email, acao: 'login.bloqueado', ip: ip(request), sucesso: false })
    return json({ erro: 'Conta temporariamente bloqueada por excesso de tentativas. Tente de novo em 15 minutos.' }, 423, origin)
  }

  if (!(await conferirSenha(senha, usuario))) {
    const { bloqueado } = await registrarFalhaLogin(env.DB, usuario)
    await auditar(env.DB, { usuarioId: usuario.id, email, acao: 'login.falha', detalhe: 'senha incorreta', ip: ip(request), sucesso: false })
    if (bloqueado) {
      return json({ erro: 'Conta bloqueada por 15 minutos após 5 tentativas incorretas.' }, 423, origin)
    }
    return json(generico, 401, origin)
  }

  await limparFalhasLogin(env.DB, usuario.id)
  const token = await abrirSessao(env.DB, usuario, request)
  await auditar(env.DB, { usuarioId: usuario.id, email, acao: 'login.sucesso', ip: ip(request) })

  return json(
    {
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        precisaTrocarSenha: Boolean(usuario.precisa_trocar_senha),
      },
    },
    200,
    origin,
    { 'Set-Cookie': cookieDeSessao(token) },
  )
}

async function handleLogout(request, env, origin) {
  const token = lerCookieSessao(request)
  const usuario = await usuarioDaRequisicao(env.DB, request)
  await revogarSessao(env.DB, token)
  if (usuario) await auditar(env.DB, { usuarioId: usuario.id, email: usuario.email, acao: 'logout', ip: ip(request) })
  return json({ ok: true }, 200, origin, { 'Set-Cookie': cookieDeSessao('', { apagar: true }) })
}

async function handleMe(request, env, origin) {
  const usuario = await usuarioDaRequisicao(env.DB, request)
  if (!usuario) return json({ erro: 'Não autenticado.' }, 401, origin)
  return json({ usuario }, 200, origin)
}

async function handleTrocarSenha(request, env, origin, usuario) {
  let corpo
  try {
    corpo = await request.json()
  } catch {
    return json({ erro: 'Corpo da requisição inválido.' }, 400, origin)
  }

  const atual = String(corpo.senhaAtual ?? '')
  const nova = String(corpo.novaSenha ?? '')

  const problema = forcaDaSenha(nova)
  if (problema) return json({ erro: problema }, 400, origin)

  const linha = await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(usuario.id).first()
  if (!(await conferirSenha(atual, linha))) {
    await auditar(env.DB, { usuarioId: usuario.id, email: usuario.email, acao: 'senha.troca_falha', ip: ip(request), sucesso: false })
    return json({ erro: 'Senha atual incorreta.' }, 401, origin)
  }

  const { hash, salt, iteracoes } = await criarHashSenha(nova)
  await env.DB.prepare(
    'UPDATE usuarios SET senha_hash = ?, senha_salt = ?, iteracoes = ?, precisa_trocar_senha = 0, atualizado_em = ? WHERE id = ?',
  )
    .bind(hash, salt, iteracoes, new Date().toISOString(), usuario.id)
    .run()

  // Troca de senha derruba as outras sessões: se alguém tinha roubado o cookie, perde o acesso.
  await revogarTodasSessoes(env.DB, usuario.id)
  const token = await abrirSessao(env.DB, { id: usuario.id }, request)
  await auditar(env.DB, { usuarioId: usuario.id, email: usuario.email, acao: 'senha.trocada', ip: ip(request) })

  return json({ ok: true }, 200, origin, { 'Set-Cookie': cookieDeSessao(token) })
}

// ---------------------------------------------------------------------------
// IA
// ---------------------------------------------------------------------------

function calcularCustoUSD(modelo, tokensInput, tokensOutput) {
  const preco = PRECOS_MODELO[modelo] ?? PRECOS_MODELO['gpt-5.4-nano']
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

async function handleExtrair(request, env, origin, usuario) {
  // A extração custa dinheiro por chamada. Com sessão, o limite é por usuário;
  // sem autenticação todos seriam o mesmo id, então cai para o IP — senão a
  // primeira pessoa a usar consumiria a cota de todo mundo.
  const chaveLimite = usuario.id ? `ia:${usuario.id}` : `ia:ip:${ip(request)}`
  if (!(await dentroDoLimite(env.DB, chaveLimite, { max: 60, janelaMs: 60 * 60 * 1000 }))) {
    await auditar(env.DB, { usuarioId: usuario.id, email: usuario.email, acao: 'ia.rate_limit', ip: ip(request), sucesso: false })
    return json({ erro: 'Limite de extrações por hora atingido. Tente novamente mais tarde.' }, 429, origin)
  }

  const modelo = 'gpt-5.4-nano'
  let corpo
  try {
    corpo = await request.json()
  } catch {
    return json({ erro: 'Corpo da requisição inválido.' }, 400, origin)
  }

  const { texto, arquivoBase64, mimeType, nomeArquivo, tipo, produtosCatalogo, fornecedoresCatalogo } = corpo
  if (!texto && !arquivoBase64) {
    return json({ erro: 'Envie "texto" ou "arquivoBase64".' }, 400, origin)
  }

  // Teto de tamanho: sem isso, um upload gigante vira custo de token ilimitado.
  if (arquivoBase64 && arquivoBase64.length > 8 * 1024 * 1024) {
    return json({ erro: 'Arquivo muito grande (máximo ~6 MB).' }, 413, origin)
  }
  if (texto && texto.length > 100_000) {
    return json({ erro: 'Texto muito longo.' }, 413, origin)
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

  // O nome vem da sessão, não do corpo: antes o cliente podia se identificar como quisesse.
  const nomeUsuario = usuario.nome

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
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario: nomeUsuario, modelo, tokensInput: 0, tokensOutput: 0, custoUSD: 0, sucesso: false, erro: String(erroFetch) })
    return json({ erro: 'Falha ao contatar a OpenAI.' }, 502, origin)
  }

  const dados = await respostaOpenAI.json()

  if (dados.error) {
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario: nomeUsuario, modelo, tokensInput: 0, tokensOutput: 0, custoUSD: 0, sucesso: false, erro: dados.error.message })
    // Não devolvemos a mensagem crua da OpenAI: ela pode conter detalhe da conta/chave.
    return json({ erro: 'A IA não conseguiu processar este conteúdo.' }, 502, origin)
  }

  const textoResposta = dados.output?.find((o) => o.type === 'message')?.content?.find((c) => c.type === 'output_text')?.text
  const tokensInput = dados.usage?.input_tokens ?? 0
  const tokensOutput = dados.usage?.output_tokens ?? 0
  const custoUSD = calcularCustoUSD(modelo, tokensInput, tokensOutput)

  if (!textoResposta) {
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario: nomeUsuario, modelo, tokensInput, tokensOutput, custoUSD, sucesso: false, erro: 'Resposta sem texto.' })
    return json({ erro: 'A IA não retornou um resultado utilizável.' }, 502, origin)
  }

  let ofertas
  try {
    ofertas = JSON.parse(textoResposta).ofertas
  } catch {
    await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario: nomeUsuario, modelo, tokensInput, tokensOutput, custoUSD, sucesso: false, erro: 'JSON inválido na resposta.' })
    return json({ erro: 'A IA retornou um formato inesperado.' }, 502, origin)
  }

  await registrarUso(env.DB, { tipo: tipo || 'desconhecido', usuario: nomeUsuario, modelo, tokensInput, tokensOutput, custoUSD, sucesso: true })

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

// ---------------------------------------------------------------------------
// Roteamento
// ---------------------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin')

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...cabecalhosCors(origin), ...CABECALHOS_SEGURANCA } })
    }

    if (url.pathname.startsWith('/api/')) {
      // Rotas abertas: só o login.
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env, origin)
      }
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        return handleLogout(request, env, origin)
      }
      if (url.pathname === '/api/auth/me' && request.method === 'GET') {
        return handleMe(request, env, origin)
      }

      // Daqui pra baixo exigiria sessão válida. Com a autenticação desligada
      // seguimos com um usuário anônimo, que só serve para nomear o log de uso.
      const usuario = AUTH_HABILITADA
        ? await usuarioDaRequisicao(env.DB, request)
        : { id: 0, nome: 'Anônimo (login desativado)', email: null, perfil: 'Administrador' }

      if (!usuario) return json({ erro: 'Não autenticado.' }, 401, origin)

      if (url.pathname === '/api/auth/senha' && request.method === 'POST') {
        if (!AUTH_HABILITADA) return json({ erro: 'Autenticação desativada.' }, 404, origin)
        return handleTrocarSenha(request, env, origin, usuario)
      }

      if (url.pathname === '/api/ia/extrair' && request.method === 'POST') {
        if (AUTH_HABILITADA && !temPerfil(usuario, ['Comprador', 'Vendedor', 'Administrador'])) {
          return json({ erro: 'Seu perfil não pode usar a extração por IA.' }, 403, origin)
        }
        return handleExtrair(request, env, origin, usuario)
      }

      if (url.pathname === '/api/ia/uso' && request.method === 'GET') {
        if (AUTH_HABILITADA && !temPerfil(usuario, ['Administrador'])) {
          return json({ erro: 'Apenas Administradores podem ver o uso de IA.' }, 403, origin)
        }
        // Limpeza oportunista das sessões vencidas, fora do caminho da resposta.
        if (AUTH_HABILITADA) ctx.waitUntil(limparSessoesExpiradas(env.DB))
        return handleUso(request, env, origin)
      }

      return json({ erro: 'Rota não encontrada.' }, 404, origin)
    }

    // Estáticos do build, com os mesmos cabeçalhos de segurança.
    const resposta = await env.ASSETS.fetch(request)
    const headers = new Headers(resposta.headers)
    for (const [chave, valor] of Object.entries(CABECALHOS_SEGURANCA)) headers.set(chave, valor)
    return new Response(resposta.body, { status: resposta.status, statusText: resposta.statusText, headers })
  },
}
