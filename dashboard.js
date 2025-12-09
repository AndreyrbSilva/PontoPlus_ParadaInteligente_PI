// Variáveis globais dos gráficos
let chartOnibus, chartSensores, chartAtraso;
let dadosOnibus = [];
let dadosLinhas = [];
let dadosSensores = [];

// Configurações globais de estilo para o Chart.js
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.color = '#a3aed0';
Chart.defaults.scale.grid.color = 'rgba(0,0,0,0.02)';

async function carregarDados() {
    try {
        // Busca os dados das APIs
        const [resOnibus, resLinhas, resSensores] = await Promise.all([
            fetch("/api/onibus"),
            fetch("/api/linhas"),
            fetch("/api/sensores")
        ]);

        dadosOnibus = await resOnibus.json();
        dadosLinhas = await resLinhas.json();
        dadosSensores = await resSensores.json();

        preencherFiltroLinhas();
        atualizarDashboard();

    } catch (error) {
        console.error("Erro ao carregar dados do servidor:", error);
    }
}

function preencherFiltroLinhas() {
    let select = document.getElementById("filtroLinha");

    while (select.options.length > 1) {
        select.remove(1);
    }

    dadosLinhas.forEach(l => {
        let opt = document.createElement("option");

        opt.value = l.numero_linha; 
        
        opt.textContent = `${l.numero_linha} — ${l.nome}`;
        select.appendChild(opt);
    });

    select.addEventListener("change", atualizarDashboard);
}

function atualizarDashboard() {
    const linhaSelecionada = document.getElementById("filtroLinha").value;

    let onibusFiltrados = dadosOnibus;

    if (linhaSelecionada) {
        onibusFiltrados = onibusFiltrados.filter(o => 
            String(o.linha_id) === String(linhaSelecionada)
        );
    }

    atualizarKPIs(onibusFiltrados, linhaSelecionada);
    gerarGraficos(onibusFiltrados, dadosSensores);
}

function atualizarKPIs(onibus, linhaSelecionada) {
    document.getElementById("kpiOnibus").innerText = onibus.length;
    
    let online = 0;
    onibus.forEach(o => {
        let s = (o.status || "").toLowerCase().trim();
        if (["online","ativo","funcionando","operante","em_operacao"].includes(s)) {
            online++;
        }
    });
    document.getElementById("kpiOnline").innerText = online;

    const elKpiLinhas = document.getElementById("kpiLinhas");
    if(elKpiLinhas) {
        const cardLinhas = elKpiLinhas.closest('.card-kpi');
        
        if (linhaSelecionada) {
            cardLinhas.style.display = 'none';
        } else {
            cardLinhas.style.display = ''; 
            elKpiLinhas.innerText = dadosLinhas.length;
        }
    }

    document.getElementById("kpiSensores").innerText = dadosSensores.length;

    let atrasos = [];
    onibus.forEach(o => {
        if (o.hora_prevista && o.hora_real) {
            let previsto = new Date(o.hora_prevista);
            let real = new Date(o.hora_real);
            atrasos.push((real - previsto) / 60000);
        }
    });

    let mediaAtraso = atrasos.length ? atrasos.reduce((a,b)=>a+b)/atrasos.length : 0;
    document.getElementById("kpiAtraso").innerText = mediaAtraso.toFixed(1) + " min";
}

