//Menu Mobile
const nav = document.querySelector('.navegadorPai');
const botaoMenu = document.getElementById('botaoMenu');
const menu = document.getElementById('menuConteudo');

function alternarMenu(abrir) {
    const aberto = abrir ?? !nav.classList.contains('aberto');
    nav.classList.toggle('aberto', aberto);
    botaoMenu.setAttribute('aria-expanded', aberto);
    botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
}

botaoMenu.addEventListener('click', () => alternarMenu());

// clicou em um link: fecha o menu
menu.querySelectorAll('a').forEach(link =>
    link.addEventListener('click', () => alternarMenu(false))
);

// clicou fora da nav ou apertou Esc: fecha
document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) alternarMenu(false);
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') alternarMenu(false);
});

// se a tela voltar a ser desktop, garante o menu fechado
window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
    if (e.matches) alternarMenu(false);
});

//Faixa de modelos

const faixa = document.querySelector('.faixaModelos');
const grupos = faixa.querySelectorAll('.faixaGrupo');
const original = grupos[0].innerHTML;

const larguraMinima = Math.max(faixa.offsetWidth, window.screen.width) * 1.1;

while (grupos[0].scrollWidth < larguraMinima) {
    grupos[0].insertAdjacentHTML('beforeend', original);
}

grupos[1].innerHTML = grupos[0].innerHTML;
/* ===== FILTRO DE MODELOS ===== */
const cards = document.querySelectorAll('.modelocardFilho');
const filtro = document.querySelector('.modeloFiltro');
const botaoTodos = document.getElementById('botaoTodos');
const botaoFiltrar = document.getElementById('botaoFiltrar');
const listaFiltros = document.getElementById('listaFiltros');
const botoesFiltro = listaFiltros.querySelectorAll('button');

listaFiltros.hidden = false;   // quem abre e fecha a lista agora é a classe "aberto" (CSS)

// mostra só o modelo escolhido; 'todos' mostra tudo
function mostrarModelo(chave) {
    botaoTodos.classList.toggle('ativo', chave === 'todos');

    botoesFiltro.forEach(botao => {
        const ativo = botao.dataset.filtro === chave;
        botao.classList.toggle('ativo', ativo);
        botao.setAttribute('aria-pressed', ativo);
    });

    cards.forEach(card => {
        const mostrar = chave === 'todos' || card.dataset.categoria === chave;
        card.style.display = mostrar ? '' : 'none';
    });
}

botaoTodos.addEventListener('click', () => mostrarModelo('todos'));

botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
        // clicar de novo no modelo marcado volta a mostrar todos
        const jaMarcado = botao.classList.contains('ativo');
        mostrarModelo(jaMarcado ? 'todos' : botao.dataset.filtro);
    });
});

botaoFiltrar.addEventListener('click', () => {
    const aberto = filtro.classList.toggle('aberto');
    botaoFiltrar.setAttribute('aria-expanded', aberto);
});

/* =====================================================================
   MODELOS, VALORES E ADICIONAIS
   - A chave (boxBraids, ghanaBraids...) é a mesma do data-categoria do card.
   - rotulo: nome do campo no formulário. plural: título da lista na janela "Sobre".
   - opcoes: cada linha é uma opção com o valor. Para colocar foto, acrescente
     foto: 'img/arquivo.jpg' (e, se quiser, detalhe: 'texto curto') na linha.
   - adicionais: valor somado ao total. porUnidade: true = a cliente escolhe a quantidade.
   ===================================================================== */
const NUMERO_WHATSAPP = '5534992055886';   // 55 + DDD + número, só dígitos (número de teste)

