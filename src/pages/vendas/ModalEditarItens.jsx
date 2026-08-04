import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Botao from '../../components/Botao.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import SelectBusca from '../../components/SelectBusca.jsx'
import { calcularMargem } from '../../data/cambio.js'
import { formatarPercentual } from '../../utils/formato.js'
import { MOEDAS, UNIDADES_PESO } from '../../data/unidades.js'

// Edição direta dos itens da proposta. Serve pra corrigir o que foi digitado errado e pra
// montar propostas com mais de um produto — antes o preço/quantidade só mudavam registrando
// uma rodada de negociação, o que sujava o histórico com correções que não foram negociadas.
function linhaDe(item) {
  return {
    produtoId: String(item.produtoId ?? ''),
    ofertaCodigo: item.ofertaCodigo ?? '',
    quantidade: item.quantidade ?? '',
    unidade: item.unidade ?? 'ton',
    numeroContainers: item.numeroContainers ?? '',
    custoValor: item.precoCusto?.valor ?? '',
    custoMoeda: item.precoCusto?.moeda ?? 'USD',
    vendaValor: item.precoVenda?.valor ?? '',
    vendaMoeda: item.precoVenda?.moeda ?? 'USD',
  }
}

function linhaVazia() {
  return {
    produtoId: '',
    ofertaCodigo: '',
    quantidade: '',
    unidade: 'ton',
    numeroContainers: '',
    custoValor: '',
    custoMoeda: 'USD',
    vendaValor: '',
    vendaMoeda: 'USD',
  }
}

function paraItem(linha) {
  return {
    produtoId: Number(linha.produtoId),
    ofertaCodigo: linha.ofertaCodigo,
    quantidade: Number(linha.quantidade) || 0,
    unidade: linha.unidade,
    numeroContainers: linha.numeroContainers === '' ? null : Number(linha.numeroContainers),
    precoCusto: { valor: Number(linha.custoValor) || 0, moeda: linha.custoMoeda, unidade: linha.unidade },
    precoVenda: { valor: Number(linha.vendaValor) || 0, moeda: linha.vendaMoeda, unidade: linha.unidade },
  }
}

export default function ModalEditarItens({ open, onClose, proposta }) {
  const { propostas, produtos } = useData()
  const [linhas, setLinhas] = useState([])
  const [erro, setErro] = useState(null)

  useEffect(() => {
    if (open) {
      setLinhas(proposta.itens.map(linhaDe))
      setErro(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre
  }, [open])

  const produtosAtivos = produtos.items.filter((p) => p.situacao === 'Ativo')

  function atualizar(indice, mudancas) {
    setLinhas((atual) => atual.map((linha, i) => (i === indice ? { ...linha, ...mudancas } : linha)))
  }

  function salvar(e) {
    e.preventDefault()
    if (linhas.length === 0) {
      setErro('A proposta precisa ter ao menos um item.')
      return
    }
    if (linhas.some((l) => !l.produtoId)) {
      setErro('Selecione o produto em todos os itens.')
      return
    }
    propostas.editar(proposta.id, { itens: linhas.map(paraItem) })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Editar itens — ${proposta.numero}`}
      width="lg"
      footer={<ModalFooterAcoes onCancelar={onClose} formId="editar-itens-form" labelSalvar="Salvar itens" />}
    >
      <form id="editar-itens-form" onSubmit={salvar} className="flex flex-col gap-4">
        <p className="rounded-md border border-ayamo-border bg-ayamo-bg px-3 py-2 text-xs text-ayamo-text-mut">
          Correção direta dos itens — <strong>não cria rodada de negociação</strong>. Para registrar uma mudança
          acordada com o cliente, use o histórico de negociação abaixo da proposta.
        </p>

        {linhas.map((linha, indice) => {
          const margem =
            linha.custoValor !== '' && linha.vendaValor !== ''
              ? calcularMargem(
                  { valor: Number(linha.custoValor), moeda: linha.custoMoeda, unidade: linha.unidade },
                  { valor: Number(linha.vendaValor), moeda: linha.vendaMoeda, unidade: linha.unidade },
                )
              : null

          return (
            <div key={indice} className="rounded-lg border border-ayamo-border bg-ayamo-bg/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-ayamo-text-mut">
                  Item {indice + 1}
                  {linha.ofertaCodigo && <span className="ml-2 font-normal normal-case">· oferta {linha.ofertaCodigo}</span>}
                </span>
                <div className="flex items-center gap-3">
                  {margem && (
                    <span
                      className={`text-xs font-medium ${
                        margem.margemPercentual < 0 ? 'text-ayamo-danger' : 'text-ayamo-success'
                      }`}
                    >
                      Margem {formatarPercentual(margem.margemPercentual)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setLinhas((atual) => atual.filter((_, i) => i !== indice))}
                    className="rounded p-1 text-ayamo-danger transition-colors hover:bg-ayamo-danger/10"
                    aria-label={`Remover item ${indice + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Field label="Produto" required>
                  <SelectBusca
                    value={linha.produtoId}
                    onChange={(produtoId) => atualizar(indice, { produtoId })}
                    opcoes={produtosAtivos.map((p) => ({ value: p.id, label: p.nome }))}
                  />
                </Field>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Quantidade" required>
                    <CampoNumerico required value={linha.quantidade} onChange={(quantidade) => atualizar(indice, { quantidade })} />
                  </Field>
                  <Field label="Unidade" required>
                    <select className={inputClass} value={linha.unidade} onChange={(e) => atualizar(indice, { unidade: e.target.value })}>
                      {UNIDADES_PESO.map((u) => (
                        <option key={u.codigo} value={u.codigo}>
                          {u.codigo}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Contêineres">
                    <CampoNumerico
                      value={linha.numeroContainers}
                      onChange={(numeroContainers) => atualizar(indice, { numeroContainers })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <Field label="Preço de custo" required>
                    <CampoNumerico required value={linha.custoValor} onChange={(custoValor) => atualizar(indice, { custoValor })} />
                  </Field>
                  <Field label="Moeda">
                    <select className={inputClass} value={linha.custoMoeda} onChange={(e) => atualizar(indice, { custoMoeda: e.target.value })}>
                      {MOEDAS.map((m) => (
                        <option key={m.codigo} value={m.codigo}>
                          {m.codigo}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Preço de venda" required>
                    <CampoNumerico required value={linha.vendaValor} onChange={(vendaValor) => atualizar(indice, { vendaValor })} />
                  </Field>
                  <Field label="Moeda">
                    <select className={inputClass} value={linha.vendaMoeda} onChange={(e) => atualizar(indice, { vendaMoeda: e.target.value })}>
                      {MOEDAS.map((m) => (
                        <option key={m.codigo} value={m.codigo}>
                          {m.codigo}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          )
        })}

        <Botao variante="secundario" icone={Plus} onClick={() => setLinhas((atual) => [...atual, linhaVazia()])} className="w-fit">
          Adicionar item
        </Botao>

        {erro && <p className="text-sm text-ayamo-danger">{erro}</p>}
      </form>
    </Modal>
  )
}
