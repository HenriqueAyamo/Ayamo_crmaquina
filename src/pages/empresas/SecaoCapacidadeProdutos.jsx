import { Plus, Trash2 } from 'lucide-react'
import { inputClass } from '../../components/Field.jsx'

export default function SecaoCapacidadeProdutos({ value, onChange }) {
  const linhas = value ?? []

  function adicionar() {
    onChange([...linhas, { nome: '', volumeMensal: '', unidade: 'ton' }])
  }

  function atualizar(index, campo, valor) {
    onChange(linhas.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)))
  }

  function remover(index) {
    onChange(linhas.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-ayamo-text">Produtos & capacidade mensal</span>
        <button type="button" onClick={adicionar} className="flex items-center gap-1 text-sm text-ayamo-primary hover:underline">
          <Plus size={14} />
          Adicionar linha
        </button>
      </div>

      {linhas.length === 0 && <p className="text-sm text-ayamo-text-mut">Nenhum produto informado.</p>}

      <div className="flex flex-col gap-2">
        {linhas.map((linha, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              className={inputClass}
              placeholder="Produto"
              value={linha.nome}
              onChange={(e) => atualizar(index, 'nome', e.target.value)}
            />
            <input
              className={`${inputClass} w-32`}
              placeholder="Volume/mês"
              value={linha.volumeMensal}
              onChange={(e) => atualizar(index, 'volumeMensal', e.target.value)}
            />
            <select
              className={`${inputClass} w-24`}
              value={linha.unidade}
              onChange={(e) => atualizar(index, 'unidade', e.target.value)}
            >
              <option value="ton">ton</option>
              <option value="kg">kg</option>
            </select>
            <button type="button" onClick={() => remover(index)} className="p-2 text-ayamo-danger hover:opacity-70">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