const MODELOS = {
    goddessBraids: {
        nome: 'Goddes Braids',
        subtitulo: 'Com cachos (Goddess Braids)',
        rotulo: 'Espessura',
        plural: 'Espessuras',
        opcoes: [
            { nome: 'Espessura P', valor: 470 },   // foto: 'img/box-espessura-p.jpg',
            { nome: 'Espessura M', valor: 450 },
            { nome: 'Espessura G', valor: 430 },
        ],
    },
    bohoCurls: {
        nome: 'Boho Curls',
        rotulo: 'Espessura',
        plural: 'Espessuras',
        opcoes: [
            { nome: 'Espessura P', valor: 460 },
            { nome: 'Espessura M', valor: 440 },
            { nome: 'Espessura G', valor: 420 },
        ],
    },
    fulaniLimonade: {
        nome: 'Fulani Limonade Braids',
        subtitulo: 'Tradicional (sem cachos)',
        rotulo: 'Espessura',
        plural: 'Espessuras',
        opcoes: [
            { nome: 'Espessura P', valor: 395 },
            { nome: 'Espessura M', valor: 375 },
        ],
    },
    ghanaBraids: {
        nome: 'Ghana Braids',
        rotulo: 'Quantidade de tranças',
        plural: 'Quantidade de tranças',
        opcoes: [
            { nome: '4 tranças', valor: 150 },
            { nome: '6 tranças', valor: 170 },
            { nome: '8 tranças', valor: 190 },
            { nome: '10 tranças', valor: 210 },
        ],
        adicionais: [
            { nome: 'Com cachos', valor: 35 },
            { nome: 'Adição de tranças', valor: 10, porUnidade: true },
        ],
    },
    gipsy: {
        nome: 'Gipsy',
        rotulo: 'Espessura',
        plural: 'Espessuras',
        opcoes: [
            { nome: 'Espessura P', valor: 490 },
            { nome: 'Espessura M', valor: 470 },
            { nome: 'Espessura G', valor: 450 },
            { nome: 'Espessura GG', valor: 420 },
        ],
    },
    nagoMas: {
        nome: 'Nagô Masculina',
        rotulo: 'Estilo',
        plural: 'Estilos',
        opcoes: [
            { nome: 'Nagô Simples', valor: 130 },
            { nome: 'Nagô Freestyle Simples', valor: 145 },
            { nome: 'Nagô Freestyle', valor: 180 },
            { nome: 'Nagô Freestyle Avançado', valor: 210 },
            { nome: 'Flat Twist', valor: 175 },
        ],
        adicionais: [
            { nome: 'Adição de jumbo', valor: 15 },
        ],
    },
};

/* ===== FUNÇÕES DE VALOR ===== */
const reais = (v) => 'R$' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

function faixaDePreco(m) {
    const valores = m.opcoes.map(o => o.valor);
    const menor = Math.min(...valores);
    const maior = Math.max(...valores);
    let texto = menor === maior ? reais(menor) : `${reais(menor)} a ${reais(maior)}`;
    if (m.adicionais && m.adicionais.length) texto += ' +adicionais';
    return texto;
}

function calcularValor(m, nomeOpcao, adicionais) {
    const opcao = m.opcoes.find(o => o.nome === nomeOpcao);
    if (!opcao) return null;
    return opcao.valor + adicionais.reduce((soma, a) => soma + a.valor * a.qtd, 0);
}

// o preço de cada card vem da lista acima (o texto do HTML serve de reserva)
cards.forEach(card => {
    const m = MODELOS[card.dataset.categoria];
    const preco = card.querySelector('p');
    if (m && preco) preco.textContent = faixaDePreco(m);
});

/* ===== FORMULÁRIO ===== */
const formulario = document.getElementById('formAgendamento');
const campoNome = document.getElementById('nome');
const selServico = document.getElementById('servico');
const linhaDetalhes = document.getElementById('linhaDetalhes');
const rotuloOpcao = document.getElementById('rotuloOpcao');
const selOpcao = document.getElementById('opcao');
const campoAdicionais = document.getElementById('campoAdicionais');
const listaAdicionais = document.getElementById('listaAdicionais');
const campoData = document.getElementById('data');
const campoHora = document.getElementById('hora');
const campoObs = document.getElementById('observacoes');

// as opções do select vêm da lista de modelos
selServico.length = 1;   // mantém só "Selecione o serviço"
Object.entries(MODELOS).forEach(([chave, m]) => selServico.add(new Option(m.nome, chave)));

/* ===== CALENDÁRIO DA DATA (Flatpickr) + DIAS INDISPONÍVEIS ===== */

