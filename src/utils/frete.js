export const CAMPOS_CUSTO_FRETE = [
  { chave: 'custoFreight', label: 'Freight' },
  { chave: 'custoBaf', label: 'BAF' },
  { chave: 'custoEfsPssGri', label: 'EFS/PSS/GRI' },
  { chave: 'custoOutrasTaxas', label: 'Outras taxas' },
  { chave: 'custoCrossTrade', label: 'Cross trade' },
  { chave: 'custoReeferMonitoring', label: 'Reefer Monitoring' },
]

export function totalFreight(frete) {
  return CAMPOS_CUSTO_FRETE.reduce((soma, { chave }) => soma + Number(frete[chave] ?? 0), 0)
}
