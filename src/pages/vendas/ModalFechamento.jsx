import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import { formatarPreco, formatarValor, formatarData, formatarPercentual } from '../../utils/formato.js'

export default function ModalFechamento({ open, onClose, proposta, itemAtual, produtoNome, resumoMargem }) {
  const { documentos, ofertas, getEmpresa } = useData()
  const navigate = useNavigate()
  const [visualizando, setVisualizando] = useState(null)
  const [documentoAtual, setDocumentoAtual] = useState(null)

  const ofertaVinculada = ofertas.items.find((o) => o.codigo === itemAtual.ofertaCodigo)

  function verDocumentoCompleto() {
    if (visualizando === 'Proforma Invoice') navigate(`/vendas/${proposta.numero}/proforma`)
    if (visualizando === 'PO' && ofertaVinculada) navigate(`/compras/${ofertaVinculada.codigoBase}/po`)
  }

  const cliente = getEmpresa(proposta.clienteId)

  function fechar() {
    setVisualizando(null)
    setDocumentoAtual(null)
    onClose()
  }

  function gerarOuAbrir(tipo) {
    const existente = documentos.items.find((d) => d.propostaId === proposta.id && d.tipo === tipo)
    const valorTotal = itemAtual.precoVenda.valor * itemAtual.quantidade
    const doc =
      existente ??
      documentos.criar({
        tipo,
        numero: `${tipo === 'PO' ? 'PO' : 'PI'}-${2000 + documentos.items.length}`,
        propostaId: proposta.id,
        propostaNumero: proposta.numero,
        clienteNome: cliente?.nome ?? '—',
        valor: valorTotal,
        moeda: itemAtual.precoVenda.moeda,
        data: new Date().toISOString().slice(0, 10),
        statusEnvio: 'Não enviado',
      })
    setDocumentoAtual(doc)
    setVisualizando(tipo)
  }

  return (
    <Modal open={open} onClose={fechar} title="Proposta fechada" width="md">
      {!visualizando && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ayamo-text-mut">Valores travados no fechamento:</p>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ayamo-text-mut">Cliente</dt>
              <dd className="font-medium text-ayamo-text">{cliente?.nome}</dd>
            </div>
            <div>
              <dt className="text-ayamo-text-mut">Produto</dt>
              <dd className="font-medium text-ayamo-text">{produtoNome}</dd>
            </div>
            <div>
              <dt className="text-ayamo-text-mut">Quantidade</dt>
              <dd className="font-medium text-ayamo-text">
                {itemAtual.quantidade.toLocaleString('pt-BR')} {itemAtual.unidade}
              </dd>
            </div>
            <div>
              <dt className="text-ayamo-text-mut">Preço de venda</dt>
              <dd className="font-medium text-ayamo-text">
                {formatarPreco(itemAtual.precoVenda.valor, itemAtual.precoVenda.moeda, itemAtual.unidade)}
              </dd>
            </div>
            <div>
              <dt className="text-ayamo-text-mut">Margem</dt>
              <dd className="font-medium text-ayamo-text">{formatarPercentual(resumoMargem.margemPercentual)}</dd>
            </div>
          </dl>

          <div className="flex gap-3 border-t border-ayamo-border pt-4">
            <button
              type="button"
              onClick={() => gerarOuAbrir('PO')}
              className="flex-1 rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Gerar PO
            </button>
            <button
              type="button"
              onClick={() => gerarOuAbrir('Proforma Invoice')}
              className="flex-1 rounded border border-ayamo-primary px-4 py-2 text-sm font-medium text-ayamo-primary hover:bg-ayamo-bg"
            >
              Gerar Proforma Invoice
            </button>
          </div>
        </div>
      )}

      {visualizando && documentoAtual && (
        <div className="flex flex-col gap-4">
          <div className="rounded border border-ayamo-border p-5">
            <h3 className="mb-4 text-center text-lg font-semibold text-ayamo-text">
              {visualizando === 'PO' ? 'Purchase Order' : 'Proforma Invoice'}
            </h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-ayamo-text-mut">Número</dt>
                <dd className="font-medium text-ayamo-text">{documentoAtual.numero}</dd>
              </div>
              <div>
                <dt className="text-ayamo-text-mut">Proposta de origem</dt>
                <dd className="font-medium text-ayamo-text">{documentoAtual.propostaNumero}</dd>
              </div>
              <div>
                <dt className="text-ayamo-text-mut">{visualizando === 'PO' ? 'Fornecedor' : 'Destinatário'}</dt>
                <dd className="font-medium text-ayamo-text">
                  {visualizando === 'PO' ? getEmpresa(ofertaVinculada?.fornecedorId)?.nome ?? '—' : documentoAtual.clienteNome}
                </dd>
              </div>
              <div>
                <dt className="text-ayamo-text-mut">Data</dt>
                <dd className="font-medium text-ayamo-text">{formatarData(documentoAtual.data)}</dd>
              </div>
              <div>
                <dt className="text-ayamo-text-mut">Produto</dt>
                <dd className="font-medium text-ayamo-text">{produtoNome}</dd>
              </div>
              <div>
                <dt className="text-ayamo-text-mut">Valor total</dt>
                <dd className="font-medium text-ayamo-text">{formatarValor(documentoAtual.valor, documentoAtual.moeda)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVisualizando(null)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              Voltar
            </button>
            {(visualizando === 'Proforma Invoice' || ofertaVinculada) && (
              <button
                type="button"
                onClick={verDocumentoCompleto}
                className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Ver documento completo
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
