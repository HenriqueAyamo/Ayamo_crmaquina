import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, ShoppingCart, TrendingUp, FileText, AlertTriangle, ClipboardList, Ship } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import CardList from '../components/CardList.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { formatarData } from '../utils/formato.js'
import PopupNovidadesDemandas from '../components/PopupNovidadesDemandas.jsx'
import { obterOfertasAtuais } from '../utils/ofertasAtuais.js'

const ICONE_TIPO = {
  Compras: { icon: ShoppingCart, cor: 'text-ayamo-primary' },
  Vendas: { icon: TrendingUp, cor: 'text-ayamo-success' },
  Documentos: { icon: FileText, cor: 'text-ayamo-text-mut' },
  Claims: { icon: AlertTriangle, cor: 'text-ayamo-danger' },
  Demandas: { icon: ClipboardList, cor: 'text-ayamo-accent' },
  Freight: { icon: Ship, cor: 'text-ayamo-teal' },
}

function CartaoNumerico({ label, valor }) {
  return (
    <div className="rounded border border-ayamo-border bg-ayamo-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ayamo-text-mut">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ayamo-text">{valor}</p>
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
  const navigate = useNavigate()

  const ofertasAtivas = obterOfertasAtuais(ofertas.items).filter((o) => o.status === 'Disponível' || o.status === 'Em revisão').length
  const propostasEmNegociacao = propostas.items.filter((p) => p.status === 'Em negociação').length
  const propostasAguardandoAprovacao = propostas.items.filter((p) => p.status === 'Aguardando aprovação').length

  const mesReferencia = documentos.items.reduce((max, d) => (d.data > max ? d.data : max), '0000-00-00').slice(0, 7)
  const documentosNoMes = documentos.items.filter((d) => d.data.slice(0, 7) === mesReferencia).length

  const pendencias = useMemo(() => getPendencias(usuarioLogado), [getPendencias, usuarioLogado])

  const movimentacoes = useMemo(() => {
    const deOfertas = ofertas.items.map((o) => ({
      data: o.data,
      tipo: 'Compras',
      refId: o.codigoBase,
      descricao: `${o.codigo} — ${getProduto(o.produtoId)?.nome ?? ''} (${o.status})`,
    }))

    const deVendas = propostas.items.flatMap((p) =>
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

    const deClaims = claims.items.map((c) => ({
      data: c.data,
      tipo: 'Claims',
      refId: null,
      descricao: `Claim registrado — ${getProduto(c.produtoId)?.nome ?? ''} × ${getEmpresa(c.fornecedorId)?.nome ?? ''} (${c.status})`,
    }))

    const deDemandas = demandas.items.map((d) => ({
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
  }, [ofertas.items, propostas.items, documentos.items, claims.items, demandas.items, fretes.items, getProduto, getEmpresa])

  return (
    <div>
      <PopupNovidadesDemandas />
      <h1 className="mb-5 text-xl font-semibold text-ayamo-text">Início</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <CartaoNumerico label="Ofertas ativas" valor={ofertasAtivas} />
        <CartaoNumerico label="Propostas em negociação" valor={propostasEmNegociacao} />
        <CartaoNumerico label="Aguardando aprovação de margem" valor={propostasAguardandoAprovacao} />
        <CartaoNumerico label="Documentos emitidos no mês" valor={documentosNoMes} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <AlertCircle size={16} className="text-ayamo-accent" />
        <h2 className="text-base font-semibold text-ayamo-text">
          Minhas pendências <span className="font-normal text-ayamo-text-mut">— visão de {usuarioLogado.nome} ({usuarioLogado.perfil})</span>
        </h2>
      </div>

      {pendencias.length === 0 ? (
        <EmptyState title="Nada pendente para este usuário" description="Troque o usuário logado no topo da tela para ver outra visão." />
      ) : (
        <ul className="mb-8 flex flex-col gap-2">
          {pendencias.map((p) => (
            <li key={`${p.tipo}-${p.id}-${p.data}`}>
              <button
                type="button"
                onClick={() => navigate(p.tipo === 'oferta' ? `/compras/${p.id}` : `/vendas/${p.id}`)}
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

      <h2 className="mb-3 text-base font-semibold text-ayamo-text">Últimas movimentações</h2>
      <CardList
        rowKey={(item) => `${item.data}-${item.descricao}`}
        data={movimentacoes}
        onRowClick={(item) => navigate(linkDaMovimentacao(item))}
        columns={[
          { key: 'data', header: 'Data', render: (item) => formatarData(item.data) },
          {
            key: 'tipo',
            header: 'Tipo',
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
          { key: 'descricao', header: 'Descrição' },
        ]}
      />
    </div>
  )
}
