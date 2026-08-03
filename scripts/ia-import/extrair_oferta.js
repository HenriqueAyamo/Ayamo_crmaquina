// Prototipo de linha de comando: testa a extracao de uma oferta bagunçada (texto ou imagem)
// pros mesmos campos que o importador de Compras ja reconhece (ver ALIASES em
// src/pages/compras/ImportarPlanilha.jsx). Usa Structured Outputs (JSON Schema) em vez de
// pedir uma tabela em texto solto -- um teste inicial pedindo TSV mostrou o modelo desalinhando
// colunas silenciosamente quando um campo ficava vazio (cada célula é só uma posição no texto,
// sem nome). Com JSON Schema cada campo tem chave, então não tem como desalinhar.

import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

// Mesmas chaves canonicas que ALIASES em ImportarPlanilha.jsx entende (produto, fornecedor,
// preco, quantidade, moeda, incoterm, embarque, destino, validade, prazoPagamento, data,
// trader, comentarios, ref, brand) -- a ideia e que a saida da IA va direto pro mesmo pipeline,
// sem tradução extra.
const SCHEMA_OFERTA = {
  type: 'object',
  properties: {
    ref: { type: ['string', 'null'] },
    produto: { type: ['string', 'null'] },
    fornecedor: { type: ['string', 'null'] },
    brand: { type: ['string', 'null'] },
    moeda: { type: ['string', 'null'] },
    preco: { type: ['number', 'null'] },
    quantidade: { type: ['number', 'null'] },
    incoterm: { type: ['string', 'null'] },
    embarqueDe: { type: ['string', 'null'], description: 'data dd/mm/aaaa' },
    embarqueAte: { type: ['string', 'null'], description: 'data dd/mm/aaaa' },
    destino: { type: ['string', 'null'] },
    sif: { type: ['string', 'null'] },
    validadeOferta: { type: ['string', 'null'], description: 'data dd/mm/aaaa, so se explicita' },
    prazoPagamento: { type: ['string', 'null'] },
    trader: { type: ['string', 'null'] },
    comentarios: { type: ['string', 'null'] },
  },
  required: [
    'ref', 'produto', 'fornecedor', 'brand', 'moeda', 'preco', 'quantidade', 'incoterm',
    'embarqueDe', 'embarqueAte', 'destino', 'sif', 'validadeOferta', 'prazoPagamento', 'trader', 'comentarios',
  ],
  additionalProperties: false,
}

const SCHEMA = {
  type: 'object',
  properties: {
    ofertas: { type: 'array', items: SCHEMA_OFERTA },
  },
  required: ['ofertas'],
  additionalProperties: false,
}

const SYSTEM_PROMPT = `Você transforma qualquer oferta de proteína animal (frango, suíno, bovino ou peixe) recebida em
formato livre (texto de WhatsApp, e-mail, foto de planilha, foto de lista de preço) numa lista estruturada de ofertas.

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
- trader e fornecedor: use exatamente o nome como aparece na oferta, sem abreviar.`

const EXEMPLO_EMBUTIDO = `oi bom dia, tenho essa oferta pra fechar ainda essa semana:
peito de frango congelado, embalagem bulk 20kg, marca Aurora
preço 1180 usd a tonelada, CFR
saindo semana que vem, tipo dia 15/09 até 30/09
pra Tema e Abidjan
fornecedor: Aurora
trader: Lucas
2 contêineres
sif 1234, validade da oferta ate sexta`

function extensaoParaMime(caminho) {
  const ext = extname(caminho).toLowerCase()
  const mapa = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }
  return mapa[ext] ?? 'image/png'
}

async function main() {
  const args = process.argv.slice(2)
  const idxTexto = args.indexOf('--texto')
  const idxImagem = args.indexOf('--imagem')

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OPENAI_API_KEY não encontrada. Rode com: node --env-file=.env scripts/ia-import/extrair_oferta.js')
    process.exit(1)
  }

  const conteudoUsuario = []

  if (idxImagem !== -1) {
    const caminho = args[idxImagem + 1]
    const buffer = readFileSync(caminho)
    const base64 = buffer.toString('base64')
    const mime = extensaoParaMime(caminho)
    conteudoUsuario.push({ type: 'input_text', text: 'Extraia as ofertas presentes nesta imagem.' })
    conteudoUsuario.push({ type: 'input_image', image_url: `data:${mime};base64,${base64}` })
  } else {
    const texto = idxTexto !== -1 ? args[idxTexto + 1] : EXEMPLO_EMBUTIDO
    conteudoUsuario.push({ type: 'input_text', text: texto })
  }

  const resposta = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5.4-mini',
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: conteudoUsuario },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'ofertas_extraidas',
          schema: SCHEMA,
          strict: true,
        },
      },
    }),
  })

  const dados = await resposta.json()
  if (dados.error) {
    console.error('Erro da API:', dados.error.message)
    process.exit(1)
  }

  const texto = dados.output?.find((o) => o.type === 'message')?.content?.find((c) => c.type === 'output_text')?.text
  if (!texto) {
    console.error('Resposta inesperada:', JSON.stringify(dados, null, 2))
    process.exit(1)
  }

  const { ofertas } = JSON.parse(texto)

  console.log('--- JSON estruturado gerado pela IA ---\n')
  console.log(JSON.stringify(ofertas, null, 2))

  console.log('\n--- Conferido como tabela (', ofertas.length, 'linha(s) de oferta ) ---\n')
  console.table(ofertas)

  console.log('\nUso de tokens:', dados.usage)
}

main()
