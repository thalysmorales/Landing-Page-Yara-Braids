/* =====================================================================
   functions/api/agenda.js  (ARQUIVO NOVO)  ->  rota  GET /api/agenda

   PARA QUE SERVE
   É o que o formulário PÚBLICO consulta para saber quais dias estão
   "bloqueado" ou "agendado" e desativá-los no calendário da cliente.

   POR QUE É PÚBLICA (sem senha)
   A cliente precisa ler a agenda. Mas a resposta só contém datas e estados
   (nenhum nome, telefone ou outro dado pessoal), então não há problema em
   qualquer pessoa vê-la. ESCREVER na agenda é outra rota, protegida.
   ===================================================================== */

import { resposta } from '../_lib/auth.js';

// Chave única do KV onde fica toda a agenda: {"dias": {"2026-12-05": "bloqueado"}}
const CHAVE_CALENDARIO = 'calendario';

export async function onRequestGet({ env }) {
  // Se o KV não estiver vinculado ao projeto, avisamos com 503. O formulário
  // trata qualquer erro como "todos os dias livres" e continua funcionando.
  if (!env.AGENDA) {
    return resposta({ erro: 'Agenda indisponível.' }, 503);
  }

  let dias = {}; // padrão: nenhum dia marcado

  try {
    const bruto = await env.AGENDA.get(CHAVE_CALENDARIO);

    // Chave inexistente (agenda ainda nunca salva) -> bruto é null -> {"dias": {}}.
    if (bruto) {
      const dado = JSON.parse(bruto);

      // Só aceitamos o formato esperado. Se por algum motivo o valor guardado
      // estiver corrompido, devolvemos vazio em vez de quebrar o site.
      if (dado && typeof dado.dias === 'object' && dado.dias !== null && !Array.isArray(dado.dias)) {
        dias = dado.dias;
      }
    }
  } catch (erro) {
    // Falha de leitura ou JSON inválido: não vazamos detalhes, só informamos.
    return resposta({ erro: 'Não foi possível ler a agenda.' }, 503);
  }

  // Cache curto (30 s): alivia o KV quando muita gente abre o site ao mesmo
  // tempo, e mesmo assim uma alteração da Yara aparece em até ~30 s.
  return resposta({ dias }, 200, { 'Cache-Control': 'public, max-age=30' });
}

// Qualquer outro método (POST, PUT...) nesta rota recebe 405.
export function onRequest() {
  return resposta({ erro: 'Método não permitido.' }, 405, { Allow: 'GET' });
}