// "AAAA-MM-DD" pela data LOCAL. Nunca toISOString(): ele usa UTC e erraria o dia à noite no Brasil.
function chaveLocal(data) {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

// Dias "bloqueado" ou "agendado" vindos do servidor. Começa vazio: se a busca falhar, tudo fica livre.
const diasIndisponiveis = new Set();
let fpData = null;                 // instância do Flatpickr (null se a biblioteca não carregou)
let campoDataVisivel = campoData;  // campo que a cliente enxerga (muda para o altInput quando há Flatpickr)

if (typeof flatpickr === 'function') {
    fpData = flatpickr(campoData, {
        locale: 'pt',
        dateFormat: 'Y-m-d',   // valor interno, o mesmo que o código antigo espera
        altInput: true,        // campo visível mostra DD/MM/AAAA
        altFormat: 'd/m/Y',
        minDate: 'today',      // hoje pela data local
        disableMobile: true,   // o seletor nativo do celular não consegue desativar dias específicos
        allowInput: false,
        disable: [(data) => diasIndisponiveis.has(chaveLocal(data))],
    });
    campoDataVisivel = fpData.altInput;
    campoDataVisivel.id = 'dataVisivel';
    // O <label for="data"> passa a apontar para o campo visível.
    const rotuloData = document.querySelector('label[for="data"]');
    if (rotuloData) rotuloData.htmlFor = 'dataVisivel';
    carregarAgenda();
} else {
    // Plano B: se o Flatpickr não carregou, o campo de data nativo continua funcionando.
    campoData.min = chaveLocal(new Date());
}

// Busca os dias indisponíveis. Qualquer falha (rede, erro, resposta estranha) é ignorada:
// o agendamento nunca pode quebrar por causa disso.
async function carregarAgenda() {
    const controle = new AbortController();
    const limite = setTimeout(() => controle.abort(), 8000);
    try {
        const resposta = await fetch('/api/agenda', { signal: controle.signal });
        if (!resposta.ok) return;
        const json = await resposta.json();
        if (!json || typeof json.dias !== 'object' || json.dias === null || Array.isArray(json.dias)) return;

        diasIndisponiveis.clear();
        Object.entries(json.dias).forEach(([dia, estado]) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(dia) && (estado === 'bloqueado' || estado === 'agendado')) {
                diasIndisponiveis.add(dia);
            }
        });
        // Se a cliente já tinha escolhido um dia que acabou de ficar indisponível, limpa a escolha.
        if (diasIndisponiveis.has(campoData.value)) fpData.clear();
        fpData.redraw(); // redesenha o calendário aplicando os dias desativados
    } catch (erro) {
        /* sem internet ou tempo esgotado: segue com todos os dias livres */
    } finally {
        clearTimeout(limite);
    }
}

// mostra o segundo campo (e os adicionais) só quando o modelo tem opções
function atualizarDetalhes() {
    const m = MODELOS[selServico.value];
    linhaDetalhes.hidden = !m;
    campoAdicionais.hidden = !(m && m.adicionais && m.adicionais.length);
    selOpcao.length = 0;
    listaAdicionais.innerHTML = '';
    if (!m) return;

    rotuloOpcao.textContent = m.rotulo;
    selOpcao.add(new Option('Selecione uma opção', ''));
    m.opcoes.forEach(o => selOpcao.add(new Option(`${o.nome} — ${reais(o.valor)}`, o.nome)));

    (m.adicionais || []).forEach((a, i) => {
        const texto = `${a.nome} (+ ${reais(a.valor)}${a.porUnidade ? ' cada' : ''})`;
        const linha = document.createElement('label');
        linha.className = 'adicionalLinha';
        linha.innerHTML = a.porUnidade
            ? `<input type="number" min="0" max="20" value="0" data-indice="${i}"><span>${texto}</span>`
            : `<input type="checkbox" data-indice="${i}"><span>${texto}</span>`;
        listaAdicionais.append(linha);
    });
}

selServico.addEventListener('change', atualizarDetalhes);

