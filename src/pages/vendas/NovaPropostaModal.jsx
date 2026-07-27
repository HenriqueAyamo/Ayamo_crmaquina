import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field from '../../components/Field.jsx'
import LinhaOfertaCliente from './LinhaOfertaCliente.jsx'

function baseProximoNumero(propostas) {
  const numeros = propostas.map((p) => Number(p.numero.replace('PROP-', '')))
  return Math.max(1000, ...numeros)
}

export default function NovaPropostaModal({ open, onClose, clientes, onCriada, ofertaFixa }) {
  const { ofertas, propostas, getProduto, usuarioLogado, ajustarEstoqueOferta } = useData()

  const [passo, setPasso] = useState(1)
  const [clientesIds, setClientesIds] = useState([])
  const [selecao, setSelecao] = useState({})

  const ofertasDisponiveis = ofertaFixa ? [ofertaFixa] : ofertas.items.filter((o) => o.status === 'Disponível')
  const clientesSelecionados = clientesIds.map((id) => clientes.find((c) => String(c.id) === id)).filter(Boolean)

  useEffect(() => {
    if (!ofertaFixa) return
    setSelecao((atual) => {
      const existente = atual[ofertaFixa.id]?.porCliente ?? {}
      const porCliente = {}
      clientesIds.forEach((clienteId) => {
        porCliente[clienteId] = existente[clienteId] ?? {
          quantidade: '',
          precoVenda: Math.round(ofertaFixa.precoCusto.valor * 1.15 * 100) / 100,
          moedaVenda: ofertaFixa.precoCusto.moeda,
        }
      })
      return { ...atual, [ofertaFixa.id]: { porCliente } }
    })
  }, [ofertaFixa, clientesIds])

  function fecharEResetar() {
    setPasso(1)
    setClientesIds([])
    setSelecao({})
    onClose()
  }

  function alternarCliente(clienteId) {
    setClientesIds((atual) => (atual.includes(clienteId) ? atual.filter((id) => id !== clienteId) : [...atual, clienteId]))
  }

  function alternarOferta(oferta) {
    setSelecao((atual) => {
      if (atual[oferta.id]) {
        const { [oferta.id]: _removido, ...resto } = atual
        return resto
      }
      const porCliente = {}
      clientesIds.forEach((clienteId) => {
        porCliente[clienteId] = {
          quantidade: '',
          precoVenda: Math.round(oferta.precoCusto.valor * 1.15 * 100) / 100,
          moedaVenda: oferta.precoCusto.moeda,
        }
      })
      return { ...atual, [oferta.id]: { porCliente } }
    })
  }

  function atualizarSelecaoCliente(ofertaId, clienteId, campo, valor) {
    setSelecao((atual) => ({
      ...atual,
      [ofertaId]: {
        porCliente: {
          ...atual[ofertaId].porCliente,
          [clienteId]: { ...atual[ofertaId].porCliente[clienteId], [campo]: valor },
        },
      },
    }))
  }

  function criarProposta() {
    const base = baseProximoNumero(propostas.items)
    const hoje = new Date().toISOString().slice(0, 10)

    const numerosCriados = clientesIds.map((clienteId, index) => {
      const itensCliente = Object.entries(selecao)
        .map(([ofertaId, dados]) => {
          const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
          const porCliente = dados.porCliente[clienteId]
          return {
            produtoId: oferta.produtoId,
            ofertaCodigo: oferta.codigo,
            quantidade: Number(porCliente.quantidade),
            unidade: oferta.unidade,
            precoCusto: { ...oferta.precoCusto },
            precoVenda: { valor: Number(porCliente.precoVenda), moeda: porCliente.moedaVenda, unidade: oferta.unidade },
          }
        })
        .filter((item) => item.quantidade > 0)

      const numero = `PROP-${base + index + 1}`
      propostas.criar({
        numero,
        clienteId: Number(clienteId),
        vendedorId: usuarioLogado.id,
        status: 'Rascunho',
        dataEnvio: hoje,
        margemMinima: 10,
        itens: itensCliente,
        historicoNegociacao: [
          {
            rodada: 1,
            autor: 'Vendedor',
            tipo: 'Proposta inicial',
            preco: itensCliente[0].precoVenda,
            quantidade: itensCliente[0].quantidade,
            data: hoje,
            observacao: 'Proposta criada a partir das ofertas selecionadas.',
          },
        ],
      })
      return numero
    })

    // Estoque descontado pela soma real alocada a cada cliente (quantidades independentes por empresa).
    Object.entries(selecao).forEach(([ofertaId, dados]) => {
      const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
      const totalAlocado = clientesIds.reduce((soma, clienteId) => soma + Number(dados.porCliente[clienteId]?.quantidade || 0), 0)
      ajustarEstoqueOferta(oferta.codigo, -totalAlocado)
    })

    fecharEResetar()
    onCriada(numerosCriados)
  }

  const selecaoValida =
    Object.keys(selecao).length > 0 &&
    Object.entries(selecao).every(([ofertaId, dados]) => {
      const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
      const quantidades = clientesIds.map((clienteId) => Number(dados.porCliente[clienteId]?.quantidade))
      const todasPreenchidas = quantidades.every((q) => q > 0)
      const total = quantidades.reduce((a, b) => a + b, 0)
      return oferta && todasPreenchidas && total <= oferta.quantidade
    })

  const podeAvancar = clientesIds.length > 0
  const podeCriar = selecaoValida

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title={
        passo === 1
          ? ofertaFixa
            ? `Gerar venda a partir de ${ofertaFixa.codigo} — escolha os clientes`
            : 'Nova proposta — escolha os clientes'
          : 'Nova proposta — quantidade e preço por cliente'
      }
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
        <Field label="Clientes" required hint="Selecione um ou mais — uma proposta independente é criada para cada um.">
          <div className="flex flex-col gap-1 rounded border border-ayamo-border p-2">
            {clientes.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ayamo-text hover:bg-ayamo-bg">
                <input type="checkbox" checked={clientesIds.includes(String(c.id))} onChange={() => alternarCliente(String(c.id))} />
                {c.nome} — {c.pais}
              </label>
            ))}
          </div>
        </Field>
      )}

      {passo === 2 && (
        <div className="flex flex-col gap-3">
          {ofertasDisponiveis.map((oferta) => (
            <LinhaOfertaCliente
              key={oferta.id}
              oferta={oferta}
              produtoNome={getProduto(oferta.produtoId)?.nome}
              clientesSelecionados={clientesSelecionados}
              dados={selecao[oferta.id]}
              onToggle={alternarOferta}
              travada={Boolean(ofertaFixa)}
              onAtualizar={(clienteId, campo, valor) => atualizarSelecaoCliente(oferta.id, clienteId, campo, valor)}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}
