# Segurança e implantação

> ## ⚠️ A AUTENTICAÇÃO ESTÁ DESLIGADA
>
> `AUTH_HABILITADA = false` em `src/auth/config.js` **e** em `worker/index.js`.
> Todo o código descrito abaixo existe e funciona — login, sessão, bloqueio por
> tentativas, auditoria, autorização por perfil — mas **não está em vigor**.
>
> Enquanto estiver assim:
>
> - Qualquer pessoa com o link abre o sistema, sem senha.
> - O seletor de usuário na barra superior voltou; trocar de perfil ali é livre
>   e não é credencial nenhuma.
> - **`/api/ia/extrair` e `/api/ia/uso` estão abertas na internet.** Quem
>   descobrir a URL do Worker pode consumir a chave da OpenAI e ler o histórico
>   de uso. A única barreira é o rate limit por IP (60 extrações/hora).
> - O usuário criado no banco continua lá e não é usado por ninguém.
>
> **Para reativar:** troque as duas constantes para `true`, garanta que existe
> um usuário no banco (`node scripts/criar-usuario.mjs ...`), e publique. As
> duas precisam mudar juntas — só o frontend faz o login falhar sempre, só o
> backend tranca o sistema inteiro.

## O que mudou

O sistema deixou de ser um app estático sem autenticação. Agora existe login de
verdade, sessão no servidor e autorização por perfil.

| Antes | Depois |
| --- | --- |
| Qualquer pessoa com o link entrava | Login com e-mail e senha obrigatório |
| Trocava de usuário num `<select>` no topo | Sessão emitida pelo servidor; o perfil vem do banco |
| `/api/ia/extrair` e `/api/ia/uso` abertos | Exigem sessão; `uso` é só para Administrador |
| Sem limite de chamadas | Rate limit no login (por IP) e na IA (por usuário) |
| Sem registro de acesso | Tabela `auditoria` com login, logout, falhas e bloqueios |
| Sem cabeçalhos de segurança | CSP, HSTS, `X-Frame-Options`, `nosniff`, `Permissions-Policy` |
| CORS liberado para o Pages | Apenas `localhost` de desenvolvimento |

## Como as senhas são guardadas

PBKDF2-SHA256, **12.000 iterações**, salt de 16 bytes por usuário, saída de 256
bits. A senha em si nunca é gravada nem trafega para lugar nenhum além do
`POST /api/auth/login`. A comparação do hash é feita em tempo constante para não
vazar, pelo tempo de resposta, quantos caracteres bateram.

> **Concessão consciente.** O OWASP recomenda 210.000 iterações para
> PBKDF2-SHA256. Esse valor custa ~43 ms de CPU e o plano gratuito do Cloudflare
> Workers dá 10 ms por requisição — com 210k o login simplesmente falhava com
> erro 1101. Com 12k o cálculo cai para ~2,5 ms e cabe.
>
> O custo disso é real: se o banco vazar, quebrar as senhas por força bruta fica
> mais barato para um atacante. O que segura a barra aqui é o resto do conjunto —
> salt por usuário, bloqueio após 5 tentativas, rate limit por IP e exigência de
> senha longa. Não é equivalente a 210k, é uma troca aceita para caber no plano.
>
> A coluna `iteracoes` é por usuário justamente para permitir voltar atrás: ao
> migrar para o Workers Paid, suba `ITERACOES_PBKDF2` em `worker/auth.js` e
> `ITERACOES` em `scripts/criar-usuario.mjs`, depois recrie as senhas. As antigas
> continuam validando enquanto a migração não termina.

O cookie de sessão é `HttpOnly`, `Secure` e `SameSite=Strict` — o JavaScript da
página não consegue lê-lo, então um XSS não rouba a sessão. No banco fica só o
SHA-256 do token: quem vazar a tabela `sessoes` não consegue reconstruir os
cookies em circulação.

## Proteções ativas

- **Força bruta**: 5 tentativas erradas bloqueiam a conta por 15 minutos; 10
  tentativas do mesmo IP em 15 minutos travam a rota de login (HTTP 429).
- **Enumeração de usuários**: e-mail inexistente e senha errada devolvem
  exatamente a mesma mensagem e o mesmo status.
- **Custo de IA**: 60 extrações por usuário por hora, com teto de ~6 MB por
  arquivo e 100 mil caracteres por texto.
- **Identidade do consumo**: o nome que vai para o log de uso vem da sessão, não
  do corpo da requisição — ninguém lança consumo no nome de outra pessoa.
- **Troca de senha**: revoga todas as outras sessões do usuário e emite uma nova.
- **Erros da OpenAI**: não são repassados crus ao cliente, para não vazar detalhe
  de conta ou chave.

## Testes executados

Verificado contra um Worker rodando local com D1:

- Rotas de IA sem sessão → 401
- Token de sessão forjado → 401
- Senha errada e e-mail inexistente → mesma resposta 401
- 5ª tentativa errada → 423, e a senha correta continua barrada durante o bloqueio
- 11ª tentativa de login do mesmo IP → 429
- Vendedor em `/api/ia/uso` → 403; Administrador → 200
- Logout → a sessão para de valer
- Troca de senha → a outra sessão do mesmo usuário cai para 401 e a senha antiga deixa de funcionar
- Hash do `scripts/criar-usuario.mjs` idêntico ao derivado pelo Worker

## Implantação

O deploy foi movido de GitHub Pages para Cloudflare Workers. **Isso não é
opcional**: Pages só serve arquivo estático, e sem servidor o login nunca
conclui — o app fica inacessível.

```bash
# 1. Schema no banco
npx wrangler d1 execute ayamo_ia_uso --remote --file=./worker/schema.sql

# 2. Chave da OpenAI como secret do Worker
npx wrangler secret put OPENAI_API_KEY

# 3. Primeiro administrador
node scripts/criar-usuario.mjs "voce@ayamo.com" "Seu Nome" "Administrador" > admin.sql
npx wrangler d1 execute ayamo_ia_uso --remote --file=./admin.sql
rm admin.sql   # contém o hash da senha

# 4. Publicar
npm run build && npx wrangler deploy
```

No GitHub, configure os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`
para o workflow publicar sozinho a cada push na `main`.

### Desenvolvimento local

```bash
npx wrangler d1 execute ayamo_ia_uso --local --file=./worker/schema.sql
node scripts/criar-usuario.mjs "dev@ayamo.com" "Dev" "Administrador" > /tmp/dev.sql
npx wrangler d1 execute ayamo_ia_uso --local --file=/tmp/dev.sql
npx wrangler dev --local --port 8788
```

Para rodar o Vite separado, aponte o front para o Worker com
`VITE_API_URL=http://127.0.0.1:8788` em um `.env.local`.

## O que ainda NÃO está protegido

**Os dados de negócio continuam no `localStorage` do navegador.** Ofertas,
propostas, empresas, contatos, contratos e limites de crédito são gravados no
dispositivo do usuário, em texto claro, e qualquer script rodando na página os
alcança. O login impede um estranho de abrir o sistema, mas **não** protege esses
dados em si.

Enquanto essa migração não acontecer:

- Cada máquina tem sua própria cópia dos dados; não há uma verdade central.
- Apagar os dados do navegador apaga o CRM daquela pessoa.
- As permissões por perfil no frontend continuam sendo apenas de interface: quem
  editar o `localStorage` muda o que quiser na própria cópia. Só o que passa pela
  API é verificado no servidor.

A migração das coleções para o D1, com autorização por perfil em cada operação,
é o próximo passo e está pendente.
