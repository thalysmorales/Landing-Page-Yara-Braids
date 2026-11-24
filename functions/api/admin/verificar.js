/* =====================================================================
   functions/api/admin/verificar.js  (ARQUIVO NOVO)
   ->  rota  POST /api/admin/verificar

   PARA QUE SERVE
   A tela de login da página de admin usa esta rota só para saber "a senha
   está certa?", ANTES de mostrar o calendário. Não lê nem grava agenda.

   POR QUE É UMA ROTA SEPARADA
   Assim o login responde na hora, sem mexer em nenhum dado. E, como usa a
   mesma função autenticar() das outras rotas, o limite de 5 tentativas
   por IP vale aqui também (é aqui que a maioria das tentativas acontece).

   Respostas: 200 = senha certa | 401 = errada | 429 = IP bloqueado.
   ===================================================================== */

import { autenticar, resposta } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const auth = await autenticar(request, env);
  if (!auth.ok) return auth.resposta; // 401, 429 ou 500, já montada

  return resposta({ ok: true }, 200);
}

// Qualquer outro método nesta rota recebe 405.
export function onRequest() {
  return resposta({ erro: 'Método não permitido.' }, 405, { Allow: 'POST' });
}