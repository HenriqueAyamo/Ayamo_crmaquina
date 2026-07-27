import { useParams } from 'react-router-dom'
import { useData } from '../../DataContext.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PaginaDocumento from '../../components/PaginaDocumento.jsx'
import { formatarData, formatarValor } from '../../utils/formato.js'
import { saudacaoComercial } from '../../utils/saudacao.js'

const TERMOS = [
  'INCOTERMS 2010 to apply unless otherwise specified;',
  'Proforma Invoice with all the details agreed with the Buyer should be sent by the Seller;',
  'Shipment period agreed in this contract must be respected. Any variation must be accepted by AYAMO in a written form and may lead to a cancellation of this contract;',
  'All goods under this contract must be from establishments duly approved for the country of destination. In case the country of origin is banned or the plant is delisted by the country of destination, buyer has the right to cancel the contract;',
  'Documentary instructions must be provided by the Buyer in time for the shipment period agreed;',
  'All original documents required for releasing the goods at the country of destination must be provided by the Seller;',
  'Ticket scale with the weight of the container before shipment must be provided if Buyer requires;',
  'Samples of the labels must be provided by Seller if Buyer requires.',
]

export default function DocumentoPO() {
  const { id } = useParams()
  const { ofertas, propostas, contatos, categoriasContato, getProduto, getEmpresa, dadosAyamo } = useData()

  const versoes = ofertas.items.filter((o) => o.codigoBase === id).sort((a, b) => a.versao - b.versao)
  const atual = versoes[versoes.length - 1]

  if (!atual) return <EmptyState title="Oferta não encontrada" />

  const produto = getProduto(atual.produtoId)
  const fornecedor = getEmpresa(atual.fornecedorId)
  const propostaVinculada = propostas.items.find((p) => p.itens.some((i) => i.ofertaCodigo === atual.codigo))
  const hoje = formatarData(new Date())
  const total = atual.quantidade * atual.precoCusto.valor
  const contatosFornecedor = contatos.items.filter((c) => c.empresaId === atual.fornecedorId)
  const saudacao = saudacaoComercial(contatosFornecedor, categoriasContato.items)

  const corpoEmail = `${saudacao},

As per our agreement, on behalf of Ayamo, it's a pleasure to confirm this new business.

Purchase confirmation
Quantity: 1
Brand/Country of Origin: ${fornecedor?.nome ?? ''} (${fornecedor?.pais ?? ''} Origin) - ${fornecedor?.pais ?? ''}
Incoterm/Port of Destination: ${atual.incoterm ?? ''} - ${propostaVinculada?.portoDestino ?? 'TBI'}
Shipment from/to: ${atual.embarqueDe || 'TBI'} - ${atual.embarqueAte || 'TBI'}

${atual.quantidade.toLocaleString('pt-BR')} ${atual.unidade.toUpperCase()} - ${produto?.nome ?? ''}${produto?.embalagem ? ' - ' + produto.embalagem : ''} - ${atual.precoCusto.moeda} ${atual.precoCusto.valor}

Remarks: ${atual.observacao ?? ''}
Find attached our PO(s) with all the details.

Kindly send to us your PFI(s).

Our Operational Team will be in touch for further instructions.

Thanks for the business`

  return (
    <PaginaDocumento voltarPara={`/compras/${id}`} corpoEmail={corpoEmail}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-gray-800">AYAMO</p>
          <p className="text-xs tracking-widest text-gray-500">GLOBAL FOODS</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-semibold text-gray-800">PURCHASE ORDER</h1>
          <p className="text-sm text-gray-600">Date: {hoje}</p>
        </div>
      </div>

      <p className="mb-4 text-sm font-semibold text-gray-800">Contract No.: {atual.numeroContrato || atual.codigo}</p>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-gray-800">Seller:</p>
          <p className="font-medium text-gray-800">{fornecedor?.nome}</p>
          <p className="whitespace-pre-line text-gray-600">{fornecedor?.endereco || '—'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Buyer:</p>
          <p className="font-medium text-gray-800">{dadosAyamo.razaoSocial || 'AYAMO'}</p>
          <p className="whitespace-pre-line text-gray-600">{dadosAyamo.endereco || '—'}</p>
        </div>
      </div>

      <table className="mb-4 w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left">FCL</th>
            <th className="border border-gray-300 p-2 text-left">PRODUCTS</th>
            <th className="border border-gray-300 p-2 text-left">VOLUME</th>
            <th className="border border-gray-300 p-2 text-left">PRICE</th>
            <th className="border border-gray-300 p-2 text-left">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2 align-top">1</td>
            <td className="border border-gray-300 p-2 align-top">
              <p>
                {produto?.nome}
                {produto?.embalagem ? ` - ${produto.embalagem}` : ''}
              </p>
              <p className="text-xs text-gray-600">
                BRAND: {fornecedor?.nome} ({fornecedor?.pais} Origin)
                {produto?.validadeMeses ? ` - EXPIRY DATE: ${produto.validadeMeses} Months` : ''}
              </p>
            </td>
            <td className="border border-gray-300 p-2 align-top">
              {atual.quantidade.toLocaleString('pt-BR')} {atual.unidade.toUpperCase()}
            </td>
            <td className="border border-gray-300 p-2 align-top">{formatarValor(atual.precoCusto.valor, atual.precoCusto.moeda)}</td>
            <td className="border border-gray-300 p-2 align-top">{formatarValor(total, atual.precoCusto.moeda)}</td>
          </tr>
          <tr className="font-semibold">
            <td className="border border-gray-300 p-2" colSpan={2}>
              TOTAL
            </td>
            <td className="border border-gray-300 p-2">
              {atual.quantidade.toLocaleString('pt-BR')} {atual.unidade.toUpperCase()}
            </td>
            <td className="border border-gray-300 p-2"></td>
            <td className="border border-gray-300 p-2">{formatarValor(total, atual.precoCusto.moeda)}</td>
          </tr>
        </tbody>
      </table>

      <table className="mb-4 w-full border-collapse border border-gray-300 text-sm">
        <tbody>
          <tr>
            <td className="w-1/3 border border-gray-300 bg-gray-50 p-2 font-semibold">Incoterms:</td>
            <td className="border border-gray-300 p-2">{atual.incoterm || '—'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Final Destination:</td>
            <td className="border border-gray-300 p-2">{propostaVinculada?.destinoFinal || 'TBI'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Port Of Origin:</td>
            <td className="border border-gray-300 p-2">{atual.portoOrigem || '—'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Port Of Discharge:</td>
            <td className="border border-gray-300 p-2">{propostaVinculada?.portoDestino || 'TBI'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Shipment:</td>
            <td className="border border-gray-300 p-2">
              From: {atual.embarqueDe || 'TBI'} To {atual.embarqueAte || 'TBI'}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Payment Terms:</td>
            <td className="border border-gray-300 p-2">{atual.prazoPagamento || '—'}</td>
          </tr>
        </tbody>
      </table>

      {atual.observacao && (
        <div className="mb-4">
          <p className="font-semibold text-gray-800">Remarks</p>
          <p className="text-gray-700">{atual.observacao}</p>
        </div>
      )}

      <div className="mb-6">
        <p className="mb-1 font-semibold text-gray-800">Terms And Conditions</p>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-gray-600">
          {TERMOS.map((termo, index) => (
            <li key={index}>{termo}</li>
          ))}
        </ol>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8 text-sm">
        <div className="border-t border-gray-400 pt-2 text-center text-gray-700">Buyer</div>
        <div className="border-t border-gray-400 pt-2 text-center text-gray-700">Seller</div>
      </div>
    </PaginaDocumento>
  )
}
