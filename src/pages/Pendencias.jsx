import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../DataContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'
import Botao from '../components/Botao.jsx'
import PageHeader from '../components/PageHeader.jsx'
import FilterBar from '../components/FilterBar.jsx'
import CardList from '../components/CardList.jsx'
import Field, { inputClass } from '../components/Field.jsx'
import ModalEnviarWhatsApp from '../components/ModalEnviarWhatsApp.jsx'
import { formatarData } from '../utils/formato.js'
import { modeloCobrancaProposta } from '../utils/mensagensWhatsApp.js'
import { linkDaPendencia } from '../utils/pendencias.js'

const STATUS_COBRAVEIS = ['Rascunho', 'Enviada', 'Em negociação']

export default function Pendencias() {
  const { usuarioLogado, getPendencias, propostas, contatos, getProduto } = useData()
  const { t } = useI18n()
  const navigate = useNavigate()
  const rotuloTipo = { proposta: t('pendencias.proposta'), oferta: t('pendencias.oferta'), followup: t('pendencias.followup') }
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [cobrancaAlvo, setCobrancaAlvo] = useState(null)

  const pendencias = useMemo(() => getPendencias(usuarioLogado), [getPendencias, usuarioLogado])

  const pendenciasFiltradas = useMemo(
    () => pendencias.filter((p) => !tipoFiltro || p.tipo === tipoFiltro),
    [pendencias, tipoFiltro],
  )

  function propostaCobravel(item) {
    if (item.tipo !== 'proposta') return null
    const proposta = propostas.items.find((p) => p.numero === item.id)
    return proposta && STATUS_COBRAVEIS.includes(proposta.status) ? proposta : null
  }

  const contatosAlvo = cobrancaAlvo ? contatos.items.filter((c) => c.empresaId === cobrancaAlvo.clienteId) : []

  return (
    <div>
      <PageHeader
        title={t('pendencias.titulo')}
        subtitle={t('pendencias.subtitulo', { nome: usuarioLogado.nome, perfil: usuarioLogado.perfil })}
      />

      <FilterBar>
        <Field label={t('comum.tipo')}>
          <select className={inputClass} value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
            <option value="">{t('comum.todos')}</option>
            <option value="proposta">{t('pendencias.proposta')}</option>
            <option value="oferta">{t('pendencias.oferta')}</option>
            <option value="followup">{t('pendencias.followup')}</option>
          </select>
        </Field>
      </FilterBar>

      <CardList
        rowKey={(item) => `${item.tipo}-${item.id}-${item.data}`}
        data={pendenciasFiltradas}
        emptyLabel={t('pendencias.vazio')}
        onRowClick={(item) => navigate(linkDaPendencia(item))}
        columns={[
          { key: 'titulo', header: t('comum.titulo') },
          { key: 'tipo', header: t('comum.tipo'), render: (item) => rotuloTipo[item.tipo] ?? item.tipo },
          { key: 'descricao', header: t('comum.descricao') },
          { key: 'data', header: t('comum.data'), render: (item) => formatarData(item.data) },
          {
            key: '_acoes',
            header: '',
            render: (item) => {
              const proposta = propostaCobravel(item)
              if (!proposta) return null
              return (
                <Botao
                  variante="alerta"
                  tamanho="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCobrancaAlvo(proposta)
                  }}
                >
                  {t('pendencias.cobrarWhatsApp')}
                </Botao>
              )
            },
          },
        ]}
      />

      <ModalEnviarWhatsApp
        open={Boolean(cobrancaAlvo)}
        onClose={() => setCobrancaAlvo(null)}
        titulo={`Cobrar resposta via WhatsApp — ${cobrancaAlvo?.numero ?? ''}`}
        contatos={contatosAlvo}
        modelo={cobrancaAlvo ? modeloCobrancaProposta(cobrancaAlvo, getProduto(cobrancaAlvo.itens[0].produtoId)?.nome) : null}
      />
    </div>
  )
}
