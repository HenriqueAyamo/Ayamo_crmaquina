// Rodapé padrão de modal de formulário: botão "Cancelar" + botão de submit ligado ao <form id={formId}>.
// Usado sempre que o modal só precisa dessas duas ações — para rodapés com mais botões (ex.: enviar
// por WhatsApp/e-mail, passos de wizard), monte o footer diretamente no Modal.
export default function ModalFooterAcoes({ onCancelar, formId, labelCancelar = 'Cancelar', labelSalvar = 'Salvar', disabled = false }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancelar}
        className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text transition-colors hover:bg-ayamo-bg"
      >
        {labelCancelar}
      </button>
      <button
        type="submit"
        form={formId}
        disabled={disabled}
        className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-px hover:shadow-card-hover hover:opacity-95 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
      >
        {labelSalvar}
      </button>
    </>
  )
}
