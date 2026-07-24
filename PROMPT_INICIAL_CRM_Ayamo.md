# Prompt inicial — Protótipo CRM "Máquina de Vendas" (Ayamo Global Foods)

> Cole este arquivo inteiro na primeira mensagem do Claude Code dentro do VSCode.
> Ele descreve contexto, stack, estrutura e ordem de execução.

---

## 1. Contexto

Você vai construir o **protótipo de telas** de um CRM interno da Ayamo Global Foods, chamado "Máquina de Vendas". A empresa faz trading de proteína animal e seafood: compra de fornecedores e revende para clientes no exterior.

O sistema cobre o ciclo: **oferta do fornecedor → proposta ao cliente → contraproposta → renegociação → fechamento com PO e Proforma Invoice**.

**Nesta fase o objetivo é apenas validar a navegação e o layout das telas com os usuários finais (compradores, vendedores, controladoria). Não há backend nem banco de dados.** Todos os dados vêm de arquivos de mock em memória.

**Perfil dos usuários:** pessoas de escritório que usarão isso o dia inteiro. A interface precisa ser direta, sem enfeite, com tabelas legíveis e formulários óbvios. Nada de animação, dashboard decorativo ou jargão técnico na tela.

**Idioma:** todo o conteúdo visível ao usuário em **português do Brasil**. Nomes de produtos e termos de comércio exterior permanecem em inglês (chicken leg quarter, incoterm, shipment, Proforma Invoice).

---

## 2. Stack obrigatória

| Camada | Escolha |
|---|---|
| Build | Vite |
| Framework | React 18 (JavaScript, **sem TypeScript**) |
| Roteamento | react-router-dom v6 |
| Estilo | Tailwind CSS |
| Ícones | lucide-react |
| Estado | React `useState` / `useContext` — **sem Redux, Zustand ou similar** |
| Dados | arquivos JS de mock em `src/data/` |

**Não instale nada além disso.** Sem biblioteca de componentes (MUI, Ant, shadcn), sem biblioteca de gráficos, sem date-picker externo, sem lib de formulários. Se precisar de um componente, escreva-o à mão em `src/components/`.

---

## 3. Estrutura de pastas

```
src/
  main.jsx
  App.jsx                  → define as rotas
  DataContext.jsx          → estado central: carrega os mocks e expõe criar/editar/inativar
  theme.css                → variáveis de cor da Ayamo (ÚNICO lugar com cor definida)
  layout/
    Shell.jsx              → menu lateral fixo + área de conteúdo
    Sidebar.jsx
    Topbar.jsx             → nome do usuário logado (mock) e perfil ativo
  components/
    PageHeader.jsx         → título da página + botão de ação primária
    DataTable.jsx          → tabela genérica (colunas, dados, ação por linha)
    FilterBar.jsx          → linha de filtros acima das tabelas
    StatusBadge.jsx        → etiqueta colorida de status
    Modal.jsx              → modal simples para formulários
    Field.jsx              → label + input padronizado
    EmptyState.jsx
  pages/
    Inicio.jsx
    Compras.jsx
    ComprasDetalhe.jsx
    Vendas.jsx
    VendasDetalhe.jsx
    Empresas.jsx
    EmpresasDetalhe.jsx    → dados da empresa + contatos vinculados
    Contatos.jsx           → consulta consolidada, somente leitura
    CadastrosGerais.jsx    → abas: divisões, famílias, produtos, categorias
    Usuarios.jsx           → colaboradores Ayamo + hierarquia de aprovação
    Documentos.jsx
  utils/
    formato.js             → formatação de valor por moeda e de datas
    conversao.js           → conversão entre unidades de peso
  data/
    ofertas.js
    propostas.js
    empresas.js
    contatos.js
    divisoes.js
    familias.js
    produtos.js
    categoriasContato.js
    usuarios.js            → colaboradores Ayamo + suas responsabilidades por divisão
    unidades.js            → moedas e unidades de medida (lista única)
    cambio.js              → taxas de câmbio de mock
```

---

## 4. Tema e cores

Crie `src/theme.css` com variáveis CSS e configure o Tailwind para consumi-las. **Nenhum arquivo além deste pode conter um valor de cor literal.**

Valores provisórios (serão substituídos pelos oficiais da Ayamo depois):

```css
:root {
  --ayamo-primary:   #1F3864;  /* azul institucional — menu, cabeçalhos, ação primária */
  --ayamo-accent:    #B08D57;  /* dourado — destaques e ações secundárias */
  --ayamo-bg:        #F7F8FA;  /* fundo da área de conteúdo */
  --ayamo-surface:   #FFFFFF;  /* cards e tabelas */
  --ayamo-border:    #E2E5EA;
  --ayamo-text:      #1A1D22;
  --ayamo-text-mut:  #6B7280;
  --ayamo-success:   #16794C;
  --ayamo-warning:   #B45309;
  --ayamo-danger:    #B42318;
}
```

