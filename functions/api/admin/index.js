/* =====================================================================
   functions/api/admin/index.js  (ARQUIVO NOVO)  ->  rota  POST /api/admin

   PARA QUE SERVE
   Recebe da página de admin o calendário completo {"dias": {...}} e o grava
   no KV. É a ÚNICA porta de escrita da agenda.

   REGRA DE OURO: NUNCA CONFIAR NO NAVEGADOR
   Mesmo que o admin.js já valide tudo, qualquer pessoa pode montar uma
   requisição à mão. Por isso o servidor refaz TODAS as validações, e só
   grava dados que ele mesmo "limpou" (objeto novo, campo por campo).
   ===================================================================== */

import { autenticar, resposta } from '../../_lib/auth.js';

const CHAVE_CALENDARIO = 'calendario';
const MAX_ENTRADAS = 800;            // limite de dias marcados (evita lotar o KV)
const MAX_BYTES_CORPO = 64 * 1024;   // 64 KB: 800 datas cabem com folga; corta abusos
const ESTADOS_VALIDOS = new Set(['bloqueado', 'agendado']);

/**
 * A data é "AAAA-MM-DD" E existe de verdade no calendário?
 * POR QUE duas etapas: a expressão regular garante o FORMATO, mas aceitaria
 * "2026-02-31". Por isso criamos a data e conferimos se o JavaScript não a
 * "corrigiu" para outro dia (31/02 viraria 03/03, e aí os números não batem).
 * Usamos UTC só para o fuso horário não interferir na conferência.
 */
function dataValida(texto) {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [ano, mes, dia] = texto.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

export async function onRequestPost({ request, env }) {
  // 1) Autenticação PRIMEIRO. Sem senha certa (ou IP bloqueado) nada abaixo roda.
  //    Devolve 401 (senha errada), 429 (bloqueado) ou 500 (servidor mal configurado).
  const auth = await autenticar(request, env);
  if (!auth.ok) return auth.resposta;

  // 2) Lê o corpo como TEXTO para medir o tamanho antes de interpretar.
  let texto;
  try {
    texto = await request.text();
  } catch (erro) {
    return resposta({ erro: 'Corpo da requisição ilegível.' }, 400);
  }
  if (texto.length > MAX_BYTES_CORPO) {
    return resposta({ erro: 'Corpo grande demais.' }, 400);
  }

  // 3) JSON válido?
  let corpo;
  try {
    corpo = JSON.parse(texto);
  } catch (erro) {
    return resposta({ erro: 'JSON inválido.' }, 400);
  }

  // 4) O formato é exatamente {"dias": { ... }}? (objeto simples, não lista, não null)
  if (
    !corpo || typeof corpo !== 'object' || Array.isArray(corpo) ||
    !corpo.dias || typeof corpo.dias !== 'object' || Array.isArray(corpo.dias)
  ) {
    return resposta({ erro: 'Formato inválido: esperado {"dias": {...}}.' }, 400);
  }

  // 5) Quantidade máxima de entradas.
  const entradas = Object.entries(corpo.dias);
  if (entradas.length > MAX_ENTRADAS) {
    return resposta({ erro: `Máximo de ${MAX_ENTRADAS} dias.` }, 400);
  }

  // 6) Valida cada dia e copia para um objeto NOVO. Só o que passou na
  //    validação entra: qualquer campo extra enviado por engano/maldade some.
  const limpos = {};
  for (const [data, estado] of entradas) {
    if (!dataValida(data)) {
      return resposta({ erro: 'Data inválida. Use AAAA-MM-DD.' }, 400);
    }
    if (typeof estado !== 'string' || !ESTADOS_VALIDOS.has(estado)) {
      return resposta({ erro: 'Estado inválido. Use "bloqueado" ou "agendado".' }, 400);
    }
    limpos[data] = estado;
  }

  // 7) Grava. A chave inteira é substituída (a página manda sempre o calendário
  //    completo). Como só há UMA profissional, "a última gravação vence" é suficiente.
  try {
    await env.AGENDA.put(CHAVE_CALENDARIO, JSON.stringify({ dias: limpos }));
  } catch (erro) {
    return resposta({ erro: 'Não foi possível salvar.' }, 500);
  }

  return resposta({ ok: true }, 200);
}

// Qualquer outro método nesta rota recebe 405.
export function onRequest() {
  return resposta({ erro: 'Método não permitido.' }, 405, { Allow: 'POST' });
}