import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { lerLinhasExcel } from '../../utils/importarExcel.js'
import { formatarValor } from '../../utils/formato.js'
import { totalFreight } from '../../utils/frete.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'
import PreviewImportacao from '../../components/PreviewImportacao.jsx'
import MapeamentoColunas from '../../components/MapeamentoColunas.jsx'

const COLUNAS_ACEITAS =
  'Year, Quarter, Market, POL, POD, Container Type, Shipping Line, Commodity, Contract, Freight, BAF, EFS/PSS/GRI, Outras taxas, Cross trade, Reefer Monitoring, Origin free time, Destination free time, Validity from, Validity to, Comments'

const ALIASES = {
  ano: ['year', 'ano'],
  trimestre: ['quarter', 'trimestre'],
  mercado: ['market', 'mercado'],
  pol: ['pol'],
  pod: ['pod'],
  tipoContainer: ['container type', 'tipo de contêiner', 'tipo de container', 'container'],
  transportadora: ['shipping line / agent', 'shipping line', 'agent', 'transportadora', 'armador'],
  commodity: ['commodity'],
  contrato: ['contract', 'contrato'],
  custoFreight: ['freight'],
  custoBaf: ['baf'],
  custoEfsPssGri: ['efs/pss/gri', 'efs / pss / gri', 'efs pss gri'],
  custoOutrasTaxas: ['outras taxas', 'other charges'],
  custoCrossTrade: ['cross trade'],
  custoReeferMonitoring: ['reefer monitoring'],
  origemFreeTime: ['origin free time'],
  destinoFreeTime: ['destination free time'],
  vigenciaDe: ['validity from'],
  vigenciaAte: ['validity to'],
  observacao: ['comments', 'comentarios', 'comentários'],
}

const CAMPOS_MAPEAVEIS = [
  { chave: 'pol', label: 'POL', obrigatorio: true },
  { chave: 'pod', label: 'POD', obrigatorio: true },
  { chave: 'transportadora', label: 'Shipping Line / Agent', obrigatorio: true },
  { chave: 'custoFreight', label: 'Freight', obrigatorio: true },
  { chave: 'ano', label: 'Year', obrigatorio: false },
  { chave: 'trimestre', label: 'Quarter', obrigatorio: false },
  { chave: 'mercado', label: 'Market', obrigatorio: false },
  { chave: 'tipoContainer', label: 'Container Type', obrigatorio: false },
  { chave: 'commodity', label: 'Commodity', obrigatorio: false },
  { chave: 'contrato', label: 'Contract', obrigatorio: false },
  { chave: 'custoBaf', label: 'BAF', obrigatorio: false },
  { chave: 'custoEfsPssGri', label: 'EFS/PSS/GRI', obrigatorio: false },
  { chave: 'custoOutrasTaxas', label: 'Outras taxas', obrigatorio: false },
  { chave: 'custoCrossTrade', label: 'Cross trade', obrigatorio: false },
  { chave: 'custoReeferMonitoring', label: 'Reefer Monitoring', obrigatorio: false },
  { chave: 'origemFreeTime', label: 'Origin free time', obrigatorio: false },
  { chave: 'destinoFreeTime', label: 'Destination free time', obrigatorio: false },
  { chave: 'vigenciaDe', label: 'Validity from', obrigatorio: false },
  { chave: 'vigenciaAte', label: 'Validity to', obrigatorio: false },
  { chave: 'observacao', label: 'Comments', obrigatorio: false },
]

const CAMPOS_NUMERICOS = [
  'custoFreight',
  'custoBaf',
  'custoEfsPssGri',
  'custoOutrasTaxas',
  'custoCrossTrade',
  'custoReeferMonitoring',
]

function primeiroNumero(bruto) {
  if (bruto == null || bruto === '') return 0
  const texto = String(bruto).replace(',', '.')
  const match = texto.match(/[\d.]+/)
  return match ? Number(match[0]) : 0
}