---

## 5. Padrões visuais

- Menu lateral fixo, largura 220px, fundo `--ayamo-primary`, item ativo destacado. Itens, nesta ordem: Início, Compras, Vendas, Empresas, Contatos, Cadastros, Usuários, Documentos.
- Área de conteúdo com fundo `--ayamo-bg`, padding 24px.
- Toda página de listagem segue o mesmo esqueleto: `PageHeader` → `FilterBar` → `DataTable`.
- Tabelas: cabeçalho fixo, linhas com borda inferior de 1px, hover cinza claro, fonte 13–14px.
- Formulários abrem em `Modal`, nunca em página separada.
- Botões: ação primária sólida em `--ayamo-primary`; secundária com borda e fundo branco.
- Datas no formato `dd/mm/aaaa`.
- Sem sombras fortes, sem gradiente, sem canto arredondado maior que 8px.
- Nada de emoji na interface.

---

## 5.1 Unidades de medida e moedas — regra obrigatória

**Nenhum valor no sistema é apenas um número.** Todo preço é sempre a combinação de três coisas: valor + moeda + unidade de medida. Isso vale para ofertas de compra, propostas de venda, contrapropostas e documentos.

Crie `src/data/unidades.js` exportando as listas completas abaixo, e use-as em **todo** seletor de moeda ou unidade do sistema. Não escreva essas listas inline em nenhuma tela.

**Moedas:**

| Código | Símbolo | Nome | Formato |
|---|---|---|---|
| BRL | R$ | Real | `R$ 1.180,00` |
| USD | US$ | Dólar americano | `US$ 1,180.00` |
| EUR | € | Euro | `€ 1.180,00` |
| GBP | £ | Libra esterlina | `£ 1,180.00` |
| CNY | ¥ | Yuan | `¥ 1,180.00` |

**Unidades de peso:** `kg` (quilograma), `g` (grama), `ton` (tonelada métrica), `lb` (libra / pound).

**Unidades de embalagem:** `caixa`, `pallet`, `container`, `unidade`.

**Regras de implementação:**

1. Todo preço é exibido como **moeda por unidade**: `US$ 1,180.00 / ton`, `R$ 12,40 / kg`, `£ 0.85 / lb`. Nunca mostre o número sozinho.
2. A formatação numérica segue a moeda, não o idioma da interface — use `toLocaleString` com o locale correspondente (`pt-BR` para BRL, `en-US` para USD/GBP, `de-DE` para EUR). Crie um helper `formatarValor(valor, moeda)` em `src/utils/formato.js` e use-o em todas as telas.
3. No formulário de oferta e no de proposta, moeda e unidade são **campos obrigatórios**, lado a lado com o campo de valor.
4. Nas tabelas, moeda e unidade aparecem em coluna própria ou junto ao valor — nunca omitidas por serem "óbvias".
5. `src/utils/conversao.js` deve conter uma tabela de conversão entre as unidades de peso (`1 ton = 1000 kg`, `1 kg = 1000 g`, `1 lb = 0,45359237 kg`) e uma função `converterPeso(valor, de, para)`.

**Câmbio (ponto ainda não decidido pelo cliente):** compra e venda podem ocorrer em moedas diferentes, então a margem exige conversão. Nesta fase, implemente da forma mais simples possível:

- `src/data/cambio.js` com taxas fixas de mock (ex.: `USD_BRL: 5.42`, `EUR_USD: 1.08`).
- Função `calcularMargem(itemCompra, itemVenda)` que converte ambos para USD antes de subtrair.
- Na tela de detalhe da proposta, quando compra e venda estiverem em moedas diferentes, exiba abaixo da margem a linha: `Margem calculada em USD — taxa USD/BRL 5,42 de 24/07/2026`.

Isso deixa visível para o usuário que existe uma conversão acontecendo, o que é justamente o que precisamos validar com eles antes de definir a regra oficial.

---

## 6. Telas a construir

### 6.1 Início
Painel simples com 4 cartões numéricos (ofertas ativas, propostas em negociação, propostas aguardando aprovação de margem, documentos emitidos no mês) e uma tabela com as últimas 10 movimentações. Sem gráficos nesta fase.

### 6.2 Compras (lista de ofertas)
- Colunas: Código, Produto, Divisão, Fornecedor, Preço de custo, Quantidade, Unidade, Status, Data.
- Filtros: busca por produto, divisão, fornecedor, status.
- Status possíveis: `Disponível`, `Em revisão`, `Esgotada`, `Expirada`.
- Códigos seguem o padrão `OF-0234`; revisões aparecem como `OF-0234-R1`, listadas logo abaixo da oferta original e visualmente indentadas.
- Botão "Nova oferta" abre modal com os campos da oferta e um botão desabilitado "Importar de imagem (IA)" apenas indicando o fluxo futuro.

