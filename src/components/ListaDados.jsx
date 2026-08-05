import { useState } from 'react'

// Grade de rótulo/valor que esconde o que está vazio.
// A tela de venda mostrava oito campos em que seis eram "—"; o ruído escondia
// os dois que tinham conteúdo. Aqui os vazios ficam atrás de um contador.
function estaVazio(valor) {
  return valor == null || valor === '' || valor === '—'
}

export default function ListaDados({ dados, colunas = 3 }) {
  const [mostrarVazios, setMostrarVazios] = useState(false)

  const preenchidos = dados.filter((d) => !estaVazio(d.valor))
  const vazios = dados.filter((d) => estaVazio(d.valor))
  const visiveis = mostrarVazios ? dados : preenchidos

  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[colunas]

  if (preenchidos.length === 0 && !mostrarVazios) {
    return (
      <div className="text-sm text-ayamo-text-mut">
        Nenhum campo preenchido.{' '}
        <button type="button" onClick={() => setMostrarVazios(true)} className="text-ayamo-primary hover:underline">
          Ver os {vazios.length} campos vazios
        </button>
      </div>
    )
  }

  return (
    <div>
      <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${gridCols}`}>
        {visiveis.map((d) => (
          <div key={d.rotulo} className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-ayamo-text-mut">{d.rotulo}</dt>
            <dd className={`mt-0.5 text-sm ${estaVazio(d.valor) ? 'text-ayamo-text-mut/60' : 'font-medium text-ayamo-text'}`}>
              {estaVazio(d.valor) ? 'não informado' : d.valor}
            </dd>
          </div>
        ))}
      </dl>

      {vazios.length > 0 && (
        <button
          type="button"
          onClick={() => setMostrarVazios((atual) => !atual)}
          className="mt-4 text-xs text-ayamo-primary hover:underline"
        >
          {mostrarVazios ? 'Ocultar campos vazios' : `Mostrar ${vazios.length} campo(s) não preenchido(s)`}
        </button>
      )}
    </div>
  )
}
