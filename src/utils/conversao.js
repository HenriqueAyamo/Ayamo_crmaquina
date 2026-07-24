const FATORES_PARA_KG = {
  ton: 1000,
  kg: 1,
  g: 0.001,
  lb: 0.45359237,
}

export function converterPeso(valor, de, para) {
  if (de === para) return valor
  if (!FATORES_PARA_KG[de] || !FATORES_PARA_KG[para]) {
    throw new Error(`Unidade de peso desconhecida: ${de} ou ${para}`)
  }
  const emKg = valor * FATORES_PARA_KG[de]
  return emKg / FATORES_PARA_KG[para]
}
