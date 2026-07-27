export default function BarraDuasCores({ linhas }) {
  const maximo = Math.max(1, ...linhas.map((l) => l.vendido + l.restante))

  if (linhas.length === 0) {
    return <p className="text-sm text-ayamo-text-mut">Sem dados para exibir.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs text-ayamo-text-mut">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-ayamo-success" /> Vendido
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-ayamo-primary" /> Restante
        </span>
      </div>
      {linhas.map((linha) => {
        const total = linha.vendido + linha.restante
        return (
          <div key={linha.rotulo}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-ayamo-text">{linha.rotulo}</span>
              <span className="text-ayamo-text-mut">{total.toLocaleString('pt-BR')} MT</span>
            </div>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-ayamo-chart-grid" style={{ width: `${(total / maximo) * 100}%` }}>
              <div className="h-full bg-ayamo-success" style={{ width: `${(linha.vendido / total) * 100}%` }} />
              <div className="h-full bg-ayamo-primary" style={{ width: `${(linha.restante / total) * 100}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
