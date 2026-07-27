export default function BarraRanking({ linhas, formatarValor }) {
  const maximo = Math.max(1, ...linhas.map((l) => l.valor))

  if (linhas.length === 0) {
    return <p className="text-sm text-ayamo-text-mut">Sem dados para exibir.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {linhas.map((linha) => (
        <div key={linha.rotulo}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-ayamo-text">{linha.rotulo}</span>
            <span className="text-ayamo-text-mut">{formatarValor ? formatarValor(linha.valor) : linha.valor}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ayamo-chart-grid">
            <div
              className="h-full rounded-full"
              style={{ width: `${(linha.valor / maximo) * 100}%`, backgroundColor: linha.cor }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
