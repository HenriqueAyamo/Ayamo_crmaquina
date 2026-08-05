import { AlertTriangle } from 'lucide-react'

// Selo de "cadastro incompleto" com a lista do que falta no title, para não
// obrigar a abrir o registro só para descobrir o que está faltando.
export default function SeloCadastroPendente({ faltando = [], compacto = false }) {
  const detalhe =
    faltando.length > 0 ? `Falta preencher: ${faltando.join(', ')}` : 'Cadastro criado pela importação — confira os dados'

  return (
    <span
      title={detalhe}
      className={`inline-flex items-center gap-1 rounded-full border border-ayamo-warning/40 bg-ayamo-warning/10 font-medium text-ayamo-warning ${
        compacto ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <AlertTriangle size={compacto ? 10 : 12} className="flex-shrink-0" />
      Revisar
    </span>
  )
}
