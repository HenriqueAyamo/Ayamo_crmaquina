import { MOEDAS, UNIDADES_PESO, UNIDADES_EMBALAGEM } from '../../data/unidades.js'
import DataTable from '../../components/DataTable.jsx'

export default function AbaMoedasUnidades() {
  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-ayamo-text">Moedas</h2>
        <DataTable
          rowKey="codigo"
          columns={[
            { key: 'codigo', header: 'Código' },
            { key: 'simbolo', header: 'Símbolo' },
            { key: 'nome', header: 'Nome' },
          ]}
          data={MOEDAS}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ayamo-text">Unidades de peso</h2>
        <DataTable
          rowKey="codigo"
          columns={[
            { key: 'codigo', header: 'Código' },
            { key: 'nome', header: 'Nome' },
          ]}
          data={UNIDADES_PESO}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-ayamo-text">Unidades de embalagem</h2>
        <DataTable
          rowKey="codigo"
          columns={[
            { key: 'codigo', header: 'Código' },
            { key: 'nome', header: 'Nome' },
          ]}
          data={UNIDADES_EMBALAGEM}
        />
      </section>
    </div>
  )
}