### 6.3 Detalhe da oferta
Dados da oferta + histórico de revisões em linha do tempo vertical (versão, preço de custo, data, quem registrou, observação).

### 6.4 Vendas (lista de propostas)
- Colunas: Número, Cliente, Vendedor, Itens, Valor total, Margem %, Status, Data de envio.
- Filtros: cliente, vendedor, status.
- Status: `Rascunho`, `Enviada`, `Em negociação`, `Aguardando aprovação`, `Aceita`, `Recusada`, `Expirada`.
- Coluna Margem % com cor: verde acima do mínimo, âmbar próximo do mínimo, vermelho abaixo.
- Botão "Nova proposta" abre modal em duas etapas: escolher cliente → selecionar ofertas e quantidades.

### 6.5 Detalhe da proposta — **tela mais importante do protótipo**
Três blocos:
1. **Cabeçalho** — cliente, vendedor, status, data.
2. **Itens** — por linha: produto, quantidade, preço de custo, preço de venda, margem calculada. Deixe explícito que comprador e vendedor veem colunas diferentes (adicione um seletor de perfil no topo que alterna a visão entre "Vendedor" e "Comprador" e esconde a coluna correspondente).
3. **Histórico de negociação** — lista cronológica de rodadas: quem pediu o quê, preço, quantidade, data/hora, observação. Cada rodada é uma entrada nova, nunca sobrescreve a anterior. Botões: "Registrar contraproposta do cliente", "Escalar para comprador", "Solicitar aprovação do diretor", "Aceitar e fechar".
4. Ao clicar em "Aceitar e fechar", mostre um resumo com os valores travados e dois botões de geração de documento (podem ser mock, apenas abrindo um modal com o preview do documento).

### 6.6 Empresas
Lista com nome, país, responsável Ayamo, moeda padrão de negociação, limite de crédito, crédito utilizado, situação.

**O cadastro de contatos acontece dentro da empresa, não em tela separada.** No detalhe da empresa, uma aba ou bloco "Contatos" lista as pessoas vinculadas com botão "Adicionar contato" que abre modal com: nome, cargo, telefone, e-mail e categorias (multisseleção). Cada linha tem editar e remover.

### 6.7 Contatos (consulta consolidada)
Tela apenas de **consulta e busca** — mostra todos os contatos de todas as empresas num lugar só, para quando o usuário lembra o nome da pessoa mas não da empresa. Colunas: nome, empresa, cargo, telefone, e-mail, categorias. Clicar na linha leva ao detalhe da empresa correspondente. **Não há botão de criar contato aqui** — o cadastro é sempre pela empresa.

### 6.8 Cadastros gerais
Tela única com abas internas, agrupando as tabelas de apoio que hoje alimentam os seletores do sistema. Cada aba é uma listagem simples com cadastrar, editar e inativar.

**Aba "Divisões"** — categoria maior. Campos: nome, situação. Ex.: `Seafood`, `Meat`, `Animal Nutrition`.

**Aba "Famílias"** — subgrupo, sempre vinculado a uma divisão. Campos: nome, divisão (seletor), situação. Ex.: `Chicken leg` pertence a `Meat`; `Shrimp` pertence a `Seafood`.

**Aba "Produtos"** — campos: nome, apelido, família (seletor), situação. A divisão é derivada automaticamente da família escolhida e exibida como campo somente leitura — não se digita divisão no produto.

**Aba "Categorias de contato"** — campos: nome, situação. Ex.: `Comercial`, `TI`, `Controladoria`, `Financeiro`, `Logística`. A categoria `Comercial` é a que define quem recebe os disparos de WhatsApp e é citada nominalmente nos e-mails, então marque-a de forma diferenciada na lista.

**Aba "Moedas e unidades"** — somente leitura nesta fase, apenas exibindo as listas da seção 5.1 para o usuário conferir o que existe.

**Regra importante:** todos os seletores de divisão, família, produto e categoria em qualquer tela do sistema devem ler dessas listas. Nenhuma tela pode ter opção escrita direto no código. Se o usuário cadastrar uma divisão nova aqui, ela precisa aparecer imediatamente nos filtros de Compras e Vendas.

### 6.9 Usuários e hierarquia
Cadastro dos colaboradores da Ayamo que usam o sistema — **é diferente de contato**, que é pessoa do cliente.

Campos: nome, e-mail, perfil (`Comprador`, `Vendedor`, `Diretor`, `Financeiro`, `Controladoria`, `Administrador`), situação.

