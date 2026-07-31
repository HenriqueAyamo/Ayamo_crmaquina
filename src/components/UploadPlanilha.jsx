import { useRef } from 'react'

// Botão + input de arquivo escondido + texto de ajuda + resumo pós-importação — mesmo bloco
// usado pelos importadores de Compras e de Empresas, só muda o texto de ajuda e o resumo.
export default function UploadPlanilha({ onArquivo, hint, mensagemResumo, erros }) {
  const inputRef = useRef(null)

  return (
    <div className="rounded border border-dashed border-ayamo-border p-4">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          if (e.target.files[0]) onArquivo(e.target.files[0])
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current.click()}
        className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Selecionar planilha (.xlsx)
      </button>
      <p className="mt-2 text-xs text-ayamo-text-mut">{hint}</p>

      {mensagemResumo && (
        <div className="mt-3 text-sm">
          <p className="text-ayamo-text">{mensagemResumo}</p>
          {erros?.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-ayamo-danger">
              {erros.map((erro) => (
                <li key={erro}>{erro}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
