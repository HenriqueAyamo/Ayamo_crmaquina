import { useParams } from 'react-router-dom'
import { useData } from '../../DataContext.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PaginaDocumento from '../../components/PaginaDocumento.jsx'
import { formatarData, formatarValor } from '../../utils/formato.js'
import { saudacaoComercial } from '../../utils/saudacao.js'

const TERMOS = [
  'Ayamo does not accept payments in any CASH payments at the banks counter whatsoever. Only wire transfer/eletronic funds transfer via swift are allowed.',
  'INCOTERMS 2020 to apply unless otherwise specified;',
  'This sales confirmation is considered valid after duly signed and returned to the Seller, or after 48 hours of its issuance date when not claimed by buyer;',
  '10% up or down in total quantities shipped is allowed, unless agreed otherwise;',
  'Seller shall fulfil the shipment schedule mentioned in this contract, one-week delay is acceptable. More than one-week delay must be submitted to buyer and approved by him by e-mail;',
  "All banking charges related to payments from buyer to seller are on buyer's account;",
  'Eventual changes requested on the documentary instructions at any time, by the buyer, will be submitted to the respective authorities accordingly. Costs related to any changes are on buyer’s account;',
  'The seller shall not be responsible for any delay in shipping or non performance due to any cause beyond their control, including strikes, government regulations, delay in transit or force major.',
  "The buyer shall be responsible for any loss or costs that may result in this transaction due to his/her non-compliance with the contract;",
  'All payments made under this Sales Contract are non-refundable and shall be used to cover overdue payments of other contracts with same buyer or forfeited should the buyer fail to make subsequent payments or cancels the contract;',
  'Claims related to product quality must be notified within 45 days of the vessel’s arrival at the destination port. Damage, shortage, or non-quality-related claims must be reported within 7 days of container pickup.',
  'In the event of any dispute that may arise out of or in connection with the content agreed herein, the terms and conditions of this pro-forma invoice shall supersede any other agreement or document related to this order;',
  'Any disputes or disagreements between the Seller and the Buyer are to be settled by friendly negotiations, or by the Arbitration Institute of the Stockholm Chamber of Commerce (SCC).',
]