Abaixo, um bloco **"Responsabilidades"** onde se define, por linha, a combinação: **divisão + diretor aprovador**. Um mesmo vendedor pode ter várias linhas — por exemplo, atuar em `Seafood` respondendo ao diretor A e em `Meat` respondendo ao diretor B. É essa tabela que o sistema consulta quando uma proposta fica abaixo da margem mínima e precisa saber para quem escalar.

### 6.10 Documentos
Lista de POs e Proforma Invoices emitidos: tipo, número, proposta/oferta de origem, destinatário, valor, moeda, data, status de envio.

---

## 7. Dados de mock

Cada arquivo em `src/data/` exporta um array com **no mínimo 12 registros realistas**. Use nomes de produtos e divisões reais do setor:

- Divisões: `Seafood`, `Meat`, `Animal Nutrition`
- Famílias: `Chicken leg`, `Frozen chicken`, `Beef cuts`, `Shrimp`, `Fish fillet`
- Produtos: `Chicken leg quarter (CLQ)`, `Frozen whole chicken`, `Beef forequarter`, `Frozen shrimp 16/20`, `Tilapia fillet`
- Unidades: varie entre `ton`, `kg`, `lb`, `caixa` e `container` ao longo dos registros
- Moedas: varie entre `USD`, `BRL`, `EUR` e `GBP` — inclua pelo menos três casos em que a moeda da compra é diferente da moeda da venda
- Fornecedores e clientes: use nomes fictícios plausíveis de empresas de trading internacional.

Pelo menos uma proposta no mock precisa estar **em negociação com três rodadas registradas e margem abaixo do mínimo**, para demonstrar o fluxo completo da tela 6.5.

Em `usuarios.js`, inclua pelo menos um vendedor com **duas responsabilidades em divisões diferentes e diretores diferentes** — é o caso que justifica a tela 6.9.

Em `familias.js` e `divisoes.js`, garanta que a hierarquia feche: toda família aponta para uma divisão existente, e todo produto aponta para uma família existente.

---

## 8. Ordem de execução

Execute nesta ordem e **pare para eu revisar ao final de cada etapa**:

1. Scaffold do projeto (Vite + React + Tailwind), `theme.css`, e o `Shell` com menu lateral navegável entre todas as rotas (páginas ainda vazias, só o título).
2. Componentes reutilizáveis (`DataTable`, `FilterBar`, `StatusBadge`, `Modal`, `Field`, `PageHeader`).
3. `src/data/unidades.js`, `src/data/cambio.js`, `src/utils/formato.js` e `src/utils/conversao.js` — a base de moedas e unidades vem **antes** dos demais mocks, porque todos dependem dela.
4. `DataContext.jsx` e os demais arquivos de mock em `src/data/`.
5. Cadastros gerais (divisões, famílias, produtos, categorias) — vêm antes de Empresas porque os seletores dependem deles.
6. Empresas (com contatos dentro do detalhe), Contatos consolidado e Usuários/hierarquia.
7. Tela de Compras + detalhe da oferta.
8. Tela de Vendas + detalhe da proposta (a mais importante — capriche).
9. Início e Documentos.

---

## 9. Restrições

- Não crie backend, API, banco de dados nem autenticação real.
- **Os cadastros precisam funcionar.** Criar, editar e inativar registros deve alterar o estado da aplicação e refletir imediatamente na lista e em todos os seletores que consomem aquela tabela. Formulário que abre, fecha e não muda nada não serve — é justamente o cadastro que os usuários vão testar. Mantenha os dados num `DataContext` (React Context) inicializado a partir dos arquivos de `src/data/`, e faça todas as telas lerem e escreverem por ele.
- Persistência entre recarregamentos fica **fora do escopo por enquanto**: ao dar F5, os dados voltam ao mock inicial. Se depois quisermos manter, adicionamos `localStorage` no `DataContext` sem mexer em nenhuma tela.
- **Contatos são criados exclusivamente dentro do detalhe da empresa.** A tela de Contatos é somente consulta e não pode ter botão de novo contato.
- Não gere PDF de verdade; o preview do documento é um modal em HTML.
- Não escreva comentários explicativos óbvios no código, mas nomeie variáveis e componentes em inglês e o conteúdo visível em português.
- Não crie arquivo com mais de 300 linhas; quebre em componentes.
- Antes de instalar qualquer dependência fora da lista da seção 2, pergunte.

---

## 10. Ao final

Rode o projeto, confirme que todas as rotas abrem sem erro de console e me apresente:
- a lista de arquivos criados,
- o comando para rodar localmente,
- os pontos onde você tomou alguma decisão que eu deveria revisar.
