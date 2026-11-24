/* =====================================================================
   functions/_lib/auth.js  (ARQUIVO NOVO)

   POR QUE ESTE ARQUIVO EXISTE
   Duas rotas precisam conferir a senha da Yara: /api/admin (salvar) e
   /api/admin/verificar (tela de login). Para não copiar a mesma lógica duas
   vezes (e correr o risco de uma ficar diferente da outra), ela mora aqui.

   POR QUE ESTÁ EM "_lib" E NÃO SOLTO EM functions/
   No Cloudflare Pages, cada arquivo dentro de functions/ vira uma rota SE ele
   exportar funções chamadas onRequest, onRequestGet, onRequestPost etc.
   Este arquivo só exporta funções auxiliares (nenhuma começa com "onRequest"),
   então NÃO vira uma rota pública. O "_" no nome da pasta é só uma convenção
   para deixar claro que é código de apoio.
   ===================================================================== */

// Quantas senhas erradas seguidas são permitidas antes de bloquear o IP.
export const MAX_TENTATIVAS = 5;

// Por quanto tempo (em segundos) o IP fica bloqueado: 15 minutos.
// O KV apaga a chave sozinho quando esse tempo passa (expirationTtl), então
// não precisamos de nenhum "relógio" nosso para liberar o IP depois.
export const BLOQUEIO_SEGUNDOS = 15 * 60;

/**
 * Monta uma resposta JSON padronizada.
 * POR QUE: todas as respostas da área admin precisam de "Cache-Control: no-store"
 * (para nenhum navegador/CDN guardar respostas sobre senha ou agenda privada).
 * Centralizar aqui garante que nenhuma rota esqueça isso.
 * "extras" permite sobrescrever cabeçalhos (a rota pública /api/agenda usa
 * isso para trocar o no-store por um cache curto de 30 s).
 */
export function resposta(corpo, status = 200, extras = {}) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extras,
    },
  });
}

/**
 * Calcula o SHA-256 de um texto e devolve os bytes.
 * POR QUE: para comparar senhas em tempo constante precisamos de duas
 * sequências do MESMO tamanho. O hash sempre tem 32 bytes, qualquer que seja
 * o tamanho da senha. Assim nem o tamanho da senha correta vaza.
 */
async function hashSha256(texto) {
  const bytes = new TextEncoder().encode(texto);
  const resumo = await crypto.subtle.digest('SHA-256', bytes);
  return new Uint8Array(resumo);
}

/**
 * Compara duas senhas em TEMPO CONSTANTE.
 * POR QUE: um "a === b" comum para na primeira letra diferente. Medindo o
 * tempo de resposta, um atacante poderia descobrir a senha letra por letra.
 * Aqui o laço SEMPRE percorre os 32 bytes inteiros e acumula as diferenças
 * com OR, então o tempo gasto não depende de onde as senhas diferem.
 */
export async function senhasIguais(enviada, esperada) {
  const [a, b] = await Promise.all([hashSha256(enviada), hashSha256(esperada)]);
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) {
    diferenca |= a[i] ^ b[i];
  }
  return diferenca === 0;
}

/**
 * Autentica uma requisição de administração.
 *
 * Devolve { ok: true } se a senha estiver certa, ou
 * { ok: false, resposta: Response } com a resposta de erro já pronta
 * (a rota só precisa devolvê-la).
 *
 * Ordem das verificações (e o porquê):
 *  1. Configuração: se faltar a senha secreta ou o KV, é erro NOSSO (500).
 *     Nunca aceitamos "senha vazia" por engano.
 *  2. IP bloqueado? Respondemos 429 ANTES de olhar a senha. Assim, durante o
 *     bloqueio, nem a senha certa funciona, e o atacante não consegue usar
 *     as respostas para saber se acertou.
 *  3. Senha certa -> zera o contador de erros.
 *  4. Senha errada -> soma 1 ao contador; ao chegar em 5, bloqueia.
 *
 * Se o KV falhar no meio, respondemos 500 (falhamos "fechado"): na dúvida,
 * NÃO deixamos ninguém entrar.
 *
 * A senha enviada NUNCA é escrita em log (não existe console.log aqui).
 */
export async function autenticar(request, env) {
  // 1. Configuração obrigatória.
  if (!env.ADMIN_PASSWORD || !env.AGENDA) {
    return {
      ok: false,
      resposta: resposta({ erro: 'Servidor não configurado.' }, 500),
    };
  }

  // O Cloudflare coloca o IP real do visitante neste cabeçalho.
  const ip = request.headers.get('CF-Connecting-IP') || 'desconhecido';

  // Chave do contador. Guarda só IP + número: nenhum dado pessoal da cliente.
  const chaveTentativas = `tentativas:${ip}`;

  try {
    // 2. Quantas vezes este IP já errou (ausente = 0).
    const bruto = await env.AGENDA.get(chaveTentativas);
    const tentativas = parseInt(bruto, 10) || 0;

    if (tentativas >= MAX_TENTATIVAS) {
      return {
        ok: false,
        resposta: resposta(
          { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
          429,
          { 'Retry-After': String(BLOQUEIO_SEGUNDOS) }
        ),
      };
    }

    // 3. Confere a senha enviada no cabeçalho com a variável secreta.
    const enviada = request.headers.get('X-Admin-Password') || '';
    if (await senhasIguais(enviada, env.ADMIN_PASSWORD)) {
      // Acertou: apaga o contador para os erros não "acumularem" para sempre.
      if (tentativas > 0) await env.AGENDA.delete(chaveTentativas);
      return { ok: true };
    }

    // 4. Errou: registra a tentativa. expirationTtl faz o KV apagar a chave
    // sozinho depois de 15 min (é o "desbloqueio automático").
    const novas = tentativas + 1;
    await env.AGENDA.put(chaveTentativas, String(novas), {
      expirationTtl: BLOQUEIO_SEGUNDOS,
    });

    // Na 5ª senha errada já respondemos 429: a partir dela o IP está bloqueado.
    if (novas >= MAX_TENTATIVAS) {
      return {
        ok: false,
        resposta: resposta(
          { erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
          429,
          { 'Retry-After': String(BLOQUEIO_SEGUNDOS) }
        ),
      };
    }

    return {
      ok: false,
      resposta: resposta({ erro: 'Senha incorreta.' }, 401),
    };
  } catch (erro) {
    // Não registramos "erro" com dados sensíveis; só uma mensagem genérica.
    return {
      ok: false,
      resposta: resposta({ erro: 'Falha ao verificar a senha.' }, 500),
    };
  }
}