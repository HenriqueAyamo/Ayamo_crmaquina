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
