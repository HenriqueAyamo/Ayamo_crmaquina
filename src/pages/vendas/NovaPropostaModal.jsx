import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import { formatarPreco } from '../../utils/formato.js'
import { MOEDAS } from '../../data/unidades.js'

function proximoNumero(propostas) {
  const numeros = propostas.map((p) => Number(p.numero.replace('PROP-', '')))
  return `PROP-${Math.max(1000, ...numeros) + 1}`
}

function valoresIniciaisSelecao() {
  return {}
}

export default function NovaPropostaModal({ open, onClose, clientes, onCriada }) {
  const { ofertas, propostas, getProduto, usuarioLogado, ajustarEstoqueOferta } = useData()

  const [passo, setPasso] = useState(1)
  const [clienteId, setClienteId] = useState('')
  const [selecao, setSelecao] = useState(valoresIniciaisSelecao())

  const ofertasDisponiveis = ofertas.items.filter((o) => o.status === 'Disponível')

  function fecharEResetar() {
    setPasso(1)
    setClienteId('')
    setSelecao(valoresIniciaisSelecao())
    onClose()
  }

  function alternarOferta(oferta) {
    setSelecao((atual) => {
      if (atual[oferta.id]) {
        const { [oferta.id]: _removido, ...resto } = atual
        return resto
      }
      return {
        ...atual,
        [oferta.id]: {
          quantidade: oferta.quantidade,
          precoVenda: Math.round(oferta.precoCusto.valor * 1.15 * 100) / 100,
          moedaVenda: oferta.precoCusto.moeda,
        },
      }
    })
  }

  function atualizarSelecao(ofertaId, campo, valor) {
    setSelecao((atual) => ({ ...atual, [ofertaId]: { ...atual[ofertaId], [campo]: valor } }))
  }

  function criarProposta() {
    const itens = Object.entries(selecao).map(([ofertaId, dados]) => {
      const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
      return {
        produtoId: oferta.produtoId,
        ofertaCodigo: oferta.codigo,
        quantidade: Number(dados.quantidade),
        unidade: oferta.unidade,
        precoCusto: { ...oferta.precoCusto },
        precoVenda: { valor: Number(dados.precoVenda), moeda: dados.moedaVenda, unidade: oferta.unidade },
      }
    })

    const numero = proximoNumero(propostas.items)
    const hoje = new Date().toISOString().slice(0, 10)

    propostas.criar({
      numero,
      clienteId: Number(clienteId),
      vendedorId: usuarioLogado.id,
      status: 'Rascunho',
      dataEnvio: hoje,
      margemMinima: 10,
      itens,
      historicoNegociacao: [
        {
          rodada: 1,
          autor: 'Vendedor',
          tipo: 'Proposta inicial',
          preco: itens[0].precoVenda,
          quantidade: itens[0].quantidade,
          data: hoje,
          observacao: 'Proposta criada a partir das ofertas selecionadas.',
        },
      ],
    })

    itens.forEach((item) => ajustarEstoqueOferta(item.ofertaCodigo, -item.quantidade))

    fecharEResetar()
    onCriada(numero)
  }

  const selecaoValida = Object.entries(selecao).every(([ofertaId, dados]) => {
    const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
    const quantidade = Number(dados.quantidade)
    return oferta && quantidade > 0 && quantidade <= oferta.quantidade
  })

  const podeAvancar = clienteId !== ''
  const podeCriar = Object.keys(selecao).length > 0 && selecaoValida

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title={passo === 1 ? 'Nova proposta — escolha o cliente' : 'Nova proposta — ofertas e quantidades'}
      width="lg"
      footer={
        <>
          <button
            type="button"
            onClick={fecharEResetar}
            className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
          >
            Cancelar
          </button>
          {passo === 1 ? (
            <button
              type="button"
              disabled={!podeAvancar}
              onClick={() => setPasso(2)}
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              Próximo
            </button>
          ) : (
            <button
              type="button"
              disabled={!podeCriar}
              onClick={criarProposta}
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              Criar proposta
            </button>
          )}
        </>
      }
    >
      {passo === 1 && (
        <Field label="Cliente" required>
          <select className={inputClass} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.pais}
              </option>
            ))}
          </select>
        </Field>
      )}

      {passo === 2 && (
        <div className="flex flex-col gap-3">
          {ofertasDisponiveis.map((oferta) => {
            const produto = getProduto(oferta.produtoId)
            const marcada = Boolean(selecao[oferta.id])
            const quantidadeExcedida = marcada && Number(selecao[oferta.id].quantidade) > oferta.quantidade
            return (
              <div key={oferta.id} className="rounded border border-ayamo-border p-3">
                <label className="flex items-center gap-2 text-sm font-medium text-ayamo-text">
                  <input type="checkbox" checked={marcada} onChange={() => alternarOferta(oferta)} />
                  {produto?.nome} ({oferta.codigo}) —{' '}
                  {formatarPreco(oferta.precoCusto.valor, oferta.precoCusto.moeda, oferta.precoCusto.unidade)}
                  <span className="text-ayamo-text-mut">
                    · disponível: {oferta.quantidade.toLocaleString('pt-BR')} {oferta.unidade}
                  </span>
                </label>

                {marcada && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <Field label="Quantidade" error={quantidadeExcedida ? 'Acima do disponível' : undefined}>
                      <CampoNumerico
                        value={selecao[oferta.id].quantidade}
                        onChange={(valor) => atualizarSelecao(oferta.id, 'quantidade', valor)}
                      />
                    </Field>
                    <Field label="Preço de venda">
                      <CampoNumerico
                        value={selecao[oferta.id].precoVenda}
                        onChange={(valor) => atualizarSelecao(oferta.id, 'precoVenda', valor)}
                      />
                    </Field>
                    <Field label="Moeda de venda">
                      <select
                        className={inputClass}
                        value={selecao[oferta.id].moedaVenda}
                        onChange={(e) => atualizarSelecao(oferta.id, 'moedaVenda', e.target.value)}
                      >
                        {MOEDAS.map((m) => (
                          <option key={m.codigo} value={m.codigo}>
                            {m.codigo}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
