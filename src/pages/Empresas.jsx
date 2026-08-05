import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Eye } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import SeloCadastroPendente from '../components/SeloCadastroPendente.jsx'
import { empresaIncompleta, faltandoNaEmpresa } from '../utils/cadastroPendente.js'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import Modal from '../components/Modal.jsx'
import ModalFooterAcoes from '../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import CampoNumerico from '../components/CampoNumerico.jsx'
import { formatarValor } from '../utils/formato.js'
import { MOEDAS } from '../data/unidades.js'
import { contarAprovacoes } from '../data/qualificacaoPaises.js'
import { CATEGORIAS_PRODUTO, CATEGORIA_TONE, classificarProduto, isNacional } from '../utils/categoriaProdutos.js'
import { exportarEmpresasExcel } from '../utils/exportarEmpresas.js'
import { encontrarMelhorCorrespondencia } from '../utils/produtoTexto.js'
import SupplierDashboard from './empresas/SupplierDashboard.jsx'
import ModalDetalheEmpresa from './empresas/ModalDetalheEmpresa.jsx'

const ImportarPlanilhaEmpresas = lazy(() => import('./empresas/ImportarPlanilhaEmpresas.jsx'))

const TONE_SITUACAO = { Ativo: 'success', Inativo: 'neutral', Bloqueado: 'danger' }

const CHIP_TONE_CLASSES = {
  accent: 'border-ayamo-accent/40 bg-ayamo-accent/20 text-ayamo-text',
  danger: 'border-ayamo-danger/25 bg-ayamo-danger/10 text-ayamo-danger',
  warning: 'border-ayamo-warning/25 bg-ayamo-warning/10 text-ayamo-warning',
  info: 'border-ayamo-primary/25 bg-ayamo-primary/10 text-ayamo-primary',
  success: 'border-ayamo-success/25 bg-ayamo-success/10 text-ayamo-success',
  neutral: 'border-ayamo-text-mut/20 bg-ayamo-text-mut/10 text-ayamo-text-mut',
}

function categoriasDaEmpresa(empresa) {
  return new Set((empresa.produtosCapacidade ?? []).map((p) => classificarProduto(p.nome)))
}

function valoresIniciais() {
  return {
    nome: '',
    pais: '',
    endereco: '',
    sif: '',
    tipo: 'Cliente',
    responsavelAyamoId: '',
    moedaPadrao: '',
    limiteCredito: 0,
    creditoUtilizado: 0,
  }
}

