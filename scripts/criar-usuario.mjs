// Gera o SQL de INSERT de um usuário com a senha já em hash PBKDF2-SHA256,
// no mesmo formato que o Worker confere em worker/auth.js.
//
// Uso:
//   node scripts/criar-usuario.mjs "admin@ayamo.com" "Nome Completo" "Administrador" "SenhaForte123"
//
// Depois, aplique no banco:
//   npx wrangler d1 execute ayamo_ia_uso --remote --file=./usuario.sql
//
// A senha nunca é gravada em lugar nenhum — só o hash. Não deixe a senha no
// histórico do shell: prefira digitá-la quando o script perguntar.

import { pbkdf2, randomBytes } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { promisify } from 'node:util'

const derivar = promisify(pbkdf2)

// Precisa ser igual ao ITERACOES_PBKDF2 de worker/auth.js — ver o comentário lá
// sobre o limite de CPU do plano gratuito do Workers.
const ITERACOES = 12_000
const TAMANHO_BYTES = 32
const PERFIS = ['Comprador', 'Vendedor', 'Diretor', 'Financeiro', 'Controladoria', 'Administrador']

function validarSenha(senha) {
  if (senha.length < 12) return 'A senha precisa ter ao menos 12 caracteres.'
  if (!/[a-z]/.test(senha)) return 'A senha precisa ter ao menos uma letra minúscula.'
  if (!/[A-Z]/.test(senha)) return 'A senha precisa ter ao menos uma letra maiúscula.'
  if (!/[0-9]/.test(senha)) return 'A senha precisa ter ao menos um número.'
  return null
}

function escaparSQL(texto) {
  return String(texto).replace(/'/g, "''")
}

const [email, nome, perfil, senhaArgumento] = process.argv.slice(2)

if (!email || !nome || !perfil) {
  console.error('Uso: node scripts/criar-usuario.mjs "email" "Nome Completo" "Perfil" ["senha"]')
  console.error(`Perfis válidos: ${PERFIS.join(', ')}`)
  process.exit(1)
}

if (!PERFIS.includes(perfil)) {
  console.error(`Perfil inválido: ${perfil}. Use um de: ${PERFIS.join(', ')}`)
  process.exit(1)
}

let senha = senhaArgumento
if (!senha) {
  const rl = createInterface({ input: process.stdin, output: process.stderr })
  senha = await rl.question('Senha: ')
  rl.close()
}

const problema = validarSenha(senha)
if (problema) {
  console.error(problema)
  process.exit(1)
}

const salt = randomBytes(16).toString('hex')
const hash = (await derivar(senha, Buffer.from(salt, 'hex'), ITERACOES, TAMANHO_BYTES, 'sha256')).toString('hex')
const agora = new Date().toISOString()

// ON CONFLICT: rodar de novo com o mesmo e-mail redefine a senha em vez de falhar.
console.log(`INSERT INTO usuarios (email, nome, perfil, situacao, senha_hash, senha_salt, iteracoes, precisa_trocar_senha, tentativas_falhas, criado_em, atualizado_em)
VALUES ('${escaparSQL(email.toLowerCase())}', '${escaparSQL(nome)}', '${escaparSQL(perfil)}', 'Ativo', '${hash}', '${salt}', ${ITERACOES}, 0, 0, '${agora}', '${agora}')
ON CONFLICT (email) DO UPDATE SET
  nome = excluded.nome,
  perfil = excluded.perfil,
  senha_hash = excluded.senha_hash,
  senha_salt = excluded.senha_salt,
  iteracoes = excluded.iteracoes,
  tentativas_falhas = 0,
  bloqueado_ate = NULL,
  atualizado_em = excluded.atualizado_em;`)

console.error(`\n✓ SQL gerado para ${email} (${perfil}). Redirecione a saída para um arquivo .sql e aplique com wrangler.`)