// adicionais escolhidos, com a quantidade
function lerAdicionais(m) {
    return [...listaAdicionais.querySelectorAll('input')]
        .map(input => {
            const a = m.adicionais[Number(input.dataset.indice)];
            const qtd = input.type === 'checkbox'
                ? (input.checked ? 1 : 0)
                : Math.max(0, parseInt(input.value, 10) || 0);
            return { ...a, qtd };
        })
        .filter(a => a.qtd > 0);
}

function irParaFormulario(chave) {
    selServico.value = chave;
    atualizarDetalhes();
    document.getElementById('preenchaCard').scrollIntoView({ behavior: 'smooth' });
    campoNome.focus({ preventScroll: true });
}

/* ===== "AGENDAR" E "SOBRE O MODELO" DOS CARDS ===== */
const dialogModelo = document.getElementById('dialogModelo');
const sobreFoto = document.getElementById('sobreFoto');
const sobrePreco = document.getElementById('sobrePreco');
const sobreTitulo = document.getElementById('sobreTitulo');
const sobreSubtitulo = document.getElementById('sobreSubtitulo');
const sobreConteudo = document.getElementById('sobreConteudo');
const sobreAgendar = document.getElementById('sobreAgendar');
let modeloAberto = null;

function abrirSobre(chave) {
    const m = MODELOS[chave];
    const card = document.querySelector(`.modelocardFilho[data-categoria="${chave}"]`);
    modeloAberto = chave;

    sobreFoto.src = card.querySelector('img').src;
    sobreFoto.alt = m.nome;
    sobrePreco.textContent = faixaDePreco(m);
    sobreTitulo.textContent = m.nome;
    sobreSubtitulo.textContent = m.subtitulo || '';
    sobreSubtitulo.hidden = !m.subtitulo;

    let html = `<h4>${m.plural}</h4><ul class="modalOpcoes">` + m.opcoes.map(o => `
        <li>
            ${o.foto ? `<img src="${o.foto}" alt="${m.nome} - ${o.nome}">` : ''}
            <strong>${o.nome}</strong>
            <span class="valorOpcao">${reais(o.valor)}</span>
            ${o.detalhe ? `<small>${o.detalhe}</small>` : ''}
        </li>`).join('') + '</ul>';

    if (m.adicionais && m.adicionais.length) {
        html += '<h4>Adicionais</h4><ul class="modalAdicionais">' + m.adicionais.map(a =>
            `<li>${a.nome}<b>+ ${reais(a.valor)}${a.porUnidade ? ' cada' : ''}</b></li>`).join('') + '</ul>';
    }
    if (m.observacao) html += `<p class="modalObs">${m.observacao}</p>`;

    sobreConteudo.innerHTML = html;
    dialogModelo.showModal();
}

document.querySelector('.modeloCardmae').addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    e.preventDefault();
    const chave = link.closest('.modelocardFilho').dataset.categoria;
    if (link.classList.contains('modeloSobre')) abrirSobre(chave);
    else irParaFormulario(chave);
});

sobreAgendar.addEventListener('click', () => {
    dialogModelo.close();
    irParaFormulario(modeloAberto);
});

/* ===== CONFIRMAÇÃO + WHATSAPP ===== */
const dialogConfirmacao = document.getElementById('dialogConfirmacao');
const confLista = document.getElementById('confLista');
const confEditar = document.getElementById('confEditar');
const confEnviar = document.getElementById('confEnviar');

