import { useState } from 'react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import { sanitizarUrlImagem } from '../utils/sanitizarUrl.js'

function valoresIniciais(usuario) {
  const a = usuario.assinaturaEmail ?? {}
  return {
    nome: a.nome ?? usuario.nome,
    cargo: a.cargo ?? '',
    empresa: a.empresa ?? 'Ayamo Global Foods',
    telefone: a.telefone ?? '',
    logoUrl: a.logoUrl ?? '',
  }
}

export default function Settings() {
  const { usuarioLogado, usuarios, resetarTodosDados } = useData()
  const { t } = useI18n()
  const [form, setForm] = useState(() => valoresIniciais(usuarioLogado))
  const [previewNoEmail, setPreviewNoEmail] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [confirmandoReset, setConfirmandoReset] = useState(false)

  const logoSegura = sanitizarUrlImagem(form.logoUrl)

  function salvar(e) {
    e.preventDefault()
    usuarios.editar(usuarioLogado.id, { assinaturaEmail: { ...form, logoUrl: logoSegura } })
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2000)
  }

  const assinaturaHtml = (
    <div className="text-sm text-ayamo-text">
      {logoSegura && <img src={logoSegura} alt="Logo" className="mb-2 h-10 object-contain" />}
      <p className="font-semibold">{form.nome}</p>
      {form.cargo && <p className="text-ayamo-text-mut">{form.cargo}</p>}
      <p className="text-ayamo-text-mut">{form.empresa}</p>
      {form.telefone && <p className="text-ayamo-text-mut">{form.telefone}</p>}
    </div>
  )

  return (
    <div>
      <PageHeader title={t('conta.titulo')} subtitle={t('conta.subtitulo')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={salvar} className="flex flex-col gap-4 rounded border border-ayamo-border bg-ayamo-surface p-5">
          <Field label={t('campo.nome')} required>
            <input className={inputClass} required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </Field>
          <Field label={t('campo.cargo')}>
            <input className={inputClass} value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
          </Field>
          <Field label={t('campo.empresa')}>
            <input className={inputClass} value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
          </Field>
          <Field label={t('campo.telefone')}>
            <input className={inputClass} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </Field>
          <Field label={t('campo.urlLogo')} hint="Apenas http(s) ou imagem em base64 — outros esquemas são bloqueados.">
            <input className={inputClass} value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />
          </Field>
          <div className="flex items-center gap-2">
            <button type="submit" className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Salvar assinatura
            </button>
            {salvo && <span className="text-sm text-ayamo-success">Salvo.</span>}
          </div>
        </form>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ayamo-text">Pré-visualização</h2>
            <button
              type="button"
              onClick={() => setPreviewNoEmail((atual) => !atual)}
              className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
            >
              {previewNoEmail ? 'Ver só a assinatura' : 'Ver dentro de um e-mail de oferta'}
            </button>
          </div>

          {previewNoEmail ? (
            <div className="overflow-hidden rounded border border-ayamo-border bg-ayamo-surface">
              <div className="bg-ayamo-primary px-4 py-3 text-sm font-semibold text-white">Ayamo Global Foods — Nova oferta</div>
              <div className="p-4 text-sm text-ayamo-text">
                <p className="mb-3">Dear Cliente,</p>
                <p className="mb-4">Segue nossa oferta atualizada conforme conversamos.</p>
                <hr className="mb-4 border-ayamo-border" />
                {assinaturaHtml}
              </div>
            </div>
          ) : (
            <div className="rounded border border-ayamo-border bg-ayamo-surface p-4">{assinaturaHtml}</div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded border border-ayamo-danger/40 bg-ayamo-danger/5 p-5">
        <h2 className="text-sm font-semibold text-ayamo-danger">Zona de risco</h2>
        <p className="mt-1 text-sm text-ayamo-text-mut">
          Apaga tudo que foi cadastrado neste navegador (compras, propostas, empresas, demandas etc.) e volta pros
          dados de exemplo originais. Útil pra limpar registros de teste. Não afeta outros dispositivos/navegadores.
        </p>

        {!confirmandoReset ? (
          <button
            type="button"
            onClick={() => setConfirmandoReset(true)}
            className="mt-3 rounded border border-ayamo-danger px-4 py-2 text-sm font-medium text-ayamo-danger hover:bg-ayamo-danger/10"
          >
            Apagar todos os dados e recomeçar do exemplo
          </button>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm font-medium text-ayamo-text">Tem certeza? Essa ação não pode ser desfeita.</span>
            <button
              type="button"
              onClick={resetarTodosDados}
              className="rounded bg-ayamo-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Sim, apagar tudo
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoReset(false)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
