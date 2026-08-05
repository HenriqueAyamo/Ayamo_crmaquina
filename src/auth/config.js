// Chave geral da autenticação.
//
// false = o sistema abre direto, sem tela de login, e o usuário é escolhido no
//         seletor da barra superior (comportamento anterior à Fase 2).
// true  = exige login por e-mail e senha; o usuário e o perfil vêm da sessão.
//
// Todo o código de autenticação continua no repositório e funcionando: tela de
// login, troca de senha, sessões, bloqueio por tentativas, auditoria. Está
// apenas desligado.
//
// IMPORTANTE: ao ligar aqui, ligue também AUTH_HABILITADA em worker/index.js.
// Os dois precisam estar iguais — o frontend sem o backend faz o login falhar
// sempre, e o backend sem o frontend tranca o sistema inteiro.
//
// Para reativar, veja SEGURANCA.md.
export const AUTH_HABILITADA = false
