/* =====================================================================
   admin.js  (ARQUIVO NOVO)

   FLUXO COMPLETO (do toque da Yara até o dia sumir no formulário da cliente)
   1. A Yara abre /admin e digita a senha.
   2. Mandamos a senha para POST /api/admin/verificar (cabeçalho
      X-Admin-Password). Se estiver certa, carregamos a agenda atual em
      GET /api/agenda e mostramos o calendário.
   3. Ela toca em um dia: o estado muda na tela NA HORA (livre -> bloqueado ->
      agendado -> livre) e enviamos o calendário completo para POST /api/admin.
   4. O servidor confere a senha de novo, valida tudo e grava no KV.
   5. Quando uma cliente abre o site, o formulário faz GET /api/agenda e
      desativa no calendário os dias "bloqueado" e "agendado".
   Se o passo 3 falhar, desfazemos a mudança na tela e avisamos.

   REGRA DE SEGURANÇA DESTA PÁGINA
   A senha vive SÓ na variável "senha" (memória da aba). Este arquivo nunca usa
   cookies, localStorage nem sessionStorage. Recarregou ou fechou a aba?
   A memória some e a senha é pedida de novo. É de propósito.
   ===================================================================== */

'use strict';

/* ---------- Constantes ---------- */

// Endereços da API (mesma origem: nada de CORS).
const URL_AGENDA = '/api/agenda';
const URL_SALVAR = '/api/admin';
const URL_VERIFICAR = '/api/admin/verificar';

// 3 meses lado a lado só cabem em telas largas; abaixo disso, 1 mês.
// (O admin.css usa o mesmo ponto de corte: 1100 px.)
const telaLarga = window.matchMedia('(min-width: 1100px)');

// Ordem do toque: livre -> bloqueado -> agendado -> livre.
const PROXIMO_ESTADO = { livre: 'bloqueado', bloqueado: 'agendado', agendado: 'livre' };

// Tempo máximo de espera por uma resposta do servidor (evita ficar "Salvando..." para sempre).
const TEMPO_LIMITE_MS = 10000;

/* ---------- Estado (tudo só em memória) ---------- */

let senha = null;       // senha da Yara: só aqui, nunca gravada em lugar nenhum
let dias = {};          // {"2026-12-05": "bloqueado", ...}; dia livre = ausente
let calendario = null;  // instância do Flatpickr
let entrando = false;   // true enquanto o login está sendo verificado (evita clique duplo)
let salvando = false;   // true enquanto um salvamento está em andamento (evita toque duplo)
let sessao = 0;         // sobe a cada "Sair"; respostas atrasadas de uma sessão antiga são ignoradas

/* ---------- Elementos da página ---------- */

const telaLogin = document.getElementById('telaLogin');
const telaPainel = document.getElementById('telaPainel');
const formLogin = document.getElementById('formLogin');
const campoSenha = document.getElementById('campoSenha');
const botaoEntrar = document.getElementById('botaoEntrar');
const erroLogin = document.getElementById('erroLogin');
const botaoSair = document.getElementById('botaoSair');
const indicador = document.getElementById('indicador');
const avisoPainel = document.getElementById('avisoPainel');
const campoCalendario = document.getElementById('campoCalendario');

/* ---------- Datas (sempre pela data LOCAL) ---------- */

/**
 * Converte uma Date em "AAAA-MM-DD" usando ano/mês/dia LOCAIS.
 * POR QUE NÃO toISOString(): ele converte para UTC. No Brasil (UTC-3), um dia
 * à noite já seria "amanhã" em UTC, e a data ficaria errada em um dia.
 */
function chaveLocal(data) {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
}

/** "Hoje" no mesmo formato. Calculado a cada uso: a aba pode ficar aberta de um dia para o outro. */
function hojeChave() {
    return chaveLocal(new Date());
}

/* ---------- Comunicação com o servidor ---------- */

/**
 * Faz uma requisição com tempo limite e devolve { status, json }.
 * - cache: 'no-store' -> nunca usar resposta guardada (queremos a agenda atual).
 * - credentials: 'omit' -> não enviar cookies (esta página não usa nenhum).
 * - Se a rede cair ou o tempo estourar, o fetch lança erro; quem chama trata.
 * - Se o servidor responder algo que não é JSON, "json" vira null (sem quebrar).
 */
