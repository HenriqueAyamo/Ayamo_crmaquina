// Autenticação do CRM: hash de senha, sessão por cookie e autorização por perfil.
// Tudo com a WebCrypto do runtime do Worker — sem dependência externa.

// 12k iterações, não as 210k que o OWASP recomenda para PBKDF2-SHA256: o plano
// gratuito do Workers dá 10ms de CPU por requisição e 210k custam ~43ms, o que
// derrubava o login com erro 1101. Com 12k o cálculo fica em ~2,5ms.
//
// Isso é uma concessão consciente: se o banco vazar, quebrar as senhas por força
// bruta fica mais barato para um atacante. O que sustenta a segurança aqui é o
// resto — salt por usuário, bloqueio após 5 tentativas e rate limit por IP —
// além da exigência de senha longa.
//
// A coluna "iteracoes" é por usuário: ao migrar para o plano pago, basta subir
// esta constante e recriar as senhas; as antigas continuam validando enquanto isso.
const ITERACOES_PBKDF2 = 12_000
const TAMANHO_CHAVE_BITS = 256
const DURACAO_SESSAO_MS = 12 * 60 * 60 * 1000 // 12h — turno de trabalho
const NOME_COOKIE = 'ayamo_sessao'

const MAX_TENTATIVAS = 5
const BLOQUEIO_MS = 15 * 60 * 1000

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

function paraHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function deHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return bytes
}

// Comparação em tempo constante: comparar com === vaza, pelo tempo de resposta,
// quantos caracteres do hash bateram.
function comparaSeguro(a, b) {
  if (a.length !== b.length) return false
  let diferenca = 0
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferenca === 0
}

async function derivarChave(senha, saltHex, iteracoes) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: deHex(saltHex), iterations: iteracoes, hash: 'SHA-256' },
    material,
    TAMANHO_CHAVE_BITS,
  )
  return paraHex(bits)
}

export async function criarHashSenha(senha) {
  const salt = paraHex(crypto.getRandomValues(new Uint8Array(16)))
  const hash = await derivarChave(senha, salt, ITERACOES_PBKDF2)
  return { hash, salt, iteracoes: ITERACOES_PBKDF2 }
}

export async function conferirSenha(senha, usuario) {
  const hash = await derivarChave(senha, usuario.senha_salt, usuario.iteracoes)
  return comparaSeguro(hash, usuario.senha_hash)
}

// O token vai em claro no cookie e só o SHA-256 dele é gravado.
function gerarToken() {
  return paraHex(crypto.getRandomValues(new Uint8Array(32)))
}

async function hashToken(token) {
  return paraHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))
}

export function forcaDaSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 12) return 'A senha precisa ter ao menos 12 caracteres.'
  if (!/[a-z]/.test(senha)) return 'A senha precisa ter ao menos uma letra minúscula.'
  if (!/[A-Z]/.test(senha)) return 'A senha precisa ter ao menos uma letra maiúscula.'
  if (!/[0-9]/.test(senha)) return 'A senha precisa ter ao menos um número.'
  return null
}

// ---------------------------------------------------------------------------
// Cookie
// ---------------------------------------------------------------------------

export function cookieDeSessao(token, { apagar = false } = {}) {
  const base = `${NOME_COOKIE}=${apagar ? '' : token}; Path=/; HttpOnly; Secure; SameSite=Strict`
  return apagar ? `${base}; Max-Age=0` : `${base}; Max-Age=${DURACAO_SESSAO_MS / 1000}`
}

export function lerCookieSessao(request) {
  const bruto = request.headers.get('Cookie') ?? ''
  for (const parte of bruto.split(';')) {
    const [nome, ...resto] = parte.trim().split('=')
    if (nome === NOME_COOKIE) return resto.join('=')
  }
  return null
}

// ---------------------------------------------------------------------------
// Sessão
// ---------------------------------------------------------------------------

