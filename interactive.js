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
const botaoTodos = document.getElementById('botaoTodos');
const botaoFiltrar = document.getElementById('botaoFiltrar');
const listaFiltros = document.getElementById('listaFiltros');
const botoesFiltro = listaFiltros.querySelectorAll('button');
const selecionados = new Set();   // guarda os ids dos modelos marcados

function atualizarFiltro() {
    const semFiltro = selecionados.size === 0;
    botaoTodos.classList.toggle('ativo', semFiltro);

    botoesFiltro.forEach(botao => {
        const ativo = selecionados.has(botao.dataset.alvo);
        botao.classList.toggle('ativo', ativo);
        botao.setAttribute('aria-pressed', ativo);
    });

    cards.forEach(card => {
        // sem filtro: mostra todos. Com filtro: só os marcados
        card.hidden = !semFiltro && !selecionados.has(card.id);
    });
}

botaoFiltrar.addEventListener('click', () => {
    const abrir = listaFiltros.hidden;
    listaFiltros.hidden = !abrir;
    botaoFiltrar.setAttribute('aria-expanded', abrir);
});

botaoTodos.addEventListener('click', () => {
    selecionados.clear();
    atualizarFiltro();
});

botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
        const alvo = botao.dataset.alvo;
        if (selecionados.has(alvo)) selecionados.delete(alvo);
        else selecionados.add(alvo);
        atualizarFiltro();
    });
});

/* ===== FORMULÁRIO ===== */
const form = document.getElementById('formAgendamento');
const campoNome = document.getElementById('nome');
const selectModelo = document.getElementById('modelo');
const linhaDetalhes = document.getElementById('linhaDetalhes');
const selectTamanho = document.getElementById('tamanho');
const selectEspessura = document.getElementById('espessura');
const campoData = document.getElementById('data');
const campoHora = document.getElementById('hora');
const campoObs = document.getElementById('observacoes');

// não deixa escolher data que já passou
const hoje = new Date();
campoData.min = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

function preencherSelect(select, itens, textoInicial) {
    select.length = 0;
    const inicial = new Option(textoInicial, '', true, true);
    inicial.disabled = true;
    select.add(inicial);
    itens.forEach(item => select.add(new Option(item, item)));
}

// lê o card do modelo escolhido e monta os selects de tamanho e espessura
function atualizarDetalhes() {
    const card = document.getElementById(selectModelo.value);   // sem modelo escolhido = null
    linhaDetalhes.hidden = !card;
    // required só enquanto o campo aparece (campo obrigatório escondido trava o envio)
    selectTamanho.required = selectEspessura.required = !!card;
    if (!card) return;

    const tamanhos = [...card.querySelectorAll('.listaTamanhos li')]
        .map(li => li.textContent.trim());
    const espessuras = [...card.querySelectorAll('.listaEspessuras li strong')]
        .map(nome => nome.textContent.trim());

    preencherSelect(selectTamanho, tamanhos, 'Selecione o tamanho');
    preencherSelect(selectEspessura, espessuras, 'Selecione a espessura');
}

selectModelo.addEventListener('change', atualizarDetalhes);
form.addEventListener('reset', () => setTimeout(atualizarDetalhes));

function irParaFormulario(card) {
    selectModelo.value = card.id;
    atualizarDetalhes();
    document.getElementById('agendarHorario').scrollIntoView({ behavior: 'smooth' });
    selectTamanho.focus({ preventScroll: true });
}

/* ===== BOTÕES "AGENDAR" E "SOBRE O MODELO" DOS CARDS ===== */
const dialogModelo = document.getElementById('dialogModelo');
const sobreFoto = document.getElementById('sobreFoto');
const sobreTitulo = document.getElementById('sobreTitulo');
const sobrePreco = document.getElementById('sobrePreco');
const sobreConteudo = document.getElementById('sobreConteudo');
const sobreAgendar = document.getElementById('sobreAgendar');
let cardAberto = null;

function abrirSobre(card) {
    const foto = card.querySelector('img');
    cardAberto = card;
    sobreFoto.src = foto.src;
    sobreFoto.alt = foto.alt;
    sobreTitulo.textContent = card.querySelector('h3').textContent;
    sobrePreco.textContent = card.querySelector('.modeloPreco').textContent;
    sobreConteudo.innerHTML = card.querySelector('.modeloDetalhes').innerHTML;   // copia o bloco escondido
    dialogModelo.showModal();
}

document.querySelectorAll('.modeloAgendar').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        irParaFormulario(link.closest('.modelocardFilho'));
    });
});

document.querySelectorAll('.modeloSobre').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        abrirSobre(link.closest('.modelocardFilho'));
    });
});

sobreAgendar.addEventListener('click', () => {
    dialogModelo.close();
    irParaFormulario(cardAberto);
});

/* ===== CONFIRMAÇÃO + WHATSAPP ===== */
/* ===== WHATSAPP: 55 + DDD + número, sem símbolos ===== */
const NUMERO_WHATSAPP = '5534992055886';   // número de teste
const dialogConfirmacao = document.getElementById('dialogConfirmacao');
const confLista = document.getElementById('confLista');
const confEditar = document.getElementById('confEditar');
const confEnviar = document.getElementById('confEnviar');

function formatarData(valor) {
    const [ano, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${ano}`;
}

function lerDados() {
    const card = document.getElementById(selectModelo.value);
    return {
        nome: campoNome.value.trim(),
        modelo: selectModelo.selectedOptions[0].text,
        valor: card.querySelector('.modeloPreco').textContent.trim(),   // o preço vem do card
        tamanho: selectTamanho.value,
        espessura: selectEspessura.value,
        data: formatarData(campoData.value),
        hora: campoHora.value,
        obs: campoObs.value.trim(),
    };
}

function montarMensagem(d) {
    const linhas = [
        'Olá, Yara! Gostaria de solicitar um horário.',
        '',
        `*Nome:* ${d.nome}`,
        `*Modelo:* ${d.modelo}`,
        `*Valor:* ${d.valor}`,
        `*Tamanho:* ${d.tamanho}`,
        `*Espessura:* ${d.espessura}`,
        `*Data:* ${d.data}`,
        `*Hora:* ${d.hora}`,
    ];
    if (d.obs) linhas.push(`*Observações:* ${d.obs}`);
    return linhas.join('\n');
}

// o "submit" só acontece se o navegador achar o formulário válido
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = lerDados();

    confLista.innerHTML = '';
    [
        ['Nome', d.nome], ['Modelo', d.modelo], ['Valor', d.valor],
        ['Tamanho', d.tamanho], ['Espessura', d.espessura],
        ['Data', d.data], ['Hora', d.hora], ['Observações', d.obs || '—'],
    ].forEach(([rotulo, valor]) => {
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = rotulo;
        dd.textContent = valor;
        confLista.append(dt, dd);
    });

    confEnviar.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(montarMensagem(d))}`;
    dialogConfirmacao.showModal();
});

confEditar.addEventListener('click', () => {
    dialogConfirmacao.close();   // o formulário não é limpo: tudo continua preenchido
    campoNome.focus();
});

confEnviar.addEventListener('click', () => {
    setTimeout(() => dialogConfirmacao.close(), 300);
});

/* ===== FECHAR JANELAS: botão X ou clique no fundo escuro ===== */
document.querySelectorAll('dialog').forEach(janela => {
    janela.addEventListener('click', (e) => { if (e.target === janela) janela.close(); });
    janela.querySelectorAll('[data-fechar]').forEach(botao =>
        botao.addEventListener('click', () => janela.close())
    );
});