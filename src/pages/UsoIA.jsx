import { useEffect, useState } from 'react'
import { Sparkles, Hash, DollarSign, AlertTriangle } from 'lucide-react'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import PageHeader from '../components/PageHeader.jsx'
import KpiCard from '../components/KpiCard.jsx'
import BarraRanking from '../components/BarraRanking.jsx'
import CardList from '../components/CardList.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { obterUsoIA } from '../utils/iaImport.js'
import { chartColor } from '../utils/chartColors.js'
import { podeGerenciarUsuarios } from '../utils/permissoes.js'

function formatarUSD(valor) {
  return `US$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
}

function formatarDataHora(iso) {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function UsoIA() {
  const { usuarioLogado } = useData()
  const { t } = useI18n()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const podeVer = podeGerenciarUsuarios(usuarioLogado.perfil)

  useEffect(() => {
    if (!podeVer) return
    obterUsoIA()
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [podeVer])

  if (!podeVer) {
    return <EmptyState title={t('usoIA.restrito')} description={t('usoIA.restritoDica')} />
  }

  return (
    <div>
      <PageHeader title={t('usoIA.titulo')} subtitle={t('usoIA.subtitulo')} />

      {carregando && <p className="text-sm text-ayamo-text-mut">Carregando...</p>}
      {erro && <p className="rounded border border-ayamo-danger bg-ayamo-danger/10 px-4 py-3 text-sm text-ayamo-danger">{erro}</p>}

      {dados && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard label={t('usoIA.requisicoesMes')} value={dados.resumoMes.requisicoes} icon={Hash} tone="primary" />
            <KpiCard label={t('usoIA.custoMes')} value={formatarUSD(dados.resumoMes.custoUSD)} icon={DollarSign} tone="success" />
            <KpiCard
              label={t('usoIA.tokens')}
              value={(dados.resumoMes.tokensInput + dados.resumoMes.tokensOutput).toLocaleString('pt-BR')}
              icon={Sparkles}
              tone="teal"
            />
            <KpiCard label={t('usoIA.errosMes')} value={dados.resumoMes.erros} icon={AlertTriangle} tone={dados.resumoMes.erros > 0 ? 'danger' : 'primary'} />
          </div>

          {dados.porDia.length > 0 && (
            <div className="mb-6 rounded border border-ayamo-border bg-ayamo-surface p-5">
              <h2 className="mb-4 text-sm font-semibold text-ayamo-text">Custo por dia (mês atual)</h2>
              <BarraRanking
                linhas={dados.porDia.map((d, i) => ({ rotulo: d.dia.slice(8, 10) + '/' + d.dia.slice(5, 7), valor: d.custoUSD, cor: chartColor(i) }))}
                formatarValor={(v) => formatarUSD(v)}
              />
            </div>
          )}

          <h2 className="mb-3 text-base font-semibold text-ayamo-text">Histórico de requisições (últimas 200)</h2>
          <CardList
            rowKey={(item) => `${item.criado_em}-${item.tipo}`}
            data={dados.historico}
            emptyLabel={t('usoIA.vazio')}
            columns={[
              { key: 'criado_em', header: t('usoIA.dataHora'), render: (item) => formatarDataHora(item.criado_em) },
              { key: 'tipo', header: t('comum.tipo') },
              { key: 'usuario', header: t('usoIA.usuario'), render: (item) => item.usuario || '—' },
              { key: 'modelo', header: t('usoIA.modelo') },
              { key: 'tokens', header: 'Tokens', render: (item) => `${item.tokens_input} in / ${item.tokens_output} out` },
              { key: 'custo', header: t('usoIA.custo'), render: (item) => formatarUSD(item.custo_usd) },
              {
                key: 'status',
                header: t('comum.status'),
                render: (item) =>
                  item.sucesso ? (
                    <StatusBadge label={t('usoIA.sucesso')} tone="success" />
                  ) : (
                    <StatusBadge label={item.erro ? `Erro: ${item.erro}` : 'Erro'} tone="danger" />
                  ),
              },
            ]}
          />
        </>
      )}
    </div>
  )
}
