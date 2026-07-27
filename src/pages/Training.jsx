import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const TONE_PAPEL = { Comprador: 'info', Vendedor: 'success', Todos: 'neutral' }

const PASSOS = [
  {
    papel: 'Comprador',
    titulo: 'Cadastrar uma oferta de compra',
    texto:
      'Em Compras > Nova oferta, escolha o tipo: "Oferta" se o fornecedor ainda não fechou volume/preço final, ou "Position" se já é uma compra fechada. Quantidade é opcional na Oferta e obrigatória na Position.',
  },
  {
    papel: 'Comprador',
    titulo: 'Registrar revisão de preço',
    texto:
      'Quando o fornecedor manda um novo preço, use "Registrar revisão" na ficha da oferta — isso cria uma nova versão e atualiza automaticamente qualquer proposta de venda em negociação que dependa dela.',
  },
  {
    papel: 'Comprador',
    titulo: 'Notificar a Logística em compras FOB',
    texto:
      'Se a Position tem Incoterm FOB, aparece um aviso na ficha: o frete é por conta da Ayamo. Clique em "Notificar Logística" para registrar que a equipe já foi acionada.',
  },
  {
    papel: 'Vendedor',
    titulo: 'Gerar uma proposta de venda',
    texto:
      'Em Vendas > Nova proposta (ou pelo botão "Gerar venda" na ficha da oferta), selecione o(s) cliente(s), defina quantidade e preço por cliente, e configure a margem mínima aceitável — pode ser um percentual ou um valor fixo em US$ por tonelada.',
  },
  {
    papel: 'Vendedor',
    titulo: 'Negociar e fechar',
    texto:
      'Na ficha da proposta, registre contrapropostas do cliente, escale para o comprador se precisar de desconto, ou peça aprovação do diretor se a margem estiver baixa. Ao aceitar, gere a Proforma Invoice direto da tela.',
  },
  {
    papel: 'Todos',
    titulo: 'Achar contato rápido',
    texto: 'Clique no nome do fornecedor ou cliente em qualquer lista para abrir telefone e e-mail na hora, sem trocar de tela.',
  },
  {
    papel: 'Todos',
    titulo: 'Painel de Compras e Sales Ranking',
    texto:
      'O grupo "Inteligência" no menu reúne os painéis de BI: volume por produto/fornecedor em Compras, e top produtos/vendedores em Vendas.',
  },
  {
    papel: 'Todos',
    titulo: 'Qualificação de fornecedores por país',
    texto:
      'Em Empresas, cada fornecedor tem um cartão de qualificação por país (aprovado/em andamento/não iniciado/vencido). A visão "Qualificações por país" no menu mostra todos os fornecedores juntos numa grade só.',
  },
]

export default function Training() {
  return (
    <div>
      <PageHeader title="Training" subtitle="Guia rápido de como usar o sistema" />

      <div className="flex flex-col gap-3">
        {PASSOS.map((passo, indice) => (
          <div key={indice} className="rounded border border-ayamo-border bg-ayamo-surface p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ayamo-primary/10 text-xs font-semibold text-ayamo-primary">
                {indice + 1}
              </span>
              <h2 className="text-sm font-semibold text-ayamo-text">{passo.titulo}</h2>
              <StatusBadge label={passo.papel} tone={TONE_PAPEL[passo.papel]} />
            </div>
            <p className="pl-8 text-sm text-ayamo-text-mut">{passo.texto}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
