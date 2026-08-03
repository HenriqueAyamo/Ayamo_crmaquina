// Passo entre "selecionar planilha" e "pré-visualização": deixa o usuário confirmar/ajustar qual
// coluna da planilha corresponde a cada campo do sistema. O sistema já sugere um encaixe (por
// nome de coluna parecido), mas nem toda planilha usa os mesmos nomes — por isso o ajuste manual.
export default function MapeamentoColunas({ campos, colunasDetectadas, mapeamento, onMudarCampo, totalLinhas, onCancelar, onContinuar }) {
  const faltamObrigatorios = campos.some((c) => c.obrigatorio && !mapeamento[c.chave])

  return (
    <div className="mt-3 rounded border border-ayamo-border bg-ayamo-surface">
      <div className="border-b border-ayamo-border px-4 py-3">
        <p className="text-sm font-medium text-ayamo-text">Confira o mapeamento das colunas</p>
        <p className="text-xs text-ayamo-text-mut">
          {totalLinhas} linha(s) detectada(s). Já sugerimos um encaixe pelo nome da coluna — corrija o que estiver
          errado ou deixe em &ldquo;Não usar&rdquo; o que não existir nessa planilha.
        </p>
      </div>

      <div className="grid max-h-96 grid-cols-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2">
        {campos.map((campo) => (
          <label key={campo.chave} className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ayamo-text">
              {campo.label}
              {campo.obrigatorio && <span className="text-ayamo-danger"> *</span>}
            </span>
            <select
              className="w-full rounded border border-ayamo-border bg-ayamo-surface px-3 py-2 text-sm text-ayamo-text outline-none focus:border-ayamo-primary"
              value={mapeamento[campo.chave] ?? ''}
              onChange={(e) => onMudarCampo(campo.chave, e.target.value)}
            >
              <option value="">— Não usar —</option>
              {colunasDetectadas.map((coluna) => (
                <option key={coluna} value={coluna}>
                  {coluna}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="flex justify-end gap-3 border-t border-ayamo-border px-4 py-3">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={faltamObrigatorios}
          onClick={onContinuar}
          className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar para pré-visualização
        </button>
      </div>
    </div>
  )
}
