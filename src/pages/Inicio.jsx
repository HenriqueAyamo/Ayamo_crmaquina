import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ShoppingCart, TrendingUp, FileText, AlertTriangle, ClipboardList, Ship } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import { useDivisao } from '../divisoes/DivisaoContext.jsx'
import CardList from '../components/CardList.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatarData } from '../utils/formato.js'
import PopupNovidadesDemandas from '../components/PopupNovidadesDemandas.jsx'
import { obterOfertasAtuais } from '../utils/ofertasAtuais.js'
import { linkDaPendencia } from '../utils/pendencias.js'

const ICONE_TIPO = {
  Compras: { icon: ShoppingCart, cor: 'text-ayamo-primary' },
  Vendas: { icon: TrendingUp, cor: 'text-ayamo-success' },
  Documentos: { icon: FileText, cor: 'text-ayamo-text-mut' },
  Claims: { icon: AlertTriangle, cor: 'text-ayamo-danger' },
  Demandas: { icon: ClipboardList, cor: 'text-ayamo-accent' },
  Freight: { icon: Ship, cor: 'text-ayamo-teal' },
}

function CartaoNumerico({ label, valor, icone: Icone, tom = 'primary' }) {
  const TONS = {
    primary: 'bg-ayamo-primary/10 text-ayamo-primary',
    success: 'bg-ayamo-success/10 text-ayamo-success',
    accent: 'bg-ayamo-accent/20 text-ayamo-warning',
    neutral: 'bg-ayamo-text-mut/10 text-ayamo-text-mut',
  }
  return (
    <div className="rounded-lg border border-ayamo-border bg-ayamo-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase leading-snug tracking-wide text-ayamo-text-mut">{label}</p>
        {Icone && (
          <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${TONS[tom]}`}>
            <Icone size={16} />
          </span>
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ayamo-text">{valor}</p>
    </div>
  )
}

function linkDaMovimentacao(item) {
  if (item.tipo === 'Compras') return `/compras/${item.refId}`
  if (item.tipo === 'Vendas') return `/vendas/${item.refId}`
  if (item.tipo === 'Claims') return '/claims'
  if (item.tipo === 'Demandas') return '/demandas'
  if (item.tipo === 'Freight') return '/freight'
  return '/documentos'
}

export default function Inicio() {
  const { ofertas, propostas, documentos, claims, demandas, fretes, getProduto, getEmpresa, usuarioLogado, getPendencias } = useData()
  const { t } = useI18n()
  const { noEscopo, divisaoAtiva, divisaoAtivaId } = useDivisao()
  const navigate = useNavigate()

  // Tudo no Início respeita o módulo aberto — números somando divisões que a
  // pessoa nem acompanha davam a impressão de movimento que não é dela.
  const ofertasDoModulo = noEscopo(ofertas.items)
  const propostasDoModulo = noEscopo(propostas.items)

  const ofertasAtivas = obterOfertasAtuais(ofertasDoModulo).filter(
    (o) => o.status === 'Disponível' || o.status === 'Em revisão',
  ).length
  const propostasEmNegociacao = propostasDoModulo.filter((p) => p.status === 'Em negociação').length
  const propostasAguardandoAprovacao = propostasDoModulo.filter((p) => p.status === 'Aguardando aprovação').length

  const mesReferencia = documentos.items.reduce((max, d) => (d.data > max ? d.data : max), '0000-00-00').slice(0, 7)
  const documentosNoMes = documentos.items.filter((d) => d.data.slice(0, 7) === mesReferencia).length

  const pendencias = useMemo(
    () => getPendencias(usuarioLogado, divisaoAtivaId),
    [getPendencias, usuarioLogado, divisaoAtivaId],
  )

  const movimentacoes = useMemo(() => {
    const deOfertas = ofertasDoModulo.map((o) => ({
      data: o.data,
      tipo: 'Compras',
      refId: o.codigoBase,
      descricao: `${o.codigo} — ${getProduto(o.produtoId)?.nome ?? ''} (${o.status})`,
    }))

    const deVendas = propostasDoModulo.flatMap((p) =>
      p.historicoNegociacao.map((r) => ({
        data: r.data,
        tipo: 'Vendas',
        refId: p.numero,
        descricao: `${p.numero} — ${r.tipo}`,
      })),
    )

    const deDocumentos = documentos.items.map((d) => ({
      data: d.data,
      tipo: 'Documentos',
      refId: null,
      descricao: `${d.numero} emitido para ${d.clienteNome}`,
    }))

    const deClaims = noEscopo(claims.items).map((c) => ({
      data: c.data,
      tipo: 'Claims',
      refId: null,
      descricao: `Claim registrado — ${getProduto(c.produtoId)?.nome ?? ''} × ${getEmpresa(c.fornecedorId)?.nome ?? ''} (${c.status})`,
    }))

    const deDemandas = noEscopo(demandas.items).map((d) => ({
      data: d.data,
      tipo: 'Demandas',
      refId: null,
      descricao: `Demanda de ${getEmpresa(d.clienteId)?.nome ?? ''} — ${getProduto(d.produtoId)?.nome ?? ''} (${d.status})`,
    }))

    const deFretes = fretes.items.map((f) => ({
      data: f.data,
      tipo: 'Freight',
      refId: null,
      descricao: `Frete registrado — ${f.origem} → ${f.destino} (${f.transportadora})`,
    }))

    return [...deOfertas, ...deVendas, ...deDocumentos, ...deClaims, ...deDemandas, ...deFretes]
      .sort((a, b) => (a.data < b.data ? 1 : -1))
      .slice(0, 10)
  }, [ofertasDoModulo, propostasDoModulo, noEscopo, documentos.items, claims.items, demandas.items, fretes.items, getProduto, getEmpresa])

  return (
    <div>
      <PopupNovidadesDemandas />
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ayamo-text">{t('inicio.titulo')}</h1>
        {divisaoAtiva && <span className="text-sm text-ayamo-text-mut">Módulo {divisaoAtiva.nome}</span>}
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CartaoNumerico label={t('inicio.ofertasAtivas')} valor={ofertasAtivas} icone={ShoppingCart} tom="primary" />
        <CartaoNumerico label={t('inicio.propostasNegociacao')} valor={propostasEmNegociacao} icone={TrendingUp} tom="success" />
        <CartaoNumerico label={t('inicio.aguardandoMargem')} valor={propostasAguardandoAprovacao} icone={AlertCircle} tom="accent" />
        <CartaoNumerico label={t('inicio.documentosMes')} valor={documentosNoMes} icone={FileText} tom="neutral" />
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-ayamo-accent" />
          <h2 className="text-base font-semibold text-ayamo-text">
            {t('inicio.minhasPendencias')}{' '}
            <span className="font-normal text-ayamo-text-mut">
              {t('inicio.visaoDe', { nome: usuarioLogado.nome, perfil: usuarioLogado.perfil })}
            </span>
          </h2>
        </div>
        {pendencias.length > 0 && (
          <button type="button" onClick={() => navigate('/pendencias')} className="text-sm text-ayamo-primary hover:underline">
            {t('inicio.verTodas', { n: pendencias.length })}
          </button>
        )}
      </div>

      {pendencias.length === 0 ? (
        <EmptyState title={t('inicio.semPendencias')} description={t('inicio.semPendenciasDica')} />
      ) : (
        <ul className="mb-8 flex flex-col gap-2">
          {pendencias.slice(0, 5).map((p) => (
            <li key={`${p.tipo}-${p.id}-${p.data}`}>
              <button
                type="button"
                onClick={() => navigate(linkDaPendencia(p))}
                className="flex w-full items-center justify-between rounded border border-ayamo-border bg-ayamo-surface px-4 py-3 text-left text-sm hover:bg-ayamo-bg"
              >
                <span>
                  <span className="font-medium text-ayamo-text">{p.titulo}</span>
                  <span className="text-ayamo-text-mut"> — {p.descricao}</span>
                </span>
                <span className="text-xs text-ayamo-text-mut">{formatarData(p.data)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 text-base font-semibold text-ayamo-text">{t('inicio.ultimasMovimentacoes')}</h2>
      <CardList
        rowKey={(item) => `${item.data}-${item.descricao}`}
        data={movimentacoes}
        onRowClick={(item) => navigate(linkDaMovimentacao(item))}
        columns={[
          { key: 'data', header: t('comum.data'), render: (item) => formatarData(item.data) },
          {
            key: 'tipo',
            header: t('comum.tipo'),
            render: (item) => {
              const info = ICONE_TIPO[item.tipo]
              const Icon = info?.icon
              return (
                <span className={`inline-flex items-center gap-1.5 ${info?.cor ?? ''}`}>
                  {Icon && <Icon size={13} />}
                  {item.tipo}
                </span>
              )
            },
          },
          { key: 'descricao', header: t('comum.descricao') },
        ]}
      />
    </div>
  )
}
