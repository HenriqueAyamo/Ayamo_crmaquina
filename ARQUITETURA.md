# Arquitetura — divisões como módulos

## O modelo

Cada divisão (Seafood, Meat, Animal Nutrition) é um **módulo** do sistema. A
pessoa abre um módulo por vez e enxerga só o movimento dele.

| O que | Escopo | Por quê |
| --- | --- | --- |
| Ofertas, propostas, demandas, claims | **Por divisão** | É onde estão preço, margem e negociação — o que precisa de sigilo entre times |
| Empresas, contatos, fretes | **Global** | Aurora vende chicken e pork; um armador atende todas. Duplicar criaria cadastros concorrentes |
| Produtos, famílias | **Por divisão** (via família) | Produto pertence a uma família, que pertence a uma divisão |
| Usuários, dados da Ayamo, categorias | **Global** | Configuração do sistema |

## Divisão gravada, não derivada

`ofertas.divisaoId` é gravado no registro. A alternativa seria derivar
`oferta → produtoId → familia → divisaoId` a cada leitura, e ela foi descartada
por dois motivos:

1. **Mover um produto de família reescreveria a divisão de todo o histórico.** O
   dono de um dado não pode mudar por efeito colateral de um cadastro.
2. **Filtrar exigiria dois joins em memória** a cada tela. No Postgres, `divisaoId`
   é a coluna que vai ser indexada.

Registros criados antes desse carimbo são migrados uma vez ao abrir o sistema
(`DataContext`), derivando a divisão do produto. Registro que continue sem
divisão aparece em todos os módulos — é dado antigo, e escondê-lo seria pior que
mostrá-lo.

## Quem vê o quê

`utils/escopoDivisao.js` concentra a regra:

- **Administrador, Financeiro, Controladoria** → todas as divisões (funções transversais).
- **Comprador, Vendedor, Diretor** → as divisões em `usuario.responsabilidades`.
- **Sem responsabilidade cadastrada** → todas, provisoriamente. Travar o acesso
  deixaria a pessoa sem sistema; o aviso de cadastro incompleto é quem cobra o acerto.

## Onde o escopo é aplicado

`DivisaoContext` expõe `noEscopo(itens)`, usado por Compras, Vendas, Demandas e
Claims. A importação carimba a divisão ativa, restringe o matching de produto aos
produtos do módulo e cria produtos novos em famílias do módulo — senão importar
no Seafood poderia vincular um produto de Meat.

**Limitação atual, importante:** o filtro roda no cliente. Com os dados no
`localStorage`, quem abrir o DevTools vê tudo. Hoje isso é organização de
trabalho, **não** é sigilo. Vira sigilo de verdade quando o filtro migrar para o
servidor — ver a camada de repositório abaixo.

## Caminho para o Postgres

O bloqueio não é o `localStorage`: são os **~210 pontos do código que fazem
`colecao.items.filter(...)`**. Toda tela assume o array inteiro em memória, e
isso não sobrevive a uma base real.

O plano é uma **camada de repositório**: as telas passam a chamar
`ofertas.listar({ filtros })` em vez de varrer `items`. Por trás, dois
adaptadores com a mesma interface — `local` (localStorage, hoje) e `api`
(Worker → D1 → Postgres, depois).

O escopo de divisão passa a morar **dentro do adaptador**, não em cada tela.
Assim é impossível uma tela nova esquecer de aplicar o filtro — que é a diferença
entre segurança e decoração.

A migração é coleção por coleção, começando por ofertas e propostas. O schema é
escrito em SQL comum entre SQLite e Postgres para a troca não exigir reescrita.

## Herança de tabelas: descartada

Foi considerado usar herança de tabelas (`CREATE TABLE ... INHERITS`) para
expressar "tabelas globais e o que é compartilhado herda delas". Descartado por
dois motivos concretos:

1. **SQLite não tem herança de tabelas.** O D1 é SQLite, então modelar com
   `INHERITS` inviabilizaria a fase Cloudflare e obrigaria a pular direto para o
   Postgres.
2. **No Postgres, `INHERITS` tem armadilhas conhecidas.** Índices e constraints
   não são herdados — um `UNIQUE` no pai não vale entre os filhos —, e chave
   estrangeira apontando para o pai não enxerga as linhas dos filhos. A
   documentação do Postgres encaminha para particionamento declarativo ou
   modelagem relacional comum.

**No lugar dela**, o escopo é uma coluna só:

```sql
divisao_id INTEGER NULL REFERENCES divisoes(id)
-- NULL  = global (empresas, contatos, fretes)
-- valor = da divisão (ofertas, propostas, demandas, claims)
```

Mesma regra em SQLite e Postgres, com índice em `(divisao_id, ...)`. Para
Cliente vs. Fornecedor, o discriminador `tipo` que já existe é melhor que duas
tabelas: quase todas as colunas são compartilhadas. Se aparecer especialização
com colunas realmente distintas, o padrão é tabela base + tabela de
especialização compartilhando o id.

## Requisitos para migrar do localStorage para o D1

Estado do banco hoje: 77,8 kB, 5 tabelas. Espaço não é restrição.

1. Schema das tabelas de negócio em SQL comum entre SQLite e Postgres.
2. API CRUD no Worker, com o filtro de divisão aplicado **no servidor**.
3. Camada de repositório no frontend (ver acima) — o trabalho maior.
4. **Autenticação ligada de novo.** É o requisito que trava os outros: para o
   servidor decidir o que alguém pode ver, precisa saber quem está perguntando.
   Com `AUTH_HABILITADA = false` toda requisição é anônima e o escopo por divisão
   continua sendo decoração.
5. Definir qual cópia do `localStorage` vira a verdade — hoje cada pessoa tem a
   sua, possivelmente divergentes.
6. Tratar concorrência: com banco único, duas pessoas editando a mesma oferta
   passam a se sobrescrever. Hoje isso não existe porque cada um tem sua cópia.

---

# Fila de desenvolvimento

## 1. Visibilidade de empresa por quem cadastrou

**Pedido:** quando um trader cadastra um cliente ou empresa, só ele e o gestor
dele enxergam esse cadastro.

**Tensão com o modelo atual:** hoje empresas são globais, e isso foi decidido
justamente para não duplicar Aurora em cada divisão. As duas coisas convivem, mas
exigem um modelo mais fino:

- `criadoPorId` e `visibilidade` (`privada` | `divisao` | `global`) no cadastro
  de empresa.
- Quem vê uma empresa privada: o criador, o diretor dele
  (`responsabilidades[].diretorId`) e os perfis transversais.
- **Decisão pendente:** o que acontece quando outro trader tenta cadastrar a
  mesma empresa que já existe como privada de um colega? Se o sistema disser
  "já existe", vaza a carteira do outro. Se deixar duplicar, cria dois cadastros
  da mesma empresa. Provavelmente a saída é criar duplicado e sinalizar só para
  o Administrador, que consolida.
- Sem isso resolvido, implementar só a visibilidade cria um vazamento sutil pela
  checagem de duplicidade.

## 2. Tradução dos modais

Páginas estão em PT/EN/ES. Faltam ~20 modais: nova oferta, revisão, editar
empresa, novo frete, nova demanda, novo claim, fechamento, Proforma, PO.

## 3. Camada de repositório

Ver acima. Pré-requisito real do Postgres e do sigilo entre divisões.

## 4. Reativar a autenticação

`AUTH_HABILITADA = false` em dois lugares. Ver `SEGURANCA.md`.
