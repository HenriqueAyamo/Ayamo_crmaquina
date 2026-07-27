import { useEffect, useState } from 'react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import LinhaOfertaCliente from './LinhaOfertaCliente.jsx'
import PassoDadosProforma from './PassoDadosProforma.jsx'
import { useAutoSaveRascunho } from '../../hooks/useAutoSaveRascunho.js'

const CHAVE_RASCUNHO = 'ayamo_crm_v1_rascunho_novaProposta'

function baseProximoNumero(propostas) {
  const numeros = propostas.map((p) => Number(p.numero.replace('PROP-', '')))
  return Math.max(1000, ...numeros)
}

function valoresIniciaisProforma() {
  return {
    numeroContrato: '',
    incoterm: 'CIF',
    portoDestino: '',
    destinoFinal: '',
    prazoPagamento: '',
    embarqueDe: '',
    embarqueAte: '',
    consignatarioNome: '',
    consignatarioEndereco: '',
    ayamoEntidadeId: '',
  }
}

export default function NovaPropostaModal({ open, onClose, clientes, onCriada, ofertaFixa, clienteFixo }) {
  const { ofertas, propostas, dadosAyamo, getProduto, usuarioLogado, ajustarEstoqueOferta } = useData()

  const [passo, setPasso] = useState(1)
  const [clientesIds, setClientesIds] = useState([])
  const [selecao, setSelecao] = useState({})
  const [dadosProforma, setDadosProforma] = useState(valoresIniciaisProforma())
  const [margemMinima, setMargemMinima] = useState('10')
  const [margemMinimaTipo, setMargemMinimaTipo] = useState('percentual')
  const [mostrarRestaurar, setMostrarRestaurar] = useState(false)

  const autoSaveAtivo = !ofertaFixa && !clienteFixo
  const { rascunho, recarregar: recarregarRascunho, salvar: salvarRascunho, limpar: limparRascunho } = useAutoSaveRascunho(CHAVE_RASCUNHO)

  const ofertasDisponiveis = ofertaFixa
    ? [ofertaFixa]
    : ofertas.items.filter((o) => o.status === 'Disponível' && (o.tipoRegistro ?? 'Position') === 'Position')
  const clientesSelecionados = clientesIds.map((id) => clientes.find((c) => String(c.id) === id)).filter(Boolean)

  useEffect(() => {
    if (open && clienteFixo) {
      setClientesIds([String(clienteFixo.id)])
      setPasso(2)
    }
    if (open) {
      const ativa = dadosAyamo.items.find((e) => e.situacao === 'Ativo')
      if (ativa) setDadosProforma((atual) => ({ ...atual, ayamoEntidadeId: atual.ayamoEntidadeId || ativa.id }))
    }
    if (open && autoSaveAtivo) {
      const atual = recarregarRascunho()
      if (atual?.dados?.clientesIds?.length > 0) setMostrarRestaurar(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  useEffect(() => {
    if (!autoSaveAtivo || !open || mostrarRestaurar) return
    if (clientesIds.length === 0 && passo === 1) return
    salvarRascunho({ passo, clientesIds, selecao, dadosProforma, margemMinima, margemMinimaTipo })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- salvarRascunho é estável o suficiente; evita loop por identidade de função
  }, [autoSaveAtivo, open, mostrarRestaurar, passo, clientesIds, selecao, dadosProforma, margemMinima, margemMinimaTipo])

  function restaurarRascunho() {
    const dados = rascunho?.dados
    if (dados) {
      setPasso(dados.passo ?? 1)
      setClientesIds(dados.clientesIds ?? [])
      setSelecao(dados.selecao ?? {})
      setDadosProforma(dados.dadosProforma ?? valoresIniciaisProforma())
      setMargemMinima(dados.margemMinima ?? '10')
      setMargemMinimaTipo(dados.margemMinimaTipo ?? 'percentual')
    }
    setMostrarRestaurar(false)
  }

  function descartarRascunho() {
    limparRascunho()
    setMostrarRestaurar(false)
  }

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
    setDadosProforma(valoresIniciaisProforma())
    setMargemMinima('10')
    setMargemMinimaTipo('percentual')
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

    const numerosCriados = clientesSelecionados.map((cliente, index) => {
      const itensCliente = Object.entries(selecao)
        .map(([ofertaId, dados]) => {
          const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
          const porCliente = dados.porCliente[cliente.id]
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
        clienteId: cliente.id,
        vendedorId: usuarioLogado.id,
        status: 'Rascunho',
        dataEnvio: hoje,
        margemMinima: Number(margemMinima) || 0,
        margemMinimaTipo,
        itens: itensCliente,
        ...dadosProforma,
        ayamoEntidadeId: dadosProforma.ayamoEntidadeId ? Number(dadosProforma.ayamoEntidadeId) : null,
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
      const totalAlocado = clientesSelecionados.reduce((soma, cliente) => soma + Number(dados.porCliente[cliente.id]?.quantidade || 0), 0)
      ajustarEstoqueOferta(oferta.codigo, -totalAlocado)
    })

    if (autoSaveAtivo) limparRascunho()
    fecharEResetar()
    onCriada(numerosCriados)
  }

  const selecaoValida =
    clientesSelecionados.length > 0 &&
    Object.keys(selecao).length > 0 &&
    Object.entries(selecao).every(([ofertaId, dados]) => {
      const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
      const quantidades = clientesSelecionados.map((cliente) => Number(dados.porCliente[cliente.id]?.quantidade))
      const todasPreenchidas = quantidades.every((q) => q > 0)
      return oferta && todasPreenchidas
    })

  const excedeAlgumEstoque = Object.entries(selecao).some(([ofertaId, dados]) => {
    const oferta = ofertas.items.find((o) => o.id === Number(ofertaId))
    const total = clientesSelecionados.reduce((soma, cliente) => soma + Number(dados.porCliente[cliente.id]?.quantidade || 0), 0)
    return oferta && total > oferta.quantidade
  })

  const podeAvancar = clientesIds.length > 0
  const podeCriar = selecaoValida

  const TITULOS = {
    1: ofertaFixa ? `Gerar venda a partir de ${ofertaFixa.codigo} — escolha os clientes` : 'Nova proposta — escolha os clientes',
    2: clienteFixo ? `Gerar venda para ${clienteFixo.nome} — ofertas e quantidade` : 'Nova proposta — quantidade e preço por cliente',
    3: 'Nova proposta — dados para a Proforma',
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title={TITULOS[passo]}
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
          {passo > 1 && (
            <button
              type="button"
              onClick={() => setPasso(passo - 1)}
              className="rounded border border-ayamo-border px-4 py-2 text-sm font-medium text-ayamo-text hover:bg-ayamo-bg"
            >
              Voltar
            </button>
          )}
          {passo === 1 && (
            <button
              type="button"
              disabled={!podeAvancar}
              onClick={() => setPasso(2)}
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              Próximo
            </button>
          )}
          {passo === 2 && (
            <button
              type="button"
              disabled={!podeCriar}
              onClick={() => setPasso(3)}
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              Próximo
            </button>
          )}
          {passo === 3 && (
            <button
              type="button"
              onClick={criarProposta}
              className="rounded bg-ayamo-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Criar proposta
            </button>
          )}
        </>
      }
    >
      {mostrarRestaurar && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded border border-ayamo-accent/40 bg-ayamo-accent/10 px-3 py-2 text-sm text-ayamo-text">
          <span>Encontramos um rascunho não finalizado desta proposta. Quer continuar de onde parou?</span>
          <div className="flex flex-shrink-0 gap-2">
            <button type="button" onClick={restaurarRascunho} className="rounded border border-ayamo-primary px-3 py-1 text-xs font-medium text-ayamo-primary hover:bg-ayamo-primary/10">
              Restaurar
            </button>
            <button type="button" onClick={descartarRascunho} className="text-xs text-ayamo-text-mut hover:text-ayamo-text">
              Descartar
            </button>
          </div>
        </div>
      )}

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
          {excedeAlgumEstoque && (
            <p className="rounded border border-ayamo-warning bg-ayamo-warning/10 px-3 py-2 text-sm text-ayamo-warning">
              A quantidade alocada passa do estoque disponível em alguma oferta. Você pode seguir em frente — o comprador
              vai precisar repor o estoque, e o sistema avisa o vendedor da outra proposta se essa oferta esgotar.
            </p>
          )}
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

      {passo === 3 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Margem mínima aceitável" hint="Piso usado para colorir a margem em Vendas — não é mais fixo em 3%.">
              <CampoNumerico value={margemMinima} onChange={setMargemMinima} />
            </Field>
            <Field label="Tipo de margem">
              <select className={inputClass} value={margemMinimaTipo} onChange={(e) => setMargemMinimaTipo(e.target.value)}>
                <option value="percentual">% sobre o custo</option>
                <option value="valor">US$ por tonelada</option>
              </select>
            </Field>
          </div>

          <PassoDadosProforma
            dados={dadosProforma}
            onAtualizar={(campo, valor) => setDadosProforma((atual) => ({ ...atual, [campo]: valor }))}
          />
        </div>
      )}
    </Modal>
  )
}
