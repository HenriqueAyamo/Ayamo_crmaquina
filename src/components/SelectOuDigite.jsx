import { useId } from 'react'
import { inputClass } from './Field.jsx'

// Combobox nativo (input + datalist): sugere valores já usados em registros anteriores, mas aceita
// digitar qualquer valor novo — útil pra campos livres tipo Market/POL/POD/Commodity que crescem
// com o tempo e não têm uma lista fixa e fechada de opções.
export default function SelectOuDigite({ value, onChange, opcoes = [], placeholder = 'Selecione ou digite' }) {
  const listId = useId()
  const opcoesUnicas = [...new Set(opcoes.filter(Boolean))].sort((a, b) => a.localeCompare(b))

  return (
    <>
      <input
        list={listId}
        className={inputClass}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {opcoesUnicas.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
    </>
  )
}
