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



botoesFiltro.forEach(botao => {
    botao.addEventListener("click", function () {
        const filtro = botao.dataset.filtro;

        // marca o botão selecionado
        botoesFiltro.forEach(b => {
            b.classList.toggle("ativo", b === botao);
            b.setAttribute("aria-pressed", b === botao);
        });

        // mostra ou esconde cada card
        let visiveis = 0;
        cardsModelo.forEach(card => {
            const mostrar = filtro === "todas" || card.dataset.categoria === filtro;
            card.hidden = !mostrar;
            if (mostrar) visiveis++;
        });

        avisoVazio.hidden = visiveis > 0;
    });
});

/*Quero Agendar*/

// Edite aqui: estilo -> tamanho -> espessuras
const CATALOGO = {
    "Boxeadora": {
        "Com Cachos": { "A definir com a profissional": 200 },
        "Sem Cachos": { "A definir com a profissional": 130 }
    },
    "Box Braids": {
        "Chanel": { "Espessura P": 400, "Espessura M": 380, "Espessura G": 360 },
        "Médio": { "Espessura P": 430, "Espessura M": 380, "Espessura G": 360 },
        "Cintura": { "Espessura P": 500, "Espessura M": 450, "Espessura G": 400 }
    },
    "Goddess Braids": {
        "Chanel": { "Espessura P": 460, "Espessura M": 440, "Espessura G": 400 },
        "Médio": { "Espessura P": 480, "Espessura M": 450, "Espessura G": 400 },
        "Cintura": { "Espessura P": 550, "Espessura M": 500, "Espessura G": 450 }
    },
    "Ghana Braids": {
        "Com Cachos": ["A definir com a profissional"],
        "Sem Cachos": ["A definir com a profissional"]
    },
    "Gypsy Braids": {
        "Cintura": { "Espessura P": 560, "Espessura M": 500, "Espessura G": 460 }
    },
    "Nagô": {
        "Nagô Masculina": ["Cabelo Natural", "Com Alongamento"],
        "Nagô Tiara": ["A definir com a profissional"],
        "Nagô Topo": ["A definir com a profissional"]
    }

};

const VALOR_SEM_VARIACAO = {
    "Ghana Braids|Sem Cachos": "a partir de R$190,00",
    "Ghana Braids|Com Cachos": "a partir de R$250,00",
    "Nagô|Nagô Masculina|Cabelo Natural": "a partir de R$120,00",
    "Nagô|Nagô Masculina|Com Alongamento": "a partir de R$150,00",
    "Nagô|Nagô Tiara": "a partir de R$90,00",
    "Nagô|Nagô Topo": "a partir de R$40,00"
};

const selServico = document.getElementById("servico");
const selTamanho = document.getElementById("tamanho");
const selEspessura = document.getElementById("espessura");
const boxTamanho = document.getElementById("campoTamanho");
const boxEspessura = document.getElementById("campoEspessura");

// preenche um select com opções, ou esconde o campo se não houver
function preencher(select, caixa, opcoes, rotulo) {
    if (!opcoes || opcoes.length === 0) {
        caixa.hidden = true;
        select.required = false;
        select.innerHTML = "";
        return;
    }
    select.innerHTML =
        `<option value="">Selecione ${rotulo}</option>` +
        opcoes.map(o => `<option>${o}</option>`).join("");
    select.required = true;
    caixa.hidden = false;
}

selServico.addEventListener("change", function () {
    const tamanhos = CATALOGO[selServico.value];
    preencher(selTamanho, boxTamanho, tamanhos && Object.keys(tamanhos), "o tamanho");
    preencher(selEspessura, boxEspessura, null);

    if (tamanhos && Object.keys(tamanhos).length === 1) {
        selTamanho.value = Object.keys(tamanhos)[0];
        selTamanho.dispatchEvent(new Event("change"));
    }
});

