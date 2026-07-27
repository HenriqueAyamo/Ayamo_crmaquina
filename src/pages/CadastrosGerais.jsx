import { useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import AbaDivisoes from './cadastros/AbaDivisoes.jsx'
import AbaFamilias from './cadastros/AbaFamilias.jsx'
import AbaProdutos from './cadastros/AbaProdutos.jsx'
import AbaCategorias from './cadastros/AbaCategorias.jsx'
import AbaMoedasUnidades from './cadastros/AbaMoedasUnidades.jsx'
import AbaDadosAyamo from './cadastros/AbaDadosAyamo.jsx'

const ABAS = [
  { id: 'divisoes', label: 'Divisões', Componente: AbaDivisoes },
  { id: 'familias', label: 'Famílias', Componente: AbaFamilias },
  { id: 'produtos', label: 'Produtos', Componente: AbaProdutos },
  { id: 'categorias', label: 'Categorias de contato', Componente: AbaCategorias },
  { id: 'moedas', label: 'Moedas e unidades', Componente: AbaMoedasUnidades },
  { id: 'dadosAyamo', label: 'Dados da Ayamo', Componente: AbaDadosAyamo },
]

export default function CadastrosGerais() {
  const [abaAtiva, setAbaAtiva] = useState(ABAS[0].id)
  const Aba = ABAS.find((a) => a.id === abaAtiva).Componente

  return (
    <div>
      <PageHeader title="Cadastros gerais" />

      <div className="mb-5 flex gap-1 border-b border-ayamo-border">
        {ABAS.map((aba) => (
          <button
            key={aba.id}
            type="button"
            onClick={() => setAbaAtiva(aba.id)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              abaAtiva === aba.id
                ? 'border-ayamo-primary text-ayamo-primary'
                : 'border-transparent text-ayamo-text-mut hover:text-ayamo-text'
            }`}
          >
            {aba.label}
          </button>
        ))}
      </div>

      <Aba />
    </div>
  )
}
