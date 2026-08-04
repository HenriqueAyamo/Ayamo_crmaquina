import { forwardRef } from 'react'

// Botão padrão do sistema. Antes cada tela montava a className na mão, o que fez os botões
// irem divergindo (padding, raio, cor de foco). Aqui as variantes ficam num lugar só.
const VARIANTES = {
  primario:
    'bg-ayamo-primary text-white shadow-sm hover:-translate-y-px hover:shadow-card-hover hover:opacity-95 active:translate-y-0',
  secundario: 'border border-ayamo-border bg-ayamo-surface text-ayamo-text hover:border-ayamo-primary/40 hover:bg-ayamo-bg',
  contorno: 'border border-ayamo-primary bg-transparent text-ayamo-primary hover:bg-ayamo-primary/10',
  sutil: 'bg-transparent text-ayamo-text-mut hover:bg-ayamo-bg hover:text-ayamo-text',
  sucesso: 'border border-ayamo-success/40 bg-transparent text-ayamo-success hover:bg-ayamo-success/10',
  alerta: 'border border-ayamo-warning/50 bg-transparent text-ayamo-warning hover:bg-ayamo-warning/10',
  perigo: 'border border-ayamo-danger/50 bg-transparent text-ayamo-danger hover:bg-ayamo-danger/10',
}

const TAMANHOS = {
  sm: 'gap-1.5 rounded-md px-2.5 py-1.5 text-xs',
  md: 'gap-2 rounded-md px-3.5 py-2 text-sm',
  lg: 'gap-2 rounded-md px-4 py-2.5 text-sm',
}

const Botao = forwardRef(function Botao(
  { variante = 'secundario', tamanho = 'md', icone: Icone, iconeFim: IconeFim, className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={`inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ayamo-primary/40 disabled:pointer-events-none disabled:opacity-40 ${
        VARIANTES[variante] ?? VARIANTES.secundario
      } ${TAMANHOS[tamanho] ?? TAMANHOS.md} ${className}`}
    >
      {Icone && <Icone size={tamanho === 'sm' ? 13 : 16} className="flex-shrink-0" />}
      {children}
      {IconeFim && <IconeFim size={tamanho === 'sm' ? 13 : 16} className="flex-shrink-0" />}
    </button>
  )
})

export default Botao
