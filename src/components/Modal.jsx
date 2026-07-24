import { X } from 'lucide-react'

const WIDTH_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export default function Modal({ open, onClose, title, children, footer, width = 'md' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`flex max-h-[90vh] w-full flex-col rounded-lg bg-ayamo-surface shadow-xl ${WIDTH_CLASSES[width]}`}
      >
        <div className="flex items-center justify-between border-b border-ayamo-border px-5 py-4">
          <h2 className="text-base font-semibold text-ayamo-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-ayamo-text-mut hover:bg-ayamo-bg"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-ayamo-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
