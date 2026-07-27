import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'ayamo_crm_v1_tema'

function temaInicial() {
  const salvo = localStorage.getItem(STORAGE_KEY)
  if (salvo === 'dark' || salvo === 'light') return salvo
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    localStorage.setItem(STORAGE_KEY, tema)
  }, [tema])

  return (
    <button
      type="button"
      onClick={() => setTema((atual) => (atual === 'dark' ? 'light' : 'dark'))}
      className="flex h-8 w-8 items-center justify-center rounded border border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg hover:text-ayamo-text"
      title={tema === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
    >
      {tema === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
