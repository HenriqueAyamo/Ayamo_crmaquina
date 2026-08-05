import { Check, X } from 'lucide-react'

// Onde a proposta está no funil. Antes o status era só um selo cinza no topo:
// dava para ler "Rascunho", mas não para saber o que já passou nem o que falta.
const ETAPAS = [
  { id: 'Rascunho', rotulo: 'Rascunho' },
  { id: 'Enviada', rotulo: 'Enviada' },
  { id: 'Em negociação', rotulo: 'Em negociação' },
  { id: 'Aceita', rotulo: 'Fechada' },
]

// Status que não são etapas do funil e sim desvios: mostram a trilha parada.
const DESVIOS = {
  'Aguardando aprovação': { rotulo: 'Aguardando diretor', apos: 'Em negociação' },
  'Aguardando aprovação financeira': { rotulo: 'Aguardando financeiro', apos: 'Em negociação' },
  Recusada: { rotulo: 'Recusada', apos: 'Em negociação', ruim: true },
  Expirada: { rotulo: 'Expirada', apos: 'Em negociação', ruim: true },
}

export default function TrilhaStatus({ status }) {
  const desvio = DESVIOS[status]
  const idAtual = desvio ? desvio.apos : status
  const indiceAtual = ETAPAS.findIndex((e) => e.id === idAtual)

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
      {ETAPAS.map((etapa, indice) => {
        const concluida = indice < indiceAtual
        const atual = indice === indiceAtual && !desvio
        const bloqueada = desvio?.ruim && indice >= indiceAtual

        return (
          <div key={etapa.id} className="flex items-center gap-1">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                atual
                  ? 'bg-ayamo-primary text-white'
                  : concluida
                    ? 'bg-ayamo-success/15 text-ayamo-success'
                    : bloqueada
                      ? 'bg-ayamo-text-mut/5 text-ayamo-text-mut/50 line-through'
                      : 'bg-ayamo-text-mut/10 text-ayamo-text-mut'
              }`}
            >
              {concluida && <Check size={11} strokeWidth={3} />}
              {etapa.rotulo}
            </span>
            {indice < ETAPAS.length - 1 && (
              <span className={`h-px w-4 ${indice < indiceAtual ? 'bg-ayamo-success/40' : 'bg-ayamo-border'}`} />
            )}
          </div>
        )
      })}

      {desvio && (
        <span
          className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            desvio.ruim ? 'bg-ayamo-danger/15 text-ayamo-danger' : 'bg-ayamo-warning/15 text-ayamo-warning'
          }`}
        >
          {desvio.ruim && <X size={11} strokeWidth={3} />}
          {desvio.rotulo}
        </span>
      )}
    </div>
  )
}
