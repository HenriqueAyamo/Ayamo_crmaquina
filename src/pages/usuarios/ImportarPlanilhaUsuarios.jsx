import { useState } from 'react'
import { useData } from '../../DataContext.jsx'
import { lerLinhasExcel, valorPorAlias } from '../../utils/importarExcel.js'
import UploadPlanilha from '../../components/UploadPlanilha.jsx'
import PreviewImportacao from '../../components/PreviewImportacao.jsx'

const PERFIS_VALIDOS = ['Comprador', 'Vendedor', 'Diretor', 'Financeiro', 'Controladoria', 'Administrador']

const ALIASES = {
  nome: ['nome', 'name'],
  email: ['email', 'e-mail'],
  perfil: ['perfil', 'role', 'função', 'funcao'],
}

export default function ImportarPlanilhaUsuarios({ onImportado }) {
  const { usuarios } = useData()
  const [preview, setPreview] = useState(null)
  const [resumoFinal, setResumoFinal] = useState(null)

  function analisarLinhas(linhas) {
    const linhasPreview = linhas.map((linha, index) => {
      const numeroLinha = index + 2
      const nome = String(valorPorAlias(linha, ALIASES, 'nome') ?? '').trim()
      const email = String(valorPorAlias(linha, ALIASES, 'email') ?? '').trim()
      const perfilBruto = String(valorPorAlias(linha, ALIASES, 'perfil') ?? '').trim()
      const perfil = PERFIS_VALIDOS.find((p) => p.toLowerCase() === perfilBruto.toLowerCase())

      if (!nome) return { numeroLinha, status: 'erro', mensagem: 'Nome em branco' }
      if (!email) return { numeroLinha, status: 'erro', mensagem: 'E-mail em branco' }
      if (!perfil) {
        return {
          numeroLinha,
          status: 'erro',
          mensagem: `Perfil "${perfilBruto || '(vazio)'}" inválido — use um de: ${PERFIS_VALIDOS.join(', ')}`,
        }
      }

      const existente = usuarios.items.find((u) => u.email.trim().toLowerCase() === email.toLowerCase())

      return {
        numeroLinha,
        status: 'ok',
        titulo: `${nome} — ${email}`,
        detalhe: `${existente ? 'Atualiza usuário existente' : 'Novo usuário'} · Perfil: ${perfil}`,
        dadosAcao: { nome, email, perfil, existenteId: existente?.id ?? null },
      }
    })

    setResumoFinal(null)
    setPreview(linhasPreview)
  }

  function confirmarImportacao() {
    let criados = 0
    let atualizados = 0
    const erros = []

    preview.forEach((linhaPreview) => {
      if (linhaPreview.status !== 'ok') {
        erros.push(`Linha ${linhaPreview.numeroLinha}: ${linhaPreview.mensagem}`)
        return
      }
      const { nome, email, perfil, existenteId } = linhaPreview.dadosAcao
      if (existenteId) {
        usuarios.editar(existenteId, { nome, perfil })
        atualizados += 1
      } else {
        usuarios.criar({ nome, email, perfil, situacao: 'Ativo', responsabilidades: [] })
        criados += 1
      }
    })

    setResumoFinal({ total: preview.length, criados, atualizados, erros })
    setPreview(null)
    onImportado?.()
  }

  const validas = preview?.filter((l) => l.status === 'ok').length ?? 0

  return (
    <div>
      <UploadPlanilha
        onArquivo={(arquivo) => lerLinhasExcel(arquivo).then(analisarLinhas)}
        hint={`Cabeçalhos aceitos: Nome/Name, E-mail, Perfil (${PERFIS_VALIDOS.join(', ')}). Usuário existente (mesmo e-mail) é atualizado; senão, é criado. Responsabilidades de aprovação continuam configuradas na tela.`}
        mensagemResumo={resumoFinal && `${resumoFinal.criados} criado(s), ${resumoFinal.atualizados} atualizado(s) de ${resumoFinal.total} linha(s).`}
        erros={resumoFinal?.erros}
      />

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
