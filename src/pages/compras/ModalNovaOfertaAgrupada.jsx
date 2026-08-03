import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useData } from '../../DataContext.jsx'
import Modal from '../../components/Modal.jsx'
import ModalFooterAcoes from '../../components/ModalFooterAcoes.jsx'
import Field, { inputClass } from '../../components/Field.jsx'
import CampoNumerico from '../../components/CampoNumerico.jsx'
import CampoData from '../../components/CampoData.jsx'
import SelectBusca from '../../components/SelectBusca.jsx'
import SecaoRecolhivel from '../../components/SecaoRecolhivel.jsx'
import { MOEDAS, INCOTERMS } from '../../data/unidades.js'
import { TIPOS_CONTAINER } from '../../data/tiposContainer.js'
import { TONELADAS_POR_CONTAINER } from '../../data/toneladasPorContainer.js'

function proximoCodigo(ofertas, jaCriadosNesteLote) {
  const numeros = [...ofertas.map((o) => o.codigoBase), ...jaCriadosNesteLote]
    .map((codigoBase) => Number(codigoBase.replace('OF-', '')))
    .filter((n) => !Number.isNaN(n))
  const proximo = Math.max(0, ...numeros) + 1
  return `OF-${String(proximo).padStart(4, '0')}`
}

function linhaVazia() {
  return { produtoId: '', quantidade: '', valor: '' }
}

function valoresIniciais() {
  return {
    tipoRegistro: 'Position',
    fornecedorId: '',
    tipoContainer: TIPOS_CONTAINER[0],
    numeroContainersTotal: '',
    moeda: 'USD',
    incoterm: 'CFR',
    portoOrigem: '',
    prazoPagamento: '',
    embarqueDe: '',
    embarqueAte: '',
    validadeAte: '',
    ayamoEntidadeId: '',
    observacao: '',
    linhas: [linhaVazia(), linhaVazia()],
  }
}

