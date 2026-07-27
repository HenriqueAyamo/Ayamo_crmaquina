export const MOEDAS = [
  { codigo: 'BRL', simbolo: 'R$', nome: 'Real', locale: 'pt-BR' },
  { codigo: 'USD', simbolo: 'US$', nome: 'Dólar americano', locale: 'en-US' },
  { codigo: 'EUR', simbolo: '€', nome: 'Euro', locale: 'de-DE' },
  { codigo: 'GBP', simbolo: '£', nome: 'Libra esterlina', locale: 'en-US' },
  { codigo: 'CNY', simbolo: '¥', nome: 'Yuan', locale: 'en-US' },
]

export const UNIDADES_PESO = [
  { codigo: 'kg', nome: 'Quilograma' },
  { codigo: 'g', nome: 'Grama' },
  { codigo: 'ton', nome: 'Tonelada métrica' },
  { codigo: 'lb', nome: 'Libra (pound)' },
]

export const UNIDADES_EMBALAGEM = [
  { codigo: 'caixa', nome: 'Caixa' },
  { codigo: 'pallet', nome: 'Pallet' },
  { codigo: 'container', nome: 'Container' },
  { codigo: 'unidade', nome: 'Unidade' },
]

export const UNIDADES = [...UNIDADES_PESO, ...UNIDADES_EMBALAGEM]

export const INCOTERMS = ['CFR', 'CIF', 'FOB', 'CPT', 'FCA', 'EXW', 'DDP', 'DAP', 'FAS']