function formatarData(valor) {
    const [ano, mes, dia] = valor.split('-').map(Number);
    const diaSemana = new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano} (${diaSemana})`;
}

function montarMensagem(d) {
    const linhas = [
        'Olá, Yara! Gostaria de solicitar um agendamento ✨',
        '',
        `👤 *Nome:* ${d.nome}`,
        `💇‍♀️ *Modelo:* ${d.modelo}`,
        `🧵 *${d.rotulo}:* ${d.opcao}`,
    ];
    if (d.adicionais) linhas.push(`➕ *Adicionais:* ${d.adicionais}`);
    linhas.push(
        `💰 *Valor:* ${d.valor}`,
        `📅 *Data:* ${d.data}`,
        `⏰ *Horário:* ${d.hora}`,
        `📝 *Observações:* ${d.obs || 'nenhuma'}`
    );
    return linhas.join('\n');
}

function enviarSolicitacao() {
    const m = MODELOS[selServico.value];

    // verificação só no clique do botão, com aviso dos campos que faltam
    const faltando = [];
    if (!campoNome.value.trim()) faltando.push({ rotulo: 'Nome completo', el: campoNome });
    if (!m) faltando.push({ rotulo: 'Modelo desejado', el: selServico });
    else if (!selOpcao.value) faltando.push({ rotulo: m.rotulo, el: selOpcao });
    if (!campoData.value) faltando.push({ rotulo: 'Data', el: campoDataVisivel });
    if (!campoHora.value) faltando.push({ rotulo: 'Hora', el: campoHora });

    if (faltando.length) {
        alert('Preencha os campos obrigatórios:\n\n• ' + faltando.map(f => f.rotulo).join('\n• '));
        faltando[0].el.focus();
        return;
    }
    if (campoData.value < chaveLocal(new Date())) {
        alert('Escolha uma data a partir de hoje.');
        campoDataVisivel.focus();
        return;
    }
    // Última barreira: se o dia ficou indisponível depois de escolhido, não deixa enviar.
    if (diasIndisponiveis.has(campoData.value)) {
        alert('Esse dia não está disponível. Escolha outra data.');
        fpData.clear();
        campoDataVisivel.focus();
        return;
    }

    const adicionais = lerAdicionais(m);
    const total = calcularValor(m, selOpcao.value, adicionais);

    const dados = {
        nome: campoNome.value.trim(),
        modelo: m.nome + (m.subtitulo ? ' – ' + m.subtitulo : ''),
        rotulo: m.rotulo,
        opcao: selOpcao.value,
        adicionais: adicionais.map(a => a.porUnidade ? `${a.nome} (${a.qtd}x)` : a.nome).join(', '),
        valor: total === null ? 'A combinar' : reais(total),
        data: formatarData(campoData.value),
        hora: campoHora.value,
        obs: campoObs.value.trim(),
    };

    const resumo = [['Nome', dados.nome], ['Modelo', dados.modelo], [dados.rotulo, dados.opcao]];
    if (dados.adicionais) resumo.push(['Adicionais', dados.adicionais]);
    resumo.push(['Valor', dados.valor], ['Data', dados.data], ['Horário', dados.hora], ['Observações', dados.obs || '—']);

    confLista.innerHTML = '';
    resumo.forEach(([rotulo, valor]) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = rotulo;
        dd.textContent = valor;                      // textContent: o que a cliente digita nunca vira HTML
        if (rotulo === 'Valor') dd.className = 'confValor';
        confLista.append(dt, dd);
    });

    confEnviar.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(montarMensagem(dados))}`;
    dialogConfirmacao.showModal();
}

document.getElementById('btnEnviar').addEventListener('click', enviarSolicitacao);

// o Enter nunca envia: ele pula para o próximo campo
formulario.addEventListener('submit', e => e.preventDefault());
formulario.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    // O Flatpickr reabre o calendário no Enter; fechamos logo depois de todos os handlers dele.
    if (fpData && e.target === campoDataVisivel) setTimeout(() => fpData.close(), 0);
    // type "hidden" fora da lista: o campo original da data é hidden e não pode receber foco.
    const campos = [...formulario.querySelectorAll('input, select, textarea')]
        .filter(c => !c.closest('[hidden]') && c.type !== 'hidden');
    const proximo = campos[campos.indexOf(e.target) + 1];
    if (proximo) proximo.focus();
});

confEditar.addEventListener('click', () => {
    dialogConfirmacao.close();   // o formulário não é limpo: tudo continua preenchido
    campoNome.focus();
});

confEnviar.addEventListener('click', () => {
    setTimeout(() => dialogConfirmacao.close(), 300);
});

/* ===== FECHAR JANELAS: botão X, botão Fechar ou clique no fundo escuro ===== */
document.querySelectorAll('dialog').forEach(janela => {
    janela.addEventListener('click', (e) => { if (e.target === janela) janela.close(); });
    janela.querySelectorAll('[data-fechar]').forEach(botao =>
        botao.addEventListener('click', () => janela.close())
    );
});