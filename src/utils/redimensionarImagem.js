// Redimensiona a imagem no navegador antes de guardar em base64 no localStorage — sem isso,
// uma foto de celular (3-5MB) esgota a quota rapidinho. Limita a 900px de largura e comprime
// como JPEG, o que já é mais que suficiente para conferir visualmente na inspeção.
export function redimensionarImagem(arquivo, larguraMaxima = 900, qualidade = 0.75) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = (evento) => {
      const imagem = new Image()
      imagem.onload = () => {
        const escala = Math.min(1, larguraMaxima / imagem.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(imagem.width * escala)
        canvas.height = Math.round(imagem.height * escala)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', qualidade))
      }
      imagem.onerror = reject
      imagem.src = evento.target.result
    }
    leitor.onerror = reject
    leitor.readAsDataURL(arquivo)
  })
}
