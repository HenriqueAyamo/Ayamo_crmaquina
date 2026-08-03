// Cliente do backend de IA (Cloudflare Worker) — a chave da OpenAI nunca fica no frontend,
// só o Worker fala com a OpenAI. Ver worker/index.js.
const API_BASE_URL = 'https://ayamo-sales-project.ti-ayamoo.workers.dev'

async function chamarWorker(caminho, opcoes) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, opcoes)
  const dados = await resposta.json()
  if (!resposta.ok) throw new Error(dados.erro || 'Falha ao falar com o servidor de IA.')
  return dados
}

export function extrairOfertaIA({ texto, imagemBase64, mimeType, tipo, usuario }) {
  return chamarWorker('/api/ia/extrair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, imagemBase64, mimeType, tipo, usuario }),
  })
}

export function obterUsoIA() {
  return chamarWorker('/api/ia/uso', { method: 'GET' })
}

export function arquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result).split(',')[1])
    leitor.onerror = () => reject(leitor.error)
    leitor.readAsDataURL(arquivo)
  })
}
