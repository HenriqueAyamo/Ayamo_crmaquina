// Bloqueia javascript:/data:text/html e outros esquemas perigosos — só permite http(s) e
// data:image/* (para logos coladas em base64).
export function sanitizarUrlImagem(url) {
  const valor = (url ?? '').trim()
  if (!valor) return ''
  if (/^https?:\/\//i.test(valor)) return valor
  if (/^data:image\//i.test(valor)) return valor
  return ''
}