function paraDataBR(bruto) {
  if (bruto == null || bruto === '') return ''
  if (bruto instanceof Date) {
    const dia = String(bruto.getDate()).padStart(2, '0')
    const mes = String(bruto.getMonth() + 1).padStart(2, '0')
    return `${dia}/${mes}/${bruto.getFullYear()}`
  }
  const texto = String(bruto).trim()
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)) return texto
  const data = new Date(texto)
  if (Number.isNaN(data.getTime())) return texto
  const dia = String(data.getDate()).padStart(2, '0')
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${data.getFullYear()}`
}

export default function ImportarPlanilhaFretes({ onImportado }) {
  const { fretes, usuarioLogado } = useData()
  const [preview, setPreview] = useState(null)
  const [resumoFinal, setResumoFinal] = useState(null)
  const [linhasBrutas, setLinhasBrutas] = useState(null)
  const [colunasDetectadas, setColunasDetectadas] = useState([])
  const [mapeamento, setMapeamento] = useState({})

  function montarLinhaFrete(numeroLinha, bruto) {
    if (!bruto.pol) return { numeroLinha, status: 'erro', mensagem: 'POL não informado' }
    if (!bruto.pod) return { numeroLinha, status: 'erro', mensagem: 'POD não informado' }
    if (!bruto.transportadora) return { numeroLinha, status: 'erro', mensagem: 'Shipping Line / Agent não informado' }

    const dadosCriacao = {
      ano: bruto.ano ? String(bruto.ano) : String(new Date().getFullYear()),
      trimestre: bruto.trimestre ? String(bruto.trimestre).toUpperCase() : '',
      mercado: bruto.mercado ?? '',
      pol: String(bruto.pol),
      pod: String(bruto.pod),
      tipoContainer: bruto.tipoContainer ?? '',
      transportadora: String(bruto.transportadora),
      commodity: bruto.commodity ?? '',
      contrato: bruto.contrato ?? '',
      custoFreight: primeiroNumero(bruto.custoFreight),
      custoBaf: primeiroNumero(bruto.custoBaf),
      custoEfsPssGri: primeiroNumero(bruto.custoEfsPssGri),
      custoOutrasTaxas: primeiroNumero(bruto.custoOutrasTaxas),
      custoCrossTrade: primeiroNumero(bruto.custoCrossTrade),
      custoReeferMonitoring: primeiroNumero(bruto.custoReeferMonitoring),
      origemFreeTime: bruto.origemFreeTime ? String(bruto.origemFreeTime) : '',
      destinoFreeTime: bruto.destinoFreeTime ? String(bruto.destinoFreeTime) : '',
      vigenciaDe: paraDataBR(bruto.vigenciaDe),
      vigenciaAte: paraDataBR(bruto.vigenciaAte),
      observacao: bruto.observacao ?? '',
    }

    return {
      numeroLinha,
      status: 'ok',
      titulo: `${dadosCriacao.pol} → ${dadosCriacao.pod} — ${dadosCriacao.transportadora}`,
      detalhe: `Total freight: ${formatarValor(totalFreight(dadosCriacao), 'USD')}`,
      campos: [
        { label: 'Year/Quarter', valor: `${dadosCriacao.ano} ${dadosCriacao.trimestre}` },
        { label: 'Market', valor: dadosCriacao.mercado },
        { label: 'Container Type', valor: dadosCriacao.tipoContainer },
        { label: 'Commodity', valor: dadosCriacao.commodity },
        { label: 'Contract', valor: dadosCriacao.contrato },
        { label: 'Origin free time', valor: dadosCriacao.origemFreeTime },
        { label: 'Destination free time', valor: dadosCriacao.destinoFreeTime },
        { label: 'Validity', valor: `${dadosCriacao.vigenciaDe || '—'} → ${dadosCriacao.vigenciaAte || '—'}` },
      ],
      dadosCriacao,
    }
  }

  function iniciarMapeamento(linhas) {
    setResumoFinal(null)
    if (linhas.length === 0) {
      setResumoFinal({ total: 0, importadas: 0, erros: ['A planilha não tem nenhuma linha de dados.'] })
      return
    }
    const colunas = Object.keys(linhas[0])
    const sugestao = {}
    CAMPOS_MAPEAVEIS.forEach(({ chave }) => {
      const aliasesCampo = ALIASES[chave] ?? []
      sugestao[chave] = colunas.find((c) => aliasesCampo.includes(c.trim().toLowerCase())) ?? ''
    })
    setColunasDetectadas(colunas)
    setMapeamento(sugestao)
    setLinhasBrutas(linhas)
  }

  function aplicarMapeamento() {
    const linhasPreview = linhasBrutas.map((linha, index) => {
      const valorDaColuna = (chave) => (mapeamento[chave] ? linha[mapeamento[chave]] : undefined)
      const bruto = {}
      CAMPOS_MAPEAVEIS.forEach(({ chave }) => {
        bruto[chave] = valorDaColuna(chave)
      })
      return montarLinhaFrete(index + 2, bruto)
    })

    setLinhasBrutas(null)
    setPreview(linhasPreview)
  }

  function confirmarImportacao() {
    let importadas = 0
    const erros = []

    preview.forEach((linha) => {
      if (linha.status !== 'ok') {
        erros.push(`Linha ${linha.numeroLinha}: ${linha.mensagem}`)
        return
      }
      importadas += 1
      fretes.criar({ ...linha.dadosCriacao, usuarioId: usuarioLogado.id, data: new Date().toISOString().slice(0, 10) })
    })

    setResumoFinal({ total: preview.length, importadas, erros })
    setPreview(null)
    onImportado?.()
  }

  const validas = preview?.filter((l) => l.status === 'ok').length ?? 0

  return (
    <div className="flex flex-col gap-3">
      <UploadPlanilha
        onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(iniciarMapeamento)}
        hint={
          <>
            Cabeçalhos aceitos: <strong>{COLUNAS_ACEITAS}</strong>. Se sua planilha usar outros nomes de coluna, tudo
            bem — o próximo passo deixa você confirmar o mapeamento. Valores numéricos ({CAMPOS_NUMERICOS.length} campos
            de custo) são somados automaticamente no Total freight.
          </>
        }
        mensagemResumo={resumoFinal && `${resumoFinal.importadas} de ${resumoFinal.total} linha(s) importadas com sucesso.`}
        erros={resumoFinal?.erros}
      />

      {linhasBrutas && (
        <MapeamentoColunas
          campos={CAMPOS_MAPEAVEIS}
          colunasDetectadas={colunasDetectadas}
          mapeamento={mapeamento}
          onMudarCampo={(chave, coluna) => setMapeamento((atual) => ({ ...atual, [chave]: coluna }))}
          totalLinhas={linhasBrutas.length}
          onCancelar={() => setLinhasBrutas(null)}
          onContinuar={aplicarMapeamento}
        />
      )}

      {preview && (
        <PreviewImportacao
          linhas={preview}
          validas={validas}
          onConfirmar={confirmarImportacao}
          onCancelar={() => setPreview(null)}
          labelConfirmar="Confirmar importação"
        />
      )}
    </div>
  )
}
