import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import { PAISES_QUALIFICACAO } from '../../data/qualificacaoPaises.js'
import { formatarValor } from '../../utils/formato.js'

const ABAS = ['Visão geral', 'Produtos', 'Contatos', 'Países']
const TONE_QUALIFICACAO = { Aprovado: 'success', 'Em andamento': 'warning', 'Não iniciado': 'neutral' }

function BotaoCopiar({ valor }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(valor)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 1500)
      }}
      className="text-ayamo-text-mut hover:text-ayamo-primary"
      title="Copiar"
    >
      {copiado ? <Check size={13} className="text-ayamo-success" /> : <Copy size={13} />}
    </button>
  )
}

export default function ModalDetalheEmpresa({ open, onClose, empresa }) {
  const { contatos, getUsuario } = useData()
  const [aba, setAba] = useState('Visão geral')

  if (!empresa) return null

  const contatosEmpresa = contatos.items.filter((c) => c.empresaId === empresa.id)
  const paises = [...new Set([...PAISES_QUALIFICACAO, ...Object.keys(empresa.qualificacoesPaises ?? {})])]

  return (
    <Modal open={open} onClose={onClose} title={empresa.nome} width="lg">
      <div className="mb-4 flex gap-1 border-b border-ayamo-border">
        {ABAS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAba(a)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              aba === a ? 'border-ayamo-primary text-ayamo-primary' : 'border-transparent text-ayamo-text-mut hover:text-ayamo-text'
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {aba === 'Visão geral' && (
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-ayamo-text-mut">Tipo</dt>
            <dd className="font-medium text-ayamo-text">{empresa.tipo}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">País</dt>
            <dd className="font-medium text-ayamo-text">{empresa.pais}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">CNPJ</dt>
            <dd className="font-medium text-ayamo-text">{empresa.cnpj || '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">SIF/SIPEAGRO</dt>
            <dd className="font-medium text-ayamo-text">{empresa.sif || '—'}</dd>
          </div>
          {empresa.marca && (
            <div>
              <dt className="text-ayamo-text-mut">Marca</dt>
              <dd className="font-medium text-ayamo-text">{empresa.marca}</dd>
            </div>
          )}
          <div>
            <dt className="text-ayamo-text-mut">Responsável Ayamo</dt>
            <dd className="font-medium text-ayamo-text">{getUsuario(empresa.responsavelAyamoId)?.nome ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Moeda padrão</dt>
            <dd className="font-medium text-ayamo-text">{empresa.moedaPadrao}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Limite de crédito</dt>
            <dd className="font-medium text-ayamo-text">{formatarValor(empresa.limiteCredito, empresa.moedaPadrao)}</dd>
          </div>
          <div>
            <dt className="text-ayamo-text-mut">Situação</dt>
            <dd>
              <StatusBadge label={empresa.situacao} tone={empresa.situacao === 'Ativo' ? 'success' : empresa.situacao === 'Bloqueado' ? 'danger' : 'neutral'} />
            </dd>
          </div>
          {empresa.endereco && (
            <div className="col-span-2">
              <dt className="text-ayamo-text-mut">Endereço</dt>
              <dd className="font-medium text-ayamo-text">{empresa.endereco}</dd>
            </div>
          )}
        </dl>
      )}

      {aba === 'Produtos' && (
        <div className="flex flex-col gap-2">
          {(empresa.produtosCapacidade ?? []).length === 0 ? (
            <p className="text-sm text-ayamo-text-mut">Nenhum produto cadastrado.</p>
          ) : (
            empresa.produtosCapacidade.map((p, indice) => (
              <div key={indice} className="flex items-center justify-between rounded border border-ayamo-border p-2 text-sm">
                <span className="text-ayamo-text">{p.nome}</span>
                <span className="text-ayamo-text-mut">
                  {Number(p.volumeMensal || 0).toLocaleString('pt-BR')} {p.unidade}/mês
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {aba === 'Contatos' && (
        <div className="flex flex-col gap-2">
          {contatosEmpresa.length === 0 ? (
            <p className="text-sm text-ayamo-text-mut">Nenhum contato cadastrado.</p>
          ) : (
            contatosEmpresa.map((c) => (
              <div key={c.id} className="rounded border border-ayamo-border p-2.5 text-sm">
                <p className="font-medium text-ayamo-text">{c.nome}</p>
                <p className="mb-1 text-xs text-ayamo-text-mut">{c.cargo}</p>
                <div className="flex items-center gap-1.5 text-ayamo-primary">
                  <span>{c.telefone}</span>
                  <BotaoCopiar valor={c.telefone} />
                </div>
                <div className="flex items-center gap-1.5 text-ayamo-primary">
                  <span>{c.email}</span>
                  <BotaoCopiar valor={c.email} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {aba === 'Países' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {paises.map((pais) => {
            const status = empresa.qualificacoesPaises?.[pais] ?? 'Não iniciado'
            return (
              <div key={pais} className="flex items-center justify-between gap-2 rounded border border-ayamo-border p-2 text-sm">
                <span className="text-ayamo-text">{pais}</span>
                <StatusBadge label={status} tone={TONE_QUALIFICACAO[status] ?? 'neutral'} />
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
