import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { lerLinhasExcel, valorPorAlias } from '../../utils/importarExcel.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'

const PERFIS_VALIDOS = ['Comprador', 'Vendedor', 'Diretor', 'Financeiro', 'Controladoria', 'Administrador']

const ALIASES = {
  nome: ['nome', 'name'],
  email: ['email', 'e-mail'],
  perfil: ['perfil', 'role', 'função', 'funcao'],
}

export default function ImportarPlanilhaUsuarios({ onImportado }) {
  const { usuarios } = useData()
  const [resumo, setResumo] = useState(null)

  function processarLinhas(linhas) {
    let criados = 0
    let atualizados = 0
    const erros = []

    linhas.forEach((linha, index) => {
      const numeroLinha = index + 2
      const nome = String(valorPorAlias(linha, ALIASES, 'nome') ?? '').trim()
      const email = String(valorPorAlias(linha, ALIASES, 'email') ?? '').trim()
      const perfilBruto = String(valorPorAlias(linha, ALIASES, 'perfil') ?? '').trim()
      const perfil = PERFIS_VALIDOS.find((p) => p.toLowerCase() === perfilBruto.toLowerCase())

      if (!nome) {
        erros.push(`Linha ${numeroLinha}: nome em branco`)
        return
      }
      if (!email) {
        erros.push(`Linha ${numeroLinha}: e-mail em branco`)
        return
      }
      if (!perfil) {
        erros.push(`Linha ${numeroLinha}: perfil "${perfilBruto || '(vazio)'}" inválido — use um de: ${PERFIS_VALIDOS.join(', ')}`)
        return
      }

      const existente = usuarios.items.find((u) => u.email.trim().toLowerCase() === email.toLowerCase())
      if (existente) {
        usuarios.editar(existente.id, { nome, perfil })
        atualizados += 1
      } else {
        usuarios.criar({ nome, email, perfil, situacao: 'Ativo', responsabilidades: [] })
        criados += 1
      }
    })

    setResumo({ total: linhas.length, criados, atualizados, erros })
    onImportado?.()
  }

  return (
    <UploadPlanilha
      onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(processarLinhas)}
      hint={`Cabeçalhos aceitos: Nome/Name, E-mail, Perfil (${PERFIS_VALIDOS.join(', ')}). Usuário existente (mesmo e-mail) é atualizado; senão, é criado. Responsabilidades de aprovação continuam configuradas na tela.`}
      mensagemResumo={resumo && `${resumo.criados} criado(s), ${resumo.atualizados} atualizado(s) de ${resumo.total} linha(s).`}
      erros={resumo?.erros}
    />
  )
}