async function chamarApi(url, { metodo = 'GET', cabecalhos = {}, corpo } = {}) {
    const controle = new AbortController();
    const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
    try {
        const resp = await fetch(url, {
            method: metodo,
            headers: cabecalhos,
            body: corpo,
            cache: 'no-store',
            credentials: 'omit',
            signal: controle.signal,
        });
        let json = null;
        try {
            json = await resp.json();
        } catch (erro) {
            json = null; // resposta inválida: tratamos como "sem conteúdo"
        }
        return { status: resp.status, json };
    } finally {
        clearTimeout(relogio);
    }
}

/**
 * Confere se o JSON recebido tem o formato esperado e devolve só as entradas boas.
 * Devolve null se o formato estiver errado.
 * POR QUE: não confiamos nem no servidor. Se vier lixo, é melhor recusar do que
 * mostrar um calendário errado e depois SALVAR esse lixo por cima da agenda.
 */
function validarDias(json) {
    if (!json || typeof json.dias !== 'object' || json.dias === null || Array.isArray(json.dias)) {
        return null;
    }
    const limpo = {};
    for (const [data, estado] of Object.entries(json.dias)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(data) && (estado === 'bloqueado' || estado === 'agendado')) {
            limpo[data] = estado;
        }
    }
    return limpo;
}

/**
 * Dias que devem ser enviados ao salvar: só hoje em diante.
 * POR QUE: dias passados não servem mais para nada; descartá-los mantém a lista
 * pequena (o servidor aceita no máximo 800 dias) sem a Yara precisar limpar à mão.
 */
function diasFuturos() {
    const hoje = hojeChave();
    const futuros = {};
    for (const [data, estado] of Object.entries(dias)) {
        if (data >= hoje) futuros[data] = estado; // "AAAA-MM-DD" ordena certo como texto
    }
    return futuros;
}

/* ---------- Troca de telas ---------- */

function mostrarErroLogin(texto) {
    erroLogin.textContent = texto; // textContent: nunca interpreta o texto como HTML
}

function definirStatus(estado, texto) {
    indicador.dataset.estado = estado; // "salvando" | "salvo" | "erro" (o CSS pinta cada um)
    indicador.textContent = texto;
}

/** Mostra o calendário (depois do login). */
function abrirPainel() {
    telaLogin.hidden = true;
    telaPainel.hidden = false;
    botaoSair.hidden = false;
    avisoPainel.textContent = '';
    definirStatus('salvo', 'Salvo');
    criarCalendario();
}

/**
 * Volta para a tela de senha e APAGA tudo da memória.
 * Usado pelo botão "Sair" e quando o servidor responde 401.
 */
function voltarAoLogin(mensagem) {
    sessao += 1;     // invalida qualquer resposta que ainda esteja a caminho
    senha = null;
    dias = {};
    salvando = false;
    if (calendario) {
        calendario.destroy();
        calendario = null;
    }
    telaPainel.hidden = true;
    botaoSair.hidden = true;
    telaLogin.hidden = false;
    campoSenha.value = '';
    mostrarErroLogin(mensagem || '');
    campoSenha.focus();
}

/* ---------- Login ---------- */

formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (entrando) return; // clique duplo: ignora o segundo

    const tentativa = campoSenha.value;
    if (!tentativa) {
        mostrarErroLogin('Digite a senha.');
        return;
    }
    // Cabeçalhos HTTP só aceitam caracteres "simples" (até o código 255).
    // Um emoji faria o navegador lançar erro e a mensagem enganaria ("sem internet").
    if (/[^\u0000-\u00FF]/.test(tentativa)) {
        mostrarErroLogin('A senha tem um caractere não aceito (como emoji).');
        return;
    }

    entrando = true;
    botaoEntrar.disabled = true;
    mostrarErroLogin('');

    try {
        // 1) A senha está certa? O servidor responde 200, 401 ou 429.
        const v = await chamarApi(URL_VERIFICAR, {
            metodo: 'POST',
            cabecalhos: { 'X-Admin-Password': tentativa },
        });

        if (v.status === 401) {
            mostrarErroLogin('Senha incorreta.');
            campoSenha.select();
            return;
        }
        if (v.status === 429) {
            mostrarErroLogin('Muitas tentativas, tente novamente em alguns minutos.');
            return;
        }
        if (v.status !== 200) {
            mostrarErroLogin('O servidor não respondeu como esperado. Tente novamente.');
            return;
        }

        // 2) Carrega a agenda atual ANTES de abrir o painel.
        // POR QUE: se abríssemos com a agenda vazia e a Yara tocasse em um dia,
        // salvaríamos um calendário quase vazio POR CIMA da agenda real.
        const a = await chamarApi(URL_AGENDA);
        const carregados = a.status === 200 ? validarDias(a.json) : null;
        if (carregados === null) {
            mostrarErroLogin('Não foi possível carregar a agenda. Tente novamente.');
            return;
        }

        senha = tentativa;       // só agora a senha entra na memória
        dias = carregados;
        campoSenha.value = '';   // limpa o campo da tela
        abrirPainel();
    } catch (erro) {
        // Rede offline, tempo esgotado etc.
        mostrarErroLogin('Sem conexão com o servidor. Verifique a internet e tente de novo.');
    } finally {
        entrando = false;
        botaoEntrar.disabled = false;
    }
});

botaoSair.addEventListener('click', () => voltarAoLogin(''));

/* ---------- Calendário ---------- */

/**
 * Cria (ou recria) o calendário do Flatpickr em modo inline.
 * Recriamos quando a tela muda de tamanho para trocar entre 1 e 3 meses.
 */
function criarCalendario() {
    if (calendario) {
        calendario.destroy();
        calendario = null;
    }

    calendario = flatpickr(campoCalendario, {
        inline: true,                       // sempre visível, sem precisar clicar em campo
        locale: flatpickr.l10ns.pt || 'default', // português (arquivo pt.js carregado no HTML)
        showMonths: telaLarga.matches ? 3 : 1,
        minDate: 'today',                   // dias passados ficam desativados (usa a data local)
        closeOnSelect: false,
        onDayCreate: pintarDia,             // chamado para CADA dia desenhado: aplica a cor do estado
    });

    // O Flatpickr foi feito para "escolher uma data". Aqui queremos o contrário:
    // cada toque ALTERNA o estado do dia. Por isso interceptamos o clique na FASE DE
    // CAPTURA (o 3º argumento "true"), que chega antes do tratamento do Flatpickr, e
    // paramos a propagação. Assim o Flatpickr nunca "seleciona" nada e nós controlamos tudo.
    calendario.calendarContainer.addEventListener('click', aoClicarNoCalendario, true);
    calendario.calendarContainer.addEventListener('keydown', aoTeclarNoCalendario, true);
}

/** Pinta um dia conforme o estado guardado. O Flatpickr chama isso ao desenhar cada dia. */
function pintarDia(_datas, _texto, _instancia, celula) {
    // Dias passados (desativados) ficam como o Flatpickr os desenha.
    if (celula.classList.contains('flatpickr-disabled')) return;

    const estado = dias[chaveLocal(celula.dateObj)];
    if (estado === 'bloqueado') {
        celula.classList.add('diaBloqueado');
    } else if (estado === 'agendado') {
        celula.classList.add('diaAgendado');
    }

    // Quem usa leitor de tela precisa ouvir o estado, não só ver a cor.
    if (estado) {
        celula.setAttribute('aria-label', `${celula.getAttribute('aria-label') || ''}, ${estado}`);
    }
}

function aoClicarNoCalendario(evento) {
    const celula = evento.target.closest('.flatpickr-day');
    if (!celula) return;                 // clicou na seta de mês, no título etc.: o Flatpickr cuida
    evento.stopPropagation();            // impede o Flatpickr de "selecionar" o dia
    evento.preventDefault();
    tratarDia(celula);
}

/** Teclado: Enter ou Espaço em um dia faz o mesmo que o toque (acessibilidade). */
function aoTeclarNoCalendario(evento) {
    if (evento.key !== 'Enter' && evento.key !== ' ') return;
    const celula = evento.target.closest && evento.target.closest('.flatpickr-day');
    if (!celula) return;
    evento.stopPropagation();
    evento.preventDefault();
    tratarDia(celula);
}

