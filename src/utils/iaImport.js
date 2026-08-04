// Cliente do backend de IA (Cloudflare Worker) — a chave da OpenAI nunca fica no frontend,
// só o Worker fala com a OpenAI. Ver worker/index.js.
//
// Em produção o Worker serve o próprio frontend, então o caminho relativo basta e o cookie
// de sessão viaja como same-origin. VITE_API_URL só é usada no desenvolvimento local.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function chamarWorker(caminho, opcoes) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, { ...opcoes, credentials: 'include' })
  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    if (resposta.status === 401) throw new Error('Sua sessão expirou. Entre novamente.')
    throw new Error(dados.erro || 'Falha ao falar com o servidor de IA.')
  }
  return dados
}

// O usuário não vai mais no corpo: quem registra o uso é a sessão no servidor,
// senão qualquer um poderia lançar o consumo no nome de outra pessoa.
export function extrairOfertaIA({ texto, arquivoBase64, mimeType, nomeArquivo, tipo, produtosCatalogo, fornecedoresCatalogo }) {
  return chamarWorker('/api/ia/extrair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, arquivoBase64, mimeType, nomeArquivo, tipo, produtosCatalogo, fornecedoresCatalogo }),
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
