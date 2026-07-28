import { inputClass } from './Field.jsx'

// Aplica mascara dd/mm/aaaa enquanto o usuario digita, sem depender de <input type="date">
// (que o time achou ruim de usar). Aceita só dígitos, insere as barras sozinho e trava em 8
// dígitos — não dá mais pra digitar um número solto tipo "233213321".
export function formatarComoDigita(valorAnterior, valorNovo) {
  const apagando = valorNovo.length < valorAnterior.length
  const digitos = valorNovo.replace(/\D/g, '').slice(0, 8)
  if (digitos.length === 0) return ''
  let formatado = digitos.slice(0, 2)
  if (digitos.length > 2) formatado += `/${digitos.slice(2, 4)}`
  if (digitos.length > 4) formatado += `/${digitos.slice(4, 8)}`
  // Ao apagar exatamente em cima de uma barra recém-inserida, remove o dígito anterior também
  // para o backspace não parecer "travado".
  if (apagando && valorAnterior.endsWith('/') && formatado.length === valorAnterior.length) {
    return formatado.slice(0, -1)
  }
  return formatado
}

export default function CampoData({ value, onChange, placeholder = 'dd/mm/aaaa', className, ...props }) {
  return (
    <input
      className={className ?? inputClass}
      placeholder={placeholder}
      inputMode="numeric"
      maxLength={10}
      value={value}
      onChange={(e) => onChange(formatarComoDigita(value ?? '', e.target.value))}
      {...props}
    />
  )
}