selTamanho.addEventListener("change", function () {
    const espessuras = CATALOGO[selServico.value]?.[selTamanho.value];
    const opcoes = Array.isArray(espessuras) ? espessuras : espessuras && Object.keys(espessuras);
    preencher(selEspessura, boxEspessura, opcoes, "a espessura");
});

function formatarReais(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function precoNumerico() {
    const preco = CATALOGO[selServico.value]?.[selTamanho.value]?.[selEspessura.value];
    return typeof preco === "number" ? preco : null;
}

function calcularValor() {
    const preco = precoNumerico();
    if (preco !== null) return formatarReais(preco);

    const chave2 = [selServico.value, selTamanho.value].join("|");
    const chave3 = chave2 + "|" + selEspessura.value;
    return VALOR_SEM_VARIACAO[chave3] || VALOR_SEM_VARIACAO[chave2] || null;
}


/*Mensagem para o WhatsApp + validação*/


const NUMERO = "5534991743504"; // 55 + DDD + número, só dígitos

const formulario = document.getElementById("formAgendamento");
const campoNome = document.getElementById("nome");
const campoData = document.getElementById("data");
const campoHora = document.getElementById("horario");
const modalEnvio = document.getElementById("modalEnvio");

// data mínima = hoje, no horário local
const hoje = new Date();
campoData.min = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

function abrirConfirmacao(dados, url) {
    const resumo = document.getElementById("envioResumo");
    resumo.innerHTML = "";

    [["Nome", dados.nome], ["Serviço", dados.servico], ["Valor", dados.valor], ["Valor do Sinal", dados.vSinal], ["Data", dados.data], ["Horário", dados.horario]]
        .forEach(([rotulo, valor]) => {
            const li = document.createElement("li");
            const negrito = document.createElement("strong");
            negrito.textContent = rotulo + ": ";
            li.append(negrito, valor);
            resumo.append(li);
        });

    document.getElementById("envioLink").href = url;
    modalEnvio.showModal();
}

document.getElementById("envioFechar").addEventListener("click", () => modalEnvio.close());
modalEnvio.addEventListener("click", e => { if (e.target === modalEnvio) modalEnvio.close(); });

function enviarSolicitacao() {
    const nome = campoNome.value.trim();
    const data = campoData.value;
    const horario = campoHora.value;

    const faltando = [];
    if (!nome) faltando.push({ rotulo: "Nome completo", el: campoNome });
    if (!data) faltando.push({ rotulo: "Data", el: campoData });
    if (!horario) faltando.push({ rotulo: "Horário", el: campoHora });
    if (!boxTamanho.hidden && !selTamanho.value) faltando.push({ rotulo: "Tamanho", el: selTamanho });
    if (!boxEspessura.hidden && !selEspessura.value) faltando.push({ rotulo: "Espessura", el: selEspessura });

    if (faltando.length) {
        alert("Preencha os campos obrigatórios:\n\n• " + faltando.map(f => f.rotulo).join("\n• "));
        faltando[0].el.focus();
        return;
    }

    if (data < campoData.min) {
        alert("Escolha uma data a partir de hoje.");
        campoData.focus();
        return;
    }

    const observacao = document.getElementById("observacao").value.trim();

    const partes = [selServico.value, selTamanho.value, selEspessura.value].filter(Boolean);
    const servico = partes.length
        ? partes[0] + (partes.length > 1 ? " (" + partes.slice(1).join(", ") + ")" : "")
        : "não informado";

    const preco = precoNumerico();
    const valor = calcularValor() || "A combinar";
    const vSinal = preco !== null ? formatarReais(preco * 0.3) : "A combinar com a Yasmin";

    const dataBR = data.split("-").reverse().join("/");

    const mensagem =
        "Olá! Gostaria de solicitar um agendamento.\n\n" +
        "Nome: " + nome + "\n" +
        "Serviço: " + servico + "\n" +
        "Valor do serviço: " + valor + "\n" +
        "Valor do sinal (30%): " + vSinal + "\n" +
        "Data: " + dataBR + "\n" +
        "Horário: " + horario + "\n" +
        "Observações: " + (observacao || "nenhuma");

    const url = "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(mensagem);
    abrirConfirmacao({ nome, servico, valor, vSinal, data: dataBR, horario }, url);
}

// a verificação só acontece no clique do botão
document.getElementById("btnEnviar").addEventListener("click", enviarSolicitacao);

// garantia: o Enter nunca envia o formulário
formulario.addEventListener("submit", e => e.preventDefault());

/*Saiba Mais*/

const MODELOS = {
    "boxeadora": {
        servico: "Boxeadora",
        titulo: "Boxeadora",
        fotos: [{ src: "img/Boxeadora.jpeg", legenda: "Boxeadora com Cachos - R$200,00 / Boxeadora sem Cachos - R$130,00" }],
    },
    "boxTamChanel": {
        servico: "Box Braids", tamanho: "Chanel",
        titulo: "Box Braids · Tamanho Chanel",
        descricao: "",
        fotos: [
            { src: "img/BoxEspP.jpeg", legenda: "P - R$400,00" },
            { src: "img/BoxEspM.jpeg", legenda: "M - R$380,00" },
            { src: "img/BoxEspG.jpeg", legenda: "G - R$360,00" }
        ],
        detalhes: [""]
    },
    "boxTamMedio": {
        servico: "Box Braids", tamanho: "Médio",
        titulo: "Box Braids · Tamanho Médio",
        fotos: [
            { src: "img/BoxEspP.jpeg", legenda: "P - R$430,00" },
            { src: "img/BoxEspM.jpeg", legenda: "M - R$380,00" },
            { src: "img/BoxEspG.jpeg", legenda: "G - R$360,00" }
        ],
    },
    "boxTamCintura": {
        servico: "Box Braids", tamanho: "Cintura",
        titulo: "Box Braids · Tamanho Cintura",
        fotos: [
            { src: "img/BoxEspP.jpeg", legenda: "P - R$500,00" },
            { src: "img/BoxEspM.jpeg", legenda: "M - R$450,00" },
            { src: "img/BoxEspG.jpeg", legenda: "G - R$400,00" }
        ],
    },
    "GhanaBraids": {
        servico: "Ghana Braids",
        titulo: "Ghana Braids",
        fotos: [
            { src: "img/GhanaBraids.jpeg", legenda: "A partir de R$190,00 / OBS:.Os valores vão de acordo com o modelo escolhido e a quantidade de tranças" }
        ],
    },
    "GhanaBraidsCcachos": {
        servico: "Ghana Braids",
        titulo: "Ghana Braids com Cachos",
        fotos: [{ src: "img/GhanaBraidsCcachos.jpeg", legenda: "A partir de R$250,00 / OBS:.Os valores vão de acordo com o modelo escolhido e a quantidade de tranças" }],
    },
    "GoddessTamChanel": {
        servico: "Goddess Braids", tamanho: "Chanel",
        titulo: "Goddess Braids · Tamanho Chanel",
        fotos: [
            { src: "img/GoddesEspP.jpeg", legenda: "P - R$460,00" },
            { src: "img/GoddesEspM.jpeg", legenda: "M - R$440,00" },
            { src: "img/GoddesEspG.jpeg", legenda: "G - R$400,00" }
        ],
    },
    "GoddessTamMedia": {
        servico: "Goddess Braids", tamanho: "Médio",
        titulo: "Goddess Braids · Tamanho Médio",
        descricao: "",
        fotos: [
            { src: "img/GoddesEspP.jpeg", legenda: "P - R$480,00" },
            { src: "img/GoddesEspM.jpeg", legenda: "M - R$450,00" },
            { src: "img/GoddesEspG.jpeg", legenda: "G - R$400,00" }
        ],
        detalhes: [""]
    },
    "GoddessTamCintura": {
        servico: "Goddess Braids", tamanho: "Cintura",
        titulo: "Goddess Braids · Tamanho Cintura",
        descricao: "",
        fotos: [
            { src: "img/GoddesEspP.jpeg", legenda: "P - R$550,00" },
            { src: "img/GoddesEspM.jpeg", legenda: "M - R$500,00" },
            { src: "img/GoddesEspG.jpeg", legenda: "G - R$450,00" }
        ],
        detalhes: [""]
    },
    "GypsyEspessuraP": {
        servico: "Gypsy Braids", tamanho: "Cintura",
        titulo: "Gypsy Braids · Tamanho Cintura",
        fotos: [
            { src: "img/GypsyEspP.jpeg", legenda: "P - R$560,00" },
        ],
    },
    "GypsyEspessuraM": {
        servico: "Gypsy Braids", tamanho: "Cintura",
        titulo: "Gypsy Braids · Tamanho Cintura",
        fotos: [
            { src: "img/GypsyEspM.jpeg", legenda: "M - R$500,00" },
        ],
    },
    "GypsyEspessuraG": {
        servico: "Gypsy Braids", tamanho: "Cintura",
        titulo: "Gypsy Braids · Tamanho Cintura",
        fotos: [
            { src: "img/GypsyEspG.jpeg", legenda: "G - R$460,00" }
        ]
    },
    "NagoMasculina": {
        servico: "Nagô",
        titulo: "Nagô Masculina",
        fotos: [{ src: "img/NagoMasculina.jpeg", legenda: "Cabelo Natural -> A partir de R$120,00" },
        { src: "img/NagoMasculina.jpeg", legenda: "Com Alongamento -> A partir de R$150,00 dependendo do modelo escolhido" }
        ],
    },
    "NagoTira": {
        servico: "Nagô",
        titulo: "Nagô Tiara",
        fotos: [{ src: "img/NagoTiara.jpeg", legenda: "A partir de R$90,00 / OBS:.Os valores vão de acordo com o modelo escolhido" }],
    },
    "NagoTopo": {
        servico: "Nagô",
        titulo: "Nagô Topo",
        fotos: [
            { src: "img/NagoTopo1.jpeg", legenda: "A partir de R$40,00 / OBS:.Os valores vão de acordo com o modelo escolhido" },
            { src: "img/NagoTopo2.jpeg", legenda: "A partir de R$40,00 / OBS:.Os valores vão de acordo com o modelo escolhido" },
        ],
    }
};

const modal = document.getElementById("modalModelo");

// abrir: qualquer botão com data-modelo
document.addEventListener("click", function (e) {
    const botao = e.target.closest("[data-modelo]");
    if (!botao) return;

    const m = MODELOS[botao.dataset.modelo];
    if (!m) {
        console.warn("Modelo sem cadastro em MODELOS:", botao.dataset.modelo);
        return;
    }

    document.getElementById("modalTitulo").textContent = m.titulo;
    document.getElementById("modalDescricao").textContent = m.descricao;

    document.getElementById("modalFotos").innerHTML = m.fotos.map(f =>
        `<figure>
            <img src="${f.src}" alt="${m.titulo} - ${f.legenda}">
            <figcaption>${f.legenda}</figcaption>
        </figure>`
    ).join("");

    const lista = document.getElementById("modalDetalhes");
    lista.innerHTML = (m.detalhes || []).map(d => `<li>${d}</li>`).join("");
    lista.hidden = !(m.detalhes && m.detalhes.length);

    const agendar = document.getElementById("modalAgendar");
    agendar.dataset.servico = m.servico;
    agendar.dataset.tamanho = m.tamanho || "";

    modal.showModal();
    modal.scrollTop = 0;
});

// fechar: botão X, clique fora do quadro ou tecla Esc (nativa)
modal.querySelector(".modalFechar").addEventListener("click", () => modal.close());
modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.close();
});

// "Agendar este modelo": já preenche o formulário
document.getElementById("modalAgendar").addEventListener("click", function () {
    selServico.value = this.dataset.servico;
    selServico.dispatchEvent(new Event("change"));

    if (this.dataset.tamanho) {
        selTamanho.value = this.dataset.tamanho;
        selTamanho.dispatchEvent(new Event("change"));
    }
    modal.close();
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