function tratarDia(celula) {
    if (celula.classList.contains('flatpickr-disabled') || !celula.dateObj) return;
    alternarDia(celula.dateObj);
}

// Se a janela mudar de tamanho (ex.: girar o celular), refaz o calendário com 1 ou 3 meses.
telaLarga.addEventListener('change', () => {
    if (calendario) criarCalendario();
});

/* ---------- Alternar e salvar ---------- */

/**
 * Muda o estado do dia (livre -> bloqueado -> agendado -> livre) e salva.
 * Ordem: 1) muda na tela já (resposta imediata); 2) envia ao servidor;
 * 3) se falhar, volta ao estado anterior.
 */
async function alternarDia(dateObj) {
    // Clique duplo rápido ou toque durante um salvamento: ignoramos.
    // POR QUE: cada salvamento envia o calendário completo; dois ao mesmo tempo poderiam
    // chegar fora de ordem e um apagar o outro. Um de cada vez é simples e seguro.
    if (salvando) return;

    const chave = chaveLocal(dateObj);
    if (chave < hojeChave()) return; // aba aberta de ontem para hoje: o dia pode ter virado passado

    const estadoAnterior = dias[chave]; // undefined = livre
    const proximo = PROXIMO_ESTADO[estadoAnterior || 'livre'];

    if (proximo === 'livre') {
        delete dias[chave]; // dia livre = ausente do objeto
    } else {
        dias[chave] = proximo;
    }
    calendario.redraw(); // redesenha o mês mantendo-o na tela, reaplicando as cores

    await salvar(chave, estadoAnterior);
}

/** Envia o calendário completo ao servidor e trata cada tipo de resposta. */
async function salvar(chave, estadoAnterior) {
    const minhaSessao = sessao;
    salvando = true;
    avisoPainel.textContent = '';
    definirStatus('salvando', 'Salvando...');

    // Desfaz a mudança deste dia na tela (usado em qualquer falha).
    const desfazer = () => {
        if (estadoAnterior === undefined) delete dias[chave];
        else dias[chave] = estadoAnterior;
        if (calendario) calendario.redraw();
    };

    try {
        const r = await chamarApi(URL_SALVAR, {
            metodo: 'POST',
            cabecalhos: {
                'Content-Type': 'application/json',
                'X-Admin-Password': senha, // a senha viaja só no cabeçalho, nunca na URL
            },
            corpo: JSON.stringify({ dias: diasFuturos() }),
        });

        // A Yara clicou em "Sair" enquanto esperávamos: esta resposta é de uma sessão antiga.
        if (minhaSessao !== sessao) return;

        if (r.status === 200) {
            definirStatus('salvo', 'Salvo');
            return;
        }

        desfazer();

        if (r.status === 401) {
            // Senha deixou de valer (ex.: foi trocada no painel da hospedagem): volta ao login.
            voltarAoLogin('Senha incorreta ou expirada. Entre novamente.');
            return;
        }

        definirStatus('erro', 'Erro ao salvar');
        avisoPainel.textContent = r.status === 429
            ? 'Muitas tentativas, tente novamente em alguns minutos. A alteração foi desfeita.'
            : 'Não foi possível salvar. A alteração foi desfeita; tente de novo.';
    } catch (erro) {
        if (minhaSessao !== sessao) return;
        desfazer();
        definirStatus('erro', 'Erro ao salvar');
        avisoPainel.textContent = 'Sem conexão com o servidor. A alteração foi desfeita; tente de novo.';
    } finally {
        if (minhaSessao === sessao) salvando = false;
    }
}

/* ---------- Início ---------- */

// Se o Flatpickr não carregou (internet ruim, bloqueio do CDN), avisamos em vez de
// deixar uma tela de login que não leva a nada.
if (typeof flatpickr === 'undefined') {
    mostrarErroLogin('Não foi possível carregar o calendário. Recarregue a página.');
    botaoEntrar.disabled = true;
} else {
    campoSenha.focus();
}