CREATE TABLE IF NOT EXISTS uso_ia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em TEXT NOT NULL,
  tipo TEXT NOT NULL,
  usuario TEXT,
  modelo TEXT NOT NULL,
  tokens_input INTEGER NOT NULL,
  tokens_output INTEGER NOT NULL,
  custo_usd REAL NOT NULL,
  sucesso INTEGER NOT NULL,
  erro TEXT
);

CREATE INDEX IF NOT EXISTS idx_uso_ia_criado_em ON uso_ia (criado_em);

-- ---------------------------------------------------------------------------
-- Autenticação
-- ---------------------------------------------------------------------------
-- A senha nunca é guardada: só o hash PBKDF2-SHA256 e o salt, ambos em hex.
-- "iteracoes" fica na linha para dar pra aumentar o custo no futuro sem
-- invalidar as senhas já cadastradas.
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  perfil TEXT NOT NULL,
  situacao TEXT NOT NULL DEFAULT 'Ativo',
  senha_hash TEXT NOT NULL,
  senha_salt TEXT NOT NULL,
  iteracoes INTEGER NOT NULL,
  precisa_trocar_senha INTEGER NOT NULL DEFAULT 0,
  tentativas_falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate TEXT,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios (email);

-- Sessões: guardamos só o hash do token. Quem vazar o banco não consegue
-- reconstruir os cookies em circulação.
CREATE TABLE IF NOT EXISTS sessoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_hash TEXT NOT NULL UNIQUE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  criada_em TEXT NOT NULL,
  expira_em TEXT NOT NULL,
  ultimo_uso_em TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  revogada INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON sessoes (expira_em);

-- Trilha de auditoria: quem fez o quê, de onde. Serve tanto para investigar
-- um vazamento quanto para responder "quem apagou este registro?".
CREATE TABLE IF NOT EXISTS auditoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em TEXT NOT NULL,
  usuario_id INTEGER,
  email TEXT,
  acao TEXT NOT NULL,
  recurso TEXT,
  detalhe TEXT,
  ip TEXT,
  sucesso INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em ON auditoria (criado_em);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria (usuario_id);

-- Rate limit por chave (ip:rota). Janela deslizante simples, suficiente para
-- travar força bruta de login e abuso das rotas de IA.
CREATE TABLE IF NOT EXISTS rate_limit (
  chave TEXT PRIMARY KEY,
  contagem INTEGER NOT NULL,
  janela_inicio TEXT NOT NULL
);
