export function textoPlano(texto) {
  return texto.replace(/\*\*/g, '')
}

export function textoParaHtml(texto) {
  const escapado = texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escapado
    .split('\n')
    .map((linha) => linha.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'))
    .join('<br>')
}

export function renderizarNegrito(texto) {
  return texto.split(/(\*\*.+?\*\*)/g).map((parte, index) => {
    if (parte.startsWith('**') && parte.endsWith('**')) {
      return <strong key={index}>{parte.slice(2, -2)}</strong>
    }
    return parte
  })
}