export default function ModalNovaOfertaAgrupada({ open, onClose, produtosAtivos, fornecedores, onCriada }) {
  const { ofertas, dadosAyamo, usuarioLogado } = useData()
  const [form, setForm] = useState(valoresIniciais())
  const [erros, setErros] = useState({})
  const entidadesAtivas = dadosAyamo.items.filter((e) => e.situacao === 'Ativo')

  useEffect(() => {
    if (!open) return
    setForm({ ...valoresIniciais(), ayamoEntidadeId: entidadesAtivas[0]?.id ?? '' })
    setErros({})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reinicializa quando o modal abre, não a cada render do pai
  }, [open])

  function fecharEResetar() {
    setForm(valoresIniciais())
    setErros({})
    onClose()
  }

  function atualizarLinha(index, campo, valor) {
    setForm((atual) => ({
      ...atual,
      linhas: atual.linhas.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)),
    }))
  }

  function adicionarLinha() {
    setForm((atual) => ({ ...atual, linhas: [...atual.linhas, linhaVazia()] }))
  }

  function removerLinha(index) {
    setForm((atual) => ({ ...atual, linhas: atual.linhas.filter((_, i) => i !== index) }))
  }

  const linhasValidas = form.linhas.filter((l) => l.produtoId && Number(l.quantidade) > 0)
  const totalAlocado = linhasValidas.reduce((soma, l) => soma + Number(l.quantidade || 0), 0)
  const capacidadeTotal = form.numeroContainersTotal === '' ? null : Number(form.numeroContainersTotal) * TONELADAS_POR_CONTAINER
  const excedeCapacidade = capacidadeTotal != null && totalAlocado > capacidadeTotal

  function salvar(e) {
    e.preventDefault()
    if (!form.fornecedorId || linhasValidas.length < 2) {
      setErros({ fornecedorId: !form.fornecedorId, linhas: linhasValidas.length < 2 })
      return
    }

    const grupoContainerId = `MIX-${Date.now()}`
    const hoje = new Date().toISOString().slice(0, 10)
    const codigosCriados = []
    const novas = linhasValidas.map((linha) => {
      const codigo = proximoCodigo(ofertas.items, codigosCriados)
      codigosCriados.push(codigo)
      return ofertas.criar({
        codigo,
        codigoBase: codigo,
        versao: 0,
        tipoRegistro: form.tipoRegistro,
        statusProducao: form.tipoRegistro === 'Position' ? 'Pronto para embarque' : null,
        produtoId: Number(linha.produtoId),
        fornecedorId: Number(form.fornecedorId),
        precoCusto: { valor: Number(linha.valor) || 0, moeda: form.moeda, unidade: 'ton' },
        numeroContainers: null,
        quantidade: Number(linha.quantidade),
        quantidadeOriginal: Number(linha.quantidade),
        unidade: 'ton',
        status: 'Disponível',
        data: hoje,
        usuarioId: usuarioLogado.id,
        observacao: form.observacao,
        numeroContrato: '',
        incoterm: form.incoterm,
        portoOrigem: form.portoOrigem,
        prazoPagamento: form.prazoPagamento,
        embarqueDe: form.embarqueDe,
        embarqueAte: form.embarqueAte,
        mfgSite: '',
        validadeAte: form.validadeAte,
        ayamoEntidadeId: form.ayamoEntidadeId ? Number(form.ayamoEntidadeId) : null,
        tipoContainer: form.tipoContainer,
        grupoContainerId,
        historicoNegociacao: [],
      })
    })

    fecharEResetar()
    onCriada(novas)
  }

  return (
    <Modal
      open={open}
      onClose={fecharEResetar}
      title="Nova oferta — mix container"
      width="lg"
      footer={<ModalFooterAcoes onCancelar={fecharEResetar} formId="oferta-agrupada-form" />}
    >
      <form id="oferta-agrupada-form" onSubmit={salvar} className="flex flex-col gap-4">
        <p className="text-sm text-ayamo-text-mut">
          Vários produtos embarcados juntos, compartilhando os mesmos contêineres — cada produto vira uma oferta
          própria (com estoque e negociação independentes), mas todas ficam marcadas como parte do mesmo pedido.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fornecedor" required error={erros.fornecedorId ? 'Selecione o fornecedor.' : undefined}>
            <SelectBusca
              value={form.fornecedorId}
              onChange={(fornecedorId) => setForm({ ...form, fornecedorId })}
              opcoes={fornecedores.map((f) => ({ value: f.id, label: f.nome }))}
              erro={erros.fornecedorId}
            />
          </Field>
          <Field label="Tipo de registro" required>
            <div className="flex gap-2">
              {['Oferta', 'Position'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm({ ...form, tipoRegistro: tipo })}
                  className={`flex-1 rounded border px-3 py-2 text-sm font-medium ${
                    form.tipoRegistro === tipo
                      ? 'border-ayamo-primary bg-ayamo-primary/10 text-ayamo-primary'
                      : 'border-ayamo-border text-ayamo-text-mut hover:bg-ayamo-bg'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Tipo de contêiner" required>
            <select className={inputClass} value={form.tipoContainer} onChange={(e) => setForm({ ...form, tipoContainer: e.target.value })}>
              {TIPOS_CONTAINER.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Número de contêineres" hint={`${TONELADAS_POR_CONTAINER} ton/contêiner — usado só como referência de capacidade`}>
            <CampoNumerico
              value={form.numeroContainersTotal}
              onChange={(numeroContainersTotal) => setForm({ ...form, numeroContainersTotal })}
            />
          </Field>
          <Field label="Moeda" required>
            <select className={inputClass} value={form.moeda} onChange={(e) => setForm({ ...form, moeda: e.target.value })}>
              {MOEDAS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.codigo}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ayamo-text">Produtos ({TONELADAS_POR_CONTAINER} ton/contêiner)</span>
            <button type="button" onClick={adicionarLinha} className="flex items-center gap-1 text-sm text-ayamo-primary hover:underline">
              <Plus size={14} />
              Adicionar produto
            </button>
          </div>
          {erros.linhas && (
            <p className="mb-2 text-xs text-ayamo-danger">
              Informe pelo menos 2 produtos com quantidade — pra 1 produto só use &ldquo;Nova oferta&rdquo; normal.
            </p>
          )}
          <div className="flex flex-col gap-2">
            {form.linhas.map((linha, index) => (
              <div key={index} className="grid grid-cols-[1fr_140px_140px_auto] items-center gap-2">
                <SelectBusca
                  value={linha.produtoId}
                  onChange={(produtoId) => atualizarLinha(index, 'produtoId', produtoId)}
                  opcoes={produtosAtivos.map((p) => ({ value: p.id, label: p.nome }))}
                  placeholder="Produto"
                />
                <CampoNumerico
                  placeholder="Ton"
                  value={linha.quantidade}
                  onChange={(quantidade) => atualizarLinha(index, 'quantidade', quantidade)}
                />
                <CampoNumerico
                  placeholder="Preço/ton"
                  value={linha.valor}
                  onChange={(valor) => atualizarLinha(index, 'valor', valor)}
                />
                <button
                  type="button"
                  onClick={() => removerLinha(index)}
                  disabled={form.linhas.length <= 2}
                  className="p-2 text-ayamo-danger hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className={`mt-2 text-xs ${excedeCapacidade ? 'font-medium text-ayamo-warning' : 'text-ayamo-text-mut'}`}>
            Total alocado: {totalAlocado.toLocaleString('pt-BR')} ton
            {capacidadeTotal != null && ` / ${capacidadeTotal.toLocaleString('pt-BR')} ton (capacidade informada)`}
            {excedeCapacidade && ' — acima da capacidade informada, confira o número de contêineres'}
          </p>
        </div>

        <Field label="Observação">
          <textarea
            className={inputClass}
            rows={2}
            value={form.observacao}
            onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          />
        </Field>

        <SecaoRecolhivel titulo="Dados para o PO (opcional)" aberturaInicial={false}>
          <div className="flex flex-col gap-4">
            {entidadesAtivas.length > 0 && (
              <Field label="Entidade Ayamo compradora">
                <select className={inputClass} value={form.ayamoEntidadeId} onChange={(e) => setForm({ ...form, ayamoEntidadeId: e.target.value })}>
                  {entidadesAtivas.map((ent) => (
                    <option key={ent.id} value={ent.id}>
                      {ent.razaoSocial}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Incoterm">
                <select className={inputClass} value={form.incoterm} onChange={(e) => setForm({ ...form, incoterm: e.target.value })}>
                  {INCOTERMS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Porto de origem">
                <input className={inputClass} value={form.portoOrigem} onChange={(e) => setForm({ ...form, portoOrigem: e.target.value })} />
              </Field>
            </div>
            <Field label="Prazo de pagamento">
              <input className={inputClass} value={form.prazoPagamento} onChange={(e) => setForm({ ...form, prazoPagamento: e.target.value })} />
            </Field>
            <Field label="Oferta válida até">
              <CampoData value={form.validadeAte} onChange={(validadeAte) => setForm({ ...form, validadeAte })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Embarque de">
                <CampoData value={form.embarqueDe} onChange={(embarqueDe) => setForm({ ...form, embarqueDe })} />
              </Field>
              <Field label="Embarque até">
                <CampoData value={form.embarqueAte} onChange={(embarqueAte) => setForm({ ...form, embarqueAte })} />
              </Field>
            </div>
          </div>
        </SecaoRecolhivel>
      </form>
    </Modal>
  )
}