function gerarGraficos(onibus, sensores) {
    if (chartOnibus) chartOnibus.destroy();
    if (chartSensores) chartSensores.destroy();
    if (chartAtraso) chartAtraso.destroy();

    const colors = {
        online: "#4ADE80",       
        offline: "#94A3B8",      
        manutencao: "#FBBF24",   
        
        ativo: "#38BDF8",        
        inativo: "#EF4444",      
        
        linha: "#6366F1",        
        pontoBorda: "#6366F1",
        pontoFundo: "#ffffff"
    };

    let statusCount = { online:0, offline:0, manutencao:0 };

    onibus.forEach(o => {
        let s = (o.status || "").toLowerCase().trim();
        if (["online","ativo","funcionando","operante","em_operacao"].includes(s)) statusCount.online++;
        else if (["offline","parado","inativo"].includes(s)) statusCount.offline++;
        else if (["manutencao","manutenção","em_manutencao"].includes(s)) statusCount.manutencao++;
    });

    let dadosRosca = [statusCount.online, statusCount.offline, statusCount.manutencao];

    chartOnibus = new Chart(document.getElementById("graficoOnibus"), {
        type: "doughnut",
        data: {
            labels: ["Online", "Offline", "Manutenção"],
            datasets: [{
                data: dadosRosca,
                backgroundColor: [colors.online, colors.offline, colors.manutencao],
                hoverBackgroundColor: ["#22C55E", "#CBD5E1", "#F59E0B"],
                borderWidth: 0,
                cutout: '70%'
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true, // Garante que exibe
                    position: 'bottom',
                    labels: { usePointStyle: true, boxWidth: 8, padding: 20, color: "#455774ff"}
                }
            }
        }
    });
    let ativo = sensores.filter(s => s.status === "ativo").length;
    let inativo = sensores.length - ativo;

    chartSensores = new Chart(document.getElementById("graficoSensores"), {
        type: "bar",
        data: {
            labels: ["Ativos", "Inativos"], 
            datasets: [{
                label: "Quantidade de Sensores", 
                data: [ativo, inativo],
                backgroundColor: [colors.ativo, colors.inativo],
                borderRadius: 6,
                barThickness: 40
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { display: true, borderDash: [4, 4] } },
                x: { grid: { display: false } }
            },
            plugins: { 
                legend: { 
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, boxWidth: 8, padding: 20, color: "#455774ff"}
                } 
            }
        }
    });

    // ----------------------------------------------------
    // GRÁFICO 3: Atrasos (Linha)
    // ----------------------------------------------------
    let labelsAtraso = [];
    let dadosAtraso = [];

    let displayOnibus = onibus.slice(0, 15);

    displayOnibus.forEach((o, i) => {
        if (o.hora_prevista && o.hora_real) {
            let diff = (new Date(o.hora_real) - new Date(o.hora_prevista)) / 60000;
            labelsAtraso.push(`Bus ${o.name || o.onibus_id || i+1}`);
            dadosAtraso.push(diff);
        }
    });

    const ctxAtraso = document.getElementById("graficoAtraso").getContext("2d");
    const gradient = ctxAtraso.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, "rgba(99, 102, 241, 0.35)");
    gradient.addColorStop(1, "rgba(99, 102, 241, 0.0)");

    chartAtraso = new Chart(ctxAtraso, {
        type: "line",
        data: {
            labels: labelsAtraso,
            datasets: [{
                label: "Atraso (min)", // O texto que aparecerá na legenda
                data: dadosAtraso,
                borderColor: colors.linha,
                backgroundColor: gradient,
                borderWidth: 3,
                tension: 0.45,
                pointBackgroundColor: colors.pontoFundo,
                pointBorderColor: colors.pontoBorda,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true
            }]
        },
        options: {
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            scales: {
                y: { grid: { borderDash: [4, 4] } },
                x: { grid: { display: false } }
            },
            plugins: {
                // AQUI FOI ALTERADO: Configuração da legenda adicionada
                legend: { 
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, boxWidth: 8, padding: 20, color: "#455774ff"}
                },
                tooltip: {
                    backgroundColor: "#1E293B",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            }
        }
    });
}

carregarDados();

// dashboard.js

// --- LÓGICA DO MENU CONFIGURAÇÕES ---
function toggleConfig(event) {
    event.preventDefault(); // Evita que o link recarregue a página ou suba pro topo
    
    const btn = document.getElementById('btnConfig');
    const submenu = document.getElementById('submenuConfig');
    
    // Alterna as classes
    submenu.classList.toggle('open');
    btn.classList.toggle('config-active');
}

// --- LÓGICA DO LOGOUT ---
function confirmarLogout() {
    // Popup nativo do navegador (Simples e funcional)
    const confirmacao = confirm("Tem certeza que deseja sair do sistema?");
    
    if (confirmacao) {
        // Redireciona para a rota de logout do Python
        window.location.href = "/logout";
    }
}

// --- LÓGICA DO TEMA ESCURO (DARK MODE) ---
const toggleSwitch = document.getElementById('darkModeToggle');

// 1. Verifica se o usuário já tinha preferência salva
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    toggleSwitch.checked = true;
}

// 2. Escuta o clique no switch
toggleSwitch.addEventListener('change', () => {
    if (toggleSwitch.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark'); // Salva na memória do navegador
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }
});

async function uploadAvatar() {
    const fileInput = document.getElementById('avatarInput');
    const file = fileInput.files[0];

    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const profileImg = document.getElementById('profileImage');
        const originalSrc = profileImg.src;

        const response = await fetch('/avatar', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.ok) {
            profileImg.src = data.filename;
        } else {
            profileImg.src = originalSrc;
        }
    } catch (e) {
        console.error(e);
    }

    fileInput.value = '';
}