export default function DocumentoProforma() {
  const { id } = useParams()
  const { propostas, ofertas, contatos, categoriasContato, getProduto, getEmpresa, dadosAyamo } = useData()

  const proposta = propostas.items.find((p) => p.numero === id)
  if (!proposta) return <EmptyState title="Proposta não encontrada" />

  const item = proposta.itens[0]
  const produto = getProduto(item.produtoId)
  const cliente = getEmpresa(proposta.clienteId)
  const ofertaVinculada = ofertas.items.find((o) => o.codigo === item.ofertaCodigo)
  const fornecedor = ofertaVinculada ? getEmpresa(ofertaVinculada.fornecedorId) : null
  const marca = fornecedor?.marca || fornecedor?.nome
  const hoje = formatarData(new Date())
  const total = item.quantidade * item.precoVenda.valor
  const consignatarioNome = proposta.consignatarioNome || cliente?.nome
  const consignatarioEndereco = proposta.consignatarioEndereco || cliente?.endereco
  const contatosCliente = contatos.items.filter((c) => c.empresaId === proposta.clienteId)
  const entidadeAyamo = dadosAyamo.items.find((e) => e.id === proposta.ayamoEntidadeId) ?? dadosAyamo.items[0]
  const saudacao = saudacaoComercial(contatosCliente, categoriasContato.items)

  const corpoEmail = `${saudacao},

As per our agreement, on behalf of Ayamo, it's a pleasure to confirm this new business.

**Sales confirmation**
**Quantity:** 1
**Brand/Country of Origin:** ${marca ?? ''} (${fornecedor?.pais ?? ''} Origin) - ${fornecedor?.pais ?? ''}
**Incoterm/Port of Destination:** ${proposta.incoterm ?? ''} - ${proposta.portoDestino ?? ''}
**Shipment from/to:** ${proposta.embarqueDe || 'TBI'} - ${proposta.embarqueAte || 'TBI'}

${item.quantidade.toLocaleString('pt-BR')} ${item.unidade.toUpperCase()} - ${produto?.nome ?? ''}${produto?.nomeCientifico ? ` (${produto.nomeCientifico})` : ''}${produto?.embalagem ? ' - ' + produto.embalagem : ''} - ${item.precoVenda.moeda} ${item.precoVenda.valor}

Find attached our **PFI(s)** with all the details.

Kindly send it back to us signed with your instructions and (if applicable) the duly permits.

**Thanks for the business**`

  return (
    <PaginaDocumento voltarPara={`/vendas/${id}`} corpoEmail={corpoEmail}>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-lg font-bold text-gray-800">AYAMO</p>
          <p className="text-xs tracking-widest text-gray-500">GLOBAL FOODS</p>
        </div>
        <div className="text-right">
          <h1 className="text-xl font-semibold text-gray-800">PROFORMA INVOICE</h1>
          <p className="text-sm text-gray-600">Date: {hoje}</p>
        </div>
      </div>

      <p className="mb-4 text-sm font-semibold text-gray-800">Contract Number: {proposta.numeroContrato || proposta.numero}</p>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="font-semibold text-gray-800">Seller:</p>
          <p className="font-medium text-gray-800">{entidadeAyamo?.razaoSocial || 'AYAMO'}</p>
          <p className="whitespace-pre-line text-gray-600">{entidadeAyamo?.endereco || '—'}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-800">Buyer:</p>
          <p className="font-medium text-gray-800">{cliente?.nome}</p>
          <p className="whitespace-pre-line text-gray-600">{cliente?.endereco || '—'}</p>
        </div>
      </div>

      <div className="mb-4 text-sm">
        <p className="font-semibold text-gray-800">Consignee:</p>
        <p className="font-medium text-gray-800">{consignatarioNome}</p>
        <p className="whitespace-pre-line text-gray-600">{consignatarioEndereco || '—'}</p>
      </div>

      <div className="mb-4 text-sm">
        <p className="font-semibold text-gray-800">Bank Details:</p>
        <p className="text-gray-700">{entidadeAyamo?.bancoNome || '—'}</p>
        <p className="text-gray-700">
          SWIFT: {entidadeAyamo?.bancoSwift || '—'} · IBAN: {entidadeAyamo?.bancoIban || '—'}
        </p>
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
                {produto?.nomeCientifico ? ` (${produto.nomeCientifico})` : ''}
                {produto?.embalagem ? ` - ${produto.embalagem}` : ''}
              </p>
              <p className="text-xs text-gray-600">
                BRAND: {marca ?? '—'} ({fornecedor?.pais ?? '—'} Origin)
                {produto?.validadeMeses ? ` - EXPIRY DATE: ${produto.validadeMeses} Months` : ''}
              </p>
            </td>
            <td className="border border-gray-300 p-2 align-top">
              {item.quantidade.toLocaleString('pt-BR')} {item.unidade.toUpperCase()}
            </td>
            <td className="border border-gray-300 p-2 align-top">{formatarValor(item.precoVenda.valor, item.precoVenda.moeda)}</td>
            <td className="border border-gray-300 p-2 align-top">{formatarValor(total, item.precoVenda.moeda)}</td>
          </tr>
          <tr className="font-semibold">
            <td className="border border-gray-300 p-2" colSpan={2}>
              TOTAL
            </td>
            <td className="border border-gray-300 p-2">
              {item.quantidade.toLocaleString('pt-BR')} {item.unidade.toUpperCase()}
            </td>
            <td className="border border-gray-300 p-2"></td>
            <td className="border border-gray-300 p-2">{formatarValor(total, item.precoVenda.moeda)}</td>
          </tr>
        </tbody>
      </table>

      <table className="mb-4 w-full border-collapse border border-gray-300 text-sm">
        <tbody>
          <tr>
            <td className="w-1/3 border border-gray-300 bg-gray-50 p-2 font-semibold">Incoterms:</td>
            <td className="border border-gray-300 p-2">{proposta.incoterm || '—'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Final Destination:</td>
            <td className="border border-gray-300 p-2">{proposta.destinoFinal || '—'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Port Of Origin:</td>
            <td className="border border-gray-300 p-2">{ofertaVinculada?.portoOrigem || '—'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Port Of Discharge:</td>
            <td className="border border-gray-300 p-2">{proposta.portoDestino || '—'}</td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Shipment:</td>
            <td className="border border-gray-300 p-2">
              From: {proposta.embarqueDe || '—'} To {proposta.embarqueAte || '—'}
            </td>
          </tr>
          <tr>
            <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Payment Terms:</td>
            <td className="border border-gray-300 p-2">{proposta.prazoPagamento || '—'}</td>
          </tr>
        </tbody>
      </table>

      {fornecedor && (
        <div className="mb-4">
          <p className="mb-1 font-semibold text-gray-800">SPS Information</p>
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <tbody>
              <tr>
                <td className="w-1/2 border border-gray-300 bg-gray-50 p-2 font-semibold">Name of Manufacturer / Producer / Plant</td>
                <td className="border border-gray-300 p-2">{fornecedor.nome}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Business Address</td>
                <td className="border border-gray-300 p-2">{fornecedor.endereco || '—'}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Establishment No.</td>
                <td className="border border-gray-300 p-2">{fornecedor.sif || '—'}</td>
              </tr>
              <tr>
                <td className="border border-gray-300 bg-gray-50 p-2 font-semibold">Product Spec / HS Code</td>
                <td className="border border-gray-300 p-2">
                  {produto?.especificacaoRotulo || '—'} / {produto?.hsCode || '—'}
                </td>
              </tr>
            </tbody>
          </table>
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