export default function Empresas() {
  const { empresas, usuarios, contatos, getUsuario } = useData()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [situacaoFiltro, setSituacaoFiltro] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [origemFiltro, setOrigemFiltro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [importarAberto, setImportarAberto] = useState(false)
  const [form, setForm] = useState(valoresIniciais())
  const [sugestao, setSugestao] = useState(null)
  const [copiarContatosDe, setCopiarContatosDe] = useState(null)
  const [detalheAberto, setDetalheAberto] = useState(null)

  const responsaveis = usuarios.items.filter((u) => u.situacao === 'Ativo')

  const fornecedores = empresas.items.filter((e) => e.tipo === 'Fornecedor')
  const nacionaisCount = fornecedores.filter((e) => isNacional(e.pais)).length
  const internacionaisCount = fornecedores.length - nacionaisCount

  const empresasFiltradas = useMemo(() => {
    return empresas.items.filter((e) => {
      const combinaBusca = e.nome.toLowerCase().includes(busca.toLowerCase())
      const combinaTipo = !tipoFiltro || e.tipo === tipoFiltro
      const combinaSituacao = !situacaoFiltro || e.situacao === situacaoFiltro
      const combinaCategoria = !categoriaFiltro || (e.tipo === 'Fornecedor' && categoriasDaEmpresa(e).has(categoriaFiltro))
      const combinaOrigem =
        !origemFiltro || (e.tipo === 'Fornecedor' && (origemFiltro === 'nacional') === isNacional(e.pais))
      return combinaBusca && combinaTipo && combinaSituacao && combinaCategoria && combinaOrigem
    })
  }, [empresas.items, busca, tipoFiltro, situacaoFiltro, categoriaFiltro, origemFiltro])

  function abrirNova() {
    setForm(valoresIniciais())
    setSugestao(null)
    setCopiarContatosDe(null)
    setModalAberto(true)
  }

  function alterarNome(nome) {
    setForm((atual) => ({ ...atual, nome }))
    setCopiarContatosDe(null)
    if (nome.trim().length < 3) {
      setSugestao(null)
      return
    }
    const encontrado = encontrarMelhorCorrespondencia(nome, empresas.items, (e) => e.nome, 0.5)
    setSugestao(encontrado?.item ?? null)
  }

  function usarSugestao() {
    if (!sugestao) return
    setForm((atual) => ({ ...atual, pais: sugestao.pais, moedaPadrao: sugestao.moedaPadrao }))
    setCopiarContatosDe(sugestao.id)
    setSugestao(null)
  }

  function salvar(e) {
    e.preventDefault()
    const nova = empresas.criar({
      ...form,
      responsavelAyamoId: Number(form.responsavelAyamoId),
      limiteCredito: Number(form.limiteCredito),
      creditoUtilizado: Number(form.creditoUtilizado),
    })
    if (copiarContatosDe) {
      contatos.items
        .filter((c) => c.empresaId === copiarContatosDe)
        .forEach((c) => contatos.criar({ nome: c.nome, cargo: c.cargo, telefone: c.telefone, email: c.email, categoriasIds: c.categoriasIds, empresaId: nova.id }))
    }
    setModalAberto(false)
    navigate(`/empresas/${nova.id}`)
  }

  return (
    <div>
      <PageHeader title={t('empresas.titulo')} actionLabel={t('empresas.nova')} onAction={abrirNova} />

      {tipoFiltro === 'Fornecedor' && <SupplierDashboard fornecedores={fornecedores} contatos={contatos.items} />}

      <div className="mb-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setImportarAberto((atual) => !atual)}
          className="rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
        >
          {importarAberto ? 'Fechar importação' : 'Importar planilha'}
        </button>
        <button
          type="button"
          onClick={() => exportarEmpresasExcel(empresasFiltradas)}
          className="flex items-center gap-1.5 rounded border border-ayamo-border px-3 py-1.5 text-xs font-medium text-ayamo-text-mut hover:bg-ayamo-bg"
        >
          <Download size={14} />
          Exportar Excel
        </button>
      </div>

      {importarAberto && (
        <div className="mb-4">
          <Suspense fallback={<p className="text-sm text-ayamo-text-mut">Carregando importador...</p>}>
            <ImportarPlanilhaEmpresas onImportado={() => setImportarAberto(false)} />
          </Suspense>
        </div>
      )}

      <FilterBar>
        <Field label={t('comum.buscar')}>
          <input
            className={inputClass}
            placeholder={t('empresas.buscaPlaceholder')}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </Field>
        <Field label={t('comum.tipo')}>
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">{t('comum.todos')}</option>
            <option value="Fornecedor">Fornecedor</option>
            <option value="Cliente">Cliente</option>
          </select>
        </Field>
        <Field label={t('empresas.situacao')}>
          <select className={inputClass} value={situacaoFiltro} onChange={(e) => setSituacaoFiltro(e.target.value)}>
            <option value="">{t('comum.todas')}</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Bloqueado">Bloqueado</option>
          </select>
        </Field>
      </FilterBar>

      {tipoFiltro !== 'Cliente' && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOrigemFiltro('')}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              origemFiltro === '' ? 'border-ayamo-primary bg-ayamo-primary/10 text-ayamo-primary' : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setOrigemFiltro((atual) => (atual === 'nacional' ? '' : 'nacional'))}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              origemFiltro === 'nacional' ? 'border-ayamo-primary bg-ayamo-primary/10 text-ayamo-primary' : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
            }`}
          >
            🇧🇷 Nacional ({nacionaisCount})
          </button>
          <button
            type="button"
            onClick={() => setOrigemFiltro((atual) => (atual === 'internacional' ? '' : 'internacional'))}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              origemFiltro === 'internacional' ? 'border-ayamo-primary bg-ayamo-primary/10 text-ayamo-primary' : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
            }`}
          >
            🌍 Internacional ({internacionaisCount})
          </button>
          <span className="mx-1 h-4 w-px bg-ayamo-border" />
          {CATEGORIAS_PRODUTO.map((categoria) => (
            <button
              key={categoria}
              type="button"
              onClick={() => setCategoriaFiltro((atual) => (atual === categoria ? '' : categoria))}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                categoriaFiltro === categoria ? CHIP_TONE_CLASSES[CATEGORIA_TONE[categoria]] : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>
      )}

      <CardList
        rowKey="id"
        onRowClick={(item) => navigate(`/empresas/${item.id}`)}
        data={empresasFiltradas}
        linhaExpandida={(item) => {
          if (item.tipo !== 'Fornecedor' || !(item.produtosCapacidade ?? []).length) {
            return <p className="text-sm text-ayamo-text-mut">Sem produtos cadastrados.</p>
          }
          const maximo = Math.max(1, ...item.produtosCapacidade.map((p) => Number(p.volumeMensal || 0)))
          return (
            <div className="flex flex-col gap-2">
              {item.produtosCapacidade.map((p, indice) => (
                <div key={indice} className="flex items-center gap-3">
                  <span className="w-56 flex-shrink-0 truncate text-xs text-ayamo-text">{p.nome}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ayamo-chart-grid">
                    <div
                      className="h-full rounded-full bg-ayamo-primary"
                      style={{ width: `${(Number(p.volumeMensal || 0) / maximo) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 flex-shrink-0 text-right text-xs text-ayamo-text-mut">
                    {Number(p.volumeMensal || 0).toLocaleString('pt-BR')} {p.unidade}/mês
                  </span>
                </div>
              ))}
            </div>
          )
        }}
        columns={[
          {
            key: 'nome',
            header: t('contatos.nome'),
            render: (item) => (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                {item.nome}
                {empresaIncompleta(item) && <SeloCadastroPendente faltando={faltandoNaEmpresa(item)} compacto />}
              </span>
            ),
            sortValue: (item) => item.nome,
          },
          { key: 'pais', header: t('empresas.pais') },
          {
            key: 'responsavel',
            header: t('empresas.responsavelAyamo'),
            render: (item) => getUsuario(item.responsavelAyamoId)?.nome ?? '—',
            sortValue: (item) => getUsuario(item.responsavelAyamoId)?.nome ?? '',
          },
          { key: 'moedaPadrao', header: t('empresas.moedaPadrao') },
          {
            key: 'qualificacoes',
            header: t('empresas.qualificacoes'),
            render: (item) => {
              if (item.tipo !== 'Fornecedor') return '—'
              const { emAndamentoOuAprovado, total } = contarAprovacoes(item.qualificacoesPaises)
              return `${emAndamentoOuAprovado}/${total}`
            },
          },
          { key: 'limiteCredito', header: t('empresas.limiteCredito'), render: (item) => formatarValor(item.limiteCredito, item.moedaPadrao) },
          { key: 'creditoUtilizado', header: t('empresas.creditoUtilizado'), render: (item) => formatarValor(item.creditoUtilizado, item.moedaPadrao) },
          {
            key: 'situacao',
            header: t('empresas.situacao'),
            render: (item) => <StatusBadge label={item.situacao} tone={TONE_SITUACAO[item.situacao] ?? 'neutral'} />,
          },
          {
            key: '_acoes',
            header: '',
            toggleable: false,
            render: (item) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDetalheAberto(item)
                }}
                className="text-ayamo-text-mut hover:text-ayamo-primary"
                title={t('empresas.verDetalhes')}
              >
                <Eye size={15} />
              </button>
            ),
          },
        ]}
      />

      <ModalDetalheEmpresa open={Boolean(detalheAberto)} onClose={() => setDetalheAberto(null)} empresa={detalheAberto} />

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Nova empresa"
        footer={<ModalFooterAcoes onCancelar={() => setModalAberto(false)} formId="empresa-form" />}
      >
        <form id="empresa-form" onSubmit={salvar} className="flex flex-col gap-4">
          <Field label="Nome" required>
            <input className={inputClass} required value={form.nome} onChange={(e) => alterarNome(e.target.value)} />
          </Field>
          {sugestao && (
            <div className="flex items-center justify-between gap-2 rounded border border-ayamo-accent/40 bg-ayamo-accent/10 px-3 py-2 text-xs text-ayamo-text">
              <span>
                Nome parecido com <strong>{sugestao.nome}</strong> já cadastrado — copiar país, moeda e contatos dessa empresa?
              </span>
              <div className="flex flex-shrink-0 gap-2">
                <button type="button" onClick={usarSugestao} className="rounded border border-ayamo-primary px-2 py-1 font-medium text-ayamo-primary hover:bg-ayamo-primary/10">
                  Usar dados
                </button>
                <button type="button" onClick={() => setSugestao(null)} className="text-ayamo-text-mut hover:text-ayamo-text">
                  Ignorar
                </button>
              </div>
            </div>
          )}
          {copiarContatosDe && (
            <p className="text-xs text-ayamo-success">
              Contatos de {empresas.items.find((e) => e.id === copiarContatosDe)?.nome} serão copiados ao salvar.
            </p>
          )}
          <Field label="País" required>
            <input
              className={inputClass}
              required
              value={form.pais}
              onChange={(e) => setForm({ ...form, pais: e.target.value })}
            />
          </Field>
          <Field label="Endereço completo" hint="Usado nos documentos de PO/Proforma">
            <textarea
              className={inputClass}
              rows={2}
              value={form.endereco}
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </Field>
          <Field label="SIF / número de estabelecimento" hint="Se for fornecedor, usado no documento para o cliente final">
            <input className={inputClass} value={form.sif} onChange={(e) => setForm({ ...form, sif: e.target.value })} />
          </Field>
          <Field label="Tipo" required>
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Cliente">Cliente</option>
              <option value="Fornecedor">Fornecedor</option>
            </select>
          </Field>
          <Field label="Responsável Ayamo" required>
            <select
              className={inputClass}
              required
              value={form.responsavelAyamoId}
              onChange={(e) => setForm({ ...form, responsavelAyamoId: e.target.value })}
            >
              <option value="">Selecione</option>
              {responsaveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Moeda padrão de negociação" required>
            <select
              className={inputClass}
              required
              value={form.moedaPadrao}
              onChange={(e) => setForm({ ...form, moedaPadrao: e.target.value })}
            >
              <option value="">Selecione</option>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo} — {m.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Limite de crédito" required>
            <CampoNumerico required value={form.limiteCredito} onChange={(limiteCredito) => setForm({ ...form, limiteCredito })} />
          </Field>
        </form>
      </Modal>
    </div>
  )
}
