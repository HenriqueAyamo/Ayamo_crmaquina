import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Package, Globe, Boxes, ChevronDown, ChevronUp } from 'lucide-react'
import KpiCard from '../../components/KpiCard.jsx'
import BarraRanking from '../../components/BarraRanking.jsx'
import { CATEGORIAS_PRODUTO, classificarProduto } from '../../utils/categoriaProdutos.js'
import { contarAprovacoes } from '../../data/qualificacaoPaises.js'
import { chartColor } from '../../utils/chartColors.js'

function TarefaCard({ titulo, empresas }) {
  const [aberto, setAberto] = useState(false)
  if (empresas.length === 0) return null

  return (
    <div className="rounded border border-ayamo-border bg-ayamo-surface p-3">
      <button type="button" onClick={() => setAberto((atual) => !atual)} className="flex w-full items-center justify-between text-left text-sm">
        <span className="text-ayamo-text">
          <strong className="text-ayamo-warning">{empresas.length}</strong> {titulo}
        </span>
        {aberto ? <ChevronUp size={14} className="text-ayamo-text-mut" /> : <ChevronDown size={14} className="text-ayamo-text-mut" />}
      </button>
      {aberto && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-ayamo-border pt-2">
          {empresas.map((e) => (
            <li key={e.id}>
              <Link to={`/empresas/${e.id}`} className="text-xs text-ayamo-primary hover:underline">
                {e.nome}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function SupplierDashboard({ fornecedores, contatos }) {
  const kpis = useMemo(() => {
    const totalProdutos = fornecedores.reduce((soma, e) => soma + (e.produtosCapacidade ?? []).length, 0)
    const volumeMensalTotal = fornecedores.reduce(
      (soma, e) => soma + (e.produtosCapacidade ?? []).reduce((s, p) => s + Number(p.volumeMensal || 0), 0),
      0,
    )
    const paisesAprovados = fornecedores.reduce((soma, e) => soma + contarAprovacoes(e.qualificacoesPaises).emAndamentoOuAprovado, 0)
    const paisesTotal = fornecedores.reduce((soma, e) => soma + contarAprovacoes(e.qualificacoesPaises).total, 0)
    return { totalFornecedores: fornecedores.length, totalProdutos, volumeMensalTotal, paisesAprovados, paisesTotal }
  }, [fornecedores])

  const categorias = useMemo(() => {
    const mapa = new Map(CATEGORIAS_PRODUTO.map((c) => [c, 0]))
    fornecedores.forEach((e) => {
      const categoriasEmpresa = new Set((e.produtosCapacidade ?? []).map((p) => classificarProduto(p.nome)))
      categoriasEmpresa.forEach((c) => mapa.set(c, (mapa.get(c) ?? 0) + 1))
    })
    return [...mapa.entries()]
      .filter(([, valor]) => valor > 0)
      .map(([rotulo, valor], indice) => ({ rotulo, valor, cor: chartColor(indice) }))
      .sort((a, b) => b.valor - a.valor)
  }, [fornecedores])

  const tarefas = useMemo(() => {
    const semContato = fornecedores.filter((e) => !contatos.some((c) => c.empresaId === e.id))
    const semProdutos = fornecedores.filter((e) => (e.produtosCapacidade ?? []).length === 0)
    const qualificacaoTravada = fornecedores.filter((e) =>
      Object.values(e.qualificacoesPaises ?? {}).includes('Em andamento'),
    )
    const baixaCobertura = fornecedores.filter((e) => {
      const { emAndamentoOuAprovado, total } = contarAprovacoes(e.qualificacoesPaises)
      return total > 0 && emAndamentoOuAprovado / total < 0.3
    })
    return { semContato, semProdutos, qualificacaoTravada, baixaCobertura }
  }, [fornecedores, contatos])

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Fornecedores" value={kpis.totalFornecedores} icon={Building2} tone="primary" />
        <KpiCard label="Produtos cadastrados" value={kpis.totalProdutos} icon={Package} tone="teal" />
        <KpiCard
          label="Qualificações"
          value={kpis.paisesTotal > 0 ? `${kpis.paisesAprovados}/${kpis.paisesTotal}` : '—'}
          icon={Globe}
          tone="success"
        />
        <KpiCard label="Volume mensal (ton)" value={kpis.volumeMensalTotal.toLocaleString('pt-BR')} icon={Boxes} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {categorias.length > 0 && (
          <div className="rounded border border-ayamo-border bg-ayamo-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-ayamo-text">Fornecedores por categoria de produto</h2>
            <BarraRanking linhas={categorias} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-ayamo-text">Tarefas sugeridas</h2>
          <TarefaCard titulo="fornecedor(es) sem contato comercial cadastrado" empresas={tarefas.semContato} />
          <TarefaCard titulo="fornecedor(es) sem produto cadastrado" empresas={tarefas.semProdutos} />
          <TarefaCard titulo="fornecedor(es) com qualificação parada em 'Em andamento'" empresas={tarefas.qualificacaoTravada} />
          <TarefaCard titulo="fornecedor(es) com baixa cobertura de qualificação por país" empresas={tarefas.baixaCobertura} />
          {Object.values(tarefas).every((lista) => lista.length === 0) && (
            <p className="text-sm text-ayamo-text-mut">Nenhuma pendência encontrada — tudo em dia.</p>
          )}
        </div>
      </div>
    </div>
  )
}