export async function abrirSessao(db, usuario, request) {
  const token = gerarToken()
  const agora = new Date()
  const expira = new Date(agora.getTime() + DURACAO_SESSAO_MS)

  await db
    .prepare(
      `INSERT INTO sessoes (token_hash, usuario_id, criada_em, expira_em, ultimo_uso_em, ip, user_agent, revogada)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    )
    .bind(
      await hashToken(token),
      usuario.id,
      agora.toISOString(),
      expira.toISOString(),
      agora.toISOString(),
      request.headers.get('CF-Connecting-IP') ?? null,
      (request.headers.get('User-Agent') ?? '').slice(0, 300),
    )
    .run()

  return token
}

export async function revogarSessao(db, token) {
  if (!token) return
  await db.prepare('UPDATE sessoes SET revogada = 1 WHERE token_hash = ?').bind(await hashToken(token)).run()
}

export async function revogarTodasSessoes(db, usuarioId) {
  await db.prepare('UPDATE sessoes SET revogada = 1 WHERE usuario_id = ?').bind(usuarioId).run()
}

// Devolve o usuário da sessão ou null. Renova o "último uso" para dar pra
// enxergar sessões abandonadas depois.
export async function usuarioDaRequisicao(db, request) {
  const token = lerCookieSessao(request)
  if (!token) return null

  const linha = await db
    .prepare(
      `SELECT s.id AS sessao_id, s.expira_em, u.id, u.email, u.nome, u.perfil, u.situacao, u.precisa_trocar_senha
       FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id
       WHERE s.token_hash = ? AND s.revogada = 0`,
    )
    .bind(await hashToken(token))
    .first()

  if (!linha) return null
  if (new Date(linha.expira_em) < new Date()) return null
  if (linha.situacao !== 'Ativo') return null

  await db.prepare('UPDATE sessoes SET ultimo_uso_em = ? WHERE id = ?').bind(new Date().toISOString(), linha.sessao_id).run()

  return {
    id: linha.id,
    email: linha.email,
    nome: linha.nome,
    perfil: linha.perfil,
    precisaTrocarSenha: Boolean(linha.precisa_trocar_senha),
  }
}

export async function limparSessoesExpiradas(db) {
  await db.prepare('DELETE FROM sessoes WHERE expira_em < ?').bind(new Date().toISOString()).run()
}

// ---------------------------------------------------------------------------
// Bloqueio por tentativas
// ---------------------------------------------------------------------------

export function estaBloqueado(usuario) {
  return Boolean(usuario.bloqueado_ate) && new Date(usuario.bloqueado_ate) > new Date()
}

export async function registrarFalhaLogin(db, usuario) {
  const tentativas = (usuario.tentativas_falhas ?? 0) + 1
  const bloqueadoAte = tentativas >= MAX_TENTATIVAS ? new Date(Date.now() + BLOQUEIO_MS).toISOString() : usuario.bloqueado_ate
  await db
    .prepare('UPDATE usuarios SET tentativas_falhas = ?, bloqueado_ate = ?, atualizado_em = ? WHERE id = ?')
    .bind(tentativas, bloqueadoAte, new Date().toISOString(), usuario.id)
    .run()
  return { tentativas, bloqueado: tentativas >= MAX_TENTATIVAS }
}

export async function limparFalhasLogin(db, usuarioId) {
  await db
    .prepare('UPDATE usuarios SET tentativas_falhas = 0, bloqueado_ate = NULL, atualizado_em = ? WHERE id = ?')
    .bind(new Date().toISOString(), usuarioId)
    .run()
}

// ---------------------------------------------------------------------------
// Autorização
// ---------------------------------------------------------------------------

export const PERFIS = ['Comprador', 'Vendedor', 'Diretor', 'Financeiro', 'Controladoria', 'Administrador']

export function temPerfil(usuario, perfisPermitidos) {
  return Boolean(usuario) && perfisPermitidos.includes(usuario.perfil)
}

// ---------------------------------------------------------------------------
// Rate limit
// ---------------------------------------------------------------------------

export async function dentroDoLimite(db, chave, { max, janelaMs }) {
  const agora = new Date()
  const linha = await db.prepare('SELECT contagem, janela_inicio FROM rate_limit WHERE chave = ?').bind(chave).first()

  if (!linha || agora - new Date(linha.janela_inicio) > janelaMs) {
    await db
      .prepare(
        `INSERT INTO rate_limit (chave, contagem, janela_inicio) VALUES (?, 1, ?)
         ON CONFLICT (chave) DO UPDATE SET contagem = 1, janela_inicio = excluded.janela_inicio`,
      )
      .bind(chave, agora.toISOString())
      .run()
    return true
  }

  if (linha.contagem >= max) return false

  await db.prepare('UPDATE rate_limit SET contagem = contagem + 1 WHERE chave = ?').bind(chave).run()
  return true
}

// ---------------------------------------------------------------------------
// Auditoria
// ---------------------------------------------------------------------------

export async function auditar(db, { usuarioId, email, acao, recurso, detalhe, ip, sucesso = true }) {
  await db
    .prepare(
      `INSERT INTO auditoria (criado_em, usuario_id, email, acao, recurso, detalhe, ip, sucesso)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(new Date().toISOString(), usuarioId ?? null, email ?? null, acao, recurso ?? null, detalhe ?? null, ip ?? null, sucesso ? 1 : 0)
    .run()
}
