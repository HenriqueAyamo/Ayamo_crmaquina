import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Field, { inputClass } from '../../components/Field.jsx'

export default function AbaDadosAyamo() {
  const { dadosAyamo, atualizarDadosAyamo } = useData()
  const [form, setForm] = useState(dadosAyamo)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    setForm(dadosAyamo)
  }, [dadosAyamo])

  function salvar(e) {
    e.preventDefault()
    atualizarDadosAyamo(form)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  return (
    <div className="max-w-xl">
      <p className="mb-4 text-sm text-ayamo-text-mut">
        Usado para preencher automaticamente o PO e a Proforma Invoice. Fica salvo só no seu navegador (não é enviado a
        lugar nenhum) — por isso os dados bancários vêm em branco por padrão.
      </p>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        <Field label="Razão social">
          <input className={inputClass} value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
        </Field>
        <Field label="Endereço completo">
          <textarea className={inputClass} rows={3} value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        </Field>
        <Field label="Banco">
          <input className={inputClass} value={form.bancoNome} onChange={(e) => setForm({ ...form, bancoNome: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SWIFT">
            <input className={inputClass} value={form.bancoSwift} onChange={(e) => setForm({ ...form, bancoSwift: e.target.value })} />
          </Field>
          <Field label="IBAN">
            <input className={inputClass} value={form.bancoIban} onChange={(e) => setForm({ ...form, bancoIban: e.target.value })} />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="w-fit rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Salvar
          </button>
          {salvo && <span className="text-sm text-ayamo-success">Salvo.</span>}
        </div>
      </form>
    </div>
  )
}
