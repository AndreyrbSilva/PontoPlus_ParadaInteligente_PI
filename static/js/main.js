// ====================
// Relógio e dia da semana
// ====================
const dias = [
  "Domingo", "Segunda-Feira", "Terça-Feira",
  "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado"
];

function atualizarRelogio() {
  const now = new Date();
  document.getElementById("hours").textContent = now.getHours().toString().padStart(2, "0");
  document.getElementById("minutes").textContent = now.getMinutes().toString().padStart(2, "0");
  document.getElementById("dayName").textContent = dias[now.getDay()];
}

atualizarRelogio();
setInterval(atualizarRelogio, 1000);

// ====================
// Alternância de tema (modo claro/escuro)
// ====================
const themeToggle = document.querySelector('.theme-toggle');
let isMoon = true;

const sunIcon = `<svg class="icon sun fade-in" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M58.57,25.81c-2.13-3.67-0.87-8.38,2.8-10.51s8.38-0.88,10.51,2.8l9.88,17.1c2.13,3.67.87,8.38-2.8,10.51s-8.38.88-10.51-2.8l-9.88-17.1zM120,51.17c19.01,0,36.21,7.7,48.67,20.16S188.83,101,188.83,120s-7.7,36.21-20.16,48.67S139.01,188.83,120,188.83s-36.21-7.7-48.67-20.16S51.17,139.01,51.17,120s7.7-36.21,20.16-48.67S101,51.17,120,51.17zM158.27,81.73c-9.79-9.79-23.32-15.85-38.27-15.85s-28.48,6.06-38.27,15.85S65.88,105.05,65.88,120s6.06,28.48,15.85,38.27S105.05,174.12,120,174.12s28.48-6.06,38.27-15.85S174.12,134.95,174.12,120s-6.06-28.48-15.85-38.27zM113.88,7.71a7.71,7.71,0,1,1,15.42,0v19.75a7.71,7.71,0,1,1-15.42,0V7.71zM170.87,19.72a7.71,7.71,0,0,1,13.31,7.65l-9.88,17.1a7.71,7.71,0,0,1-13.31-7.65l9.88-17.1zM214.19,58.57a7.71,7.71,0,1,1,7.71,13.31l-17.1,9.88a7.71,7.71,0,0,1-7.71-13.31l17.1-9.88zM232.29,113.88a7.71,7.71,0,1,1,0,15.42h-19.75a7.71,7.71,0,1,1,0-15.42h19.75zM220.28,170.87a7.71,7.71,0,0,1-7.65,13.31l-17.1-9.88a7.71,7.71,0,0,1,7.65-13.31l17.1,9.88zM181.43,214.19a7.71,7.71,0,1,1-13.31,7.65l-9.88-17.1a7.71,7.71,0,1,1,13.31-7.65l9.88,17.1zM126.12,232.29a7.71,7.71,0,1,1-15.42,0v-19.75a7.71,7.71,0,1,1,15.42,0v19.75zM69.13,220.28a7.71,7.71,0,1,1-13.31-7.65l9.88-17.1a7.71,7.71,0,1,1,13.31,7.65l-9.88,17.1zM25.81,181.43a7.71,7.71,0,1,1-7.71-13.31l17.1-9.88a7.71,7.71,0,1,1,7.71,13.31l-17.1,9.88zM7.71,126.12a7.71,7.71,0,1,1,0-15.42h19.75a7.71,7.71,0,1,1,0,15.42H7.71zM19.72,69.13a7.71,7.71,0,0,1,7.65-13.31l17.1,9.88a7.71,7.71,0,1,1-7.65,13.31l-17.1-9.88z"/></svg>`;
const moonIcon = `<svg class="icon moon fade-in" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M13.589 21.659c-3.873 1.038-8.517-.545-10.98-3.632a1 1 0 0 1 .751-1.623c3.984-.118 6.662-1.485 8.17-4.098 1.51-2.613 1.354-5.616-.535-9.125a1 1 0 0 1 1.03-1.463c3.904.59 7.597 3.82 8.635 7.694 1.43 5.334-1.737 10.818-7.071 12.247z"/></svg>`;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.innerHTML = sunIcon;
  isMoon = false;
} else {
  themeToggle.innerHTML = moonIcon;
}

themeToggle.addEventListener('click', () => {
  const icon = themeToggle.querySelector('.icon');
  
  // Começa rotação do ícone imediatamente
  icon.classList.add('spin');

  // 🔹 Alterna o tema logo de cara
  document.body.classList.toggle('dark-mode');
  const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem('theme', newTheme);

  // 🔹 Troca o ícone no meio da rotação pra ficar fluido
  setTimeout(() => {
    themeToggle.innerHTML = isMoon ? sunIcon : moonIcon;
    isMoon = !isMoon;
    const newIcon = themeToggle.querySelector('.icon');
    newIcon.classList.add('spin-reverse');
  }, 350);

  // 🔹 Limpa classes no final
  setTimeout(() => {
    themeToggle.querySelectorAll('.icon').forEach(i => {
      i.classList.remove('spin', 'spin-reverse');
    });
  }, 900);
});

function getStatusClass(tempo) {
  if (tempo <= 4) return "status-verde";
  if (tempo <= 6) return "status-amarelo";
  return "status-cinza";
}

// ====================
// 🔄 Atualização dinâmica dos ônibus com ETA inteligente + Busca integrada
// ====================
let busState = {};
let allBuses = []; // guarda todos os ônibus carregados da API

const busList = document.getElementById("busList");
const searchForm = document.querySelector('.search-bar'); // seu form
const searchInput = searchForm.querySelector('input[name="busLine"]');

async function carregarOnibus(inicial = false) {
  try {
    const res = await fetch("/api/onibus");
    const onibusList = await res.json();
    allBuses = onibusList;

    // ✅ Renderiza imediatamente os ônibus SEM esperar os ETA’s
    if (inicial) filterAndRenderBuses("");

    // Depois busca ETA’s de forma assíncrona (sem travar o render)
    const etaPromises = onibusList.map(bus =>
      fetch(`/api/eta/${bus.onibus_id}`).then(res => res.json()).catch(() => null)
    );

    const etaResults = await Promise.all(etaPromises);

    onibusList.forEach((bus, index) => {
      const etaData = etaResults[index];
      const tempoMin = parseInt(etaData?.tempo_estimado) || Math.floor(Math.random() * 10) + 2;

      if (busState[bus.onibus_id]) {
        const atual = busState[bus.onibus_id].tempo;
        if (tempoMin < atual) busState[bus.onibus_id].tempo = tempoMin;
      } else {
        busState[bus.onibus_id] = {
          tempo: tempoMin,
          proximos: [tempoMin + 5, tempoMin + 10, tempoMin + 15],
          dados: bus
        };
      }
    });

    // 🔄 Atualiza a renderização depois que os ETA’s chegam
    filterAndRenderBuses("");

  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    if (inicial) busList.innerHTML = "<p>Erro ao carregar os dados.</p>";
  }
}

document.querySelectorAll(".bus-card").forEach(card => {
  card.addEventListener("mouseenter", () => {
    const id = card.dataset.id; // supondo que cada card tenha data-id="301"
    if (!id) return;

    // evita prefetch duplicado
    if (document.querySelector(`link[data-prefetched="${id}"]`)) return;

    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/onibus/${id}`;
    link.dataset.prefetched = id;
    document.head.appendChild(link);
  });
});

function renderBusCard(bus, tempoMin) {
  const features = bus.features || {};
  const icons = [];

  if (features.ar_condicionado) icons.push('<i class="fa-solid fa-snowflake"></i>');
  if (features.acessibilidade) icons.push('<i class="fa-solid fa-wheelchair"></i>');
  if (features.wifi) icons.push('<i class="fa-solid fa-wifi"></i>');

  const proximos = [tempoMin + 5, tempoMin + 10, tempoMin + 15];

  const busIcon = `
    <svg fill="currentColor" width="24" height="24" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.4375 0 3 2.167969 3 8L3 41C3 42.359375 3.398438 43.339844 4 44.0625L4 47C4 48.652344 5.347656 50 7 50L11 50C12.652344 50 14 48.652344 14 47L14 46L36 46L36 47C36 48.652344 37.347656 50 39 50L43 50C44.652344 50 46 48.652344 46 47L46 44.0625C46.601563 43.339844 47 42.359375 47 41L47 9C47 4.644531 46.460938 0 40 0 Z M 15 4L36 4C36.554688 4 37 4.449219 37 5L37 7C37 7.550781 36.554688 8 36 8L15 8C14.449219 8 14 7.550781 14 7L14 5C14 4.449219 14.449219 4 15 4 Z M 11 11L39 11C41 11 42 12 42 14L42 26C42 28 40.046875 28.9375 39 28.9375L11 29C9 29 8 28 8 26L8 14C8 12 9 11 11 11 Z M 2 12C0.898438 12 0 12.898438 0 14L0 22C0 23.101563 0.898438 24 2 24 Z M 48 12L48 24C49.105469 24 50 23.101563 50 22L50 14C50 12.898438 49.105469 12 48 12 Z M 11.5 34C13.433594 34 15 35.566406 15 37.5C15 39.433594 13.433594 41 11.5 41C9.566406 41 8 39.433594 8 37.5C8 35.566406 9.566406 34 11.5 34 Z M 38.5 34C40.433594 34 42 35.566406 42 37.5C42 39.433594 40.433594 41 38.5 41C36.566406 41 35 39.433594 35 37.5C35 35.566406 36.566406 34 38.5 34Z"/>
    </svg>
  `;

  const statusClass = getStatusClass(tempoMin);

  const card = document.createElement("div");
  card.className = "bus-card fade-in-up";
  card.id = bus.onibus_id;
  card.innerHTML = `
    <div class="bus-top">
      <span class="status-badge ${statusClass}" id="status-${bus.onibus_id}">
        <svg class="status-dot" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="8"></circle>
        </svg>
        ${tempoMin <= 1 ? "AGORA" : `${tempoMin} MIN`}
      </span>
      <div class="icon-container">${icons.join(" ")}</div>
    </div>

    <div class="bus-info">
      <span class="line-number">
        ${busIcon}
        ${bus.linha_id}
      </span>
      <span class="line-name">— ${bus.linha_nome}</span>
    </div>

    <div class="bus-price">
      <i class="fa-solid fa-ticket"></i>  
      R$ ${bus.tarifa ?? "4,30"}
    </div>
    
    <div class="bus-times" id="prox-${bus.onibus_id}">
      <span>PRÓXIMOS:</span>
      ${proximos.map((t) => `<button>${t} Min</button>`).join(" ")}
    </div>
  `;

  // ✅ Redireciona ao clicar no card
  card.addEventListener("click", () => {
    window.location.href = `/onibus/${bus.onibus_id}`;
  });

  return card;
}

function atualizarCard(id) {
  const bus = busState[id];
  if (!bus) return;

  const tempo = bus.tempo;
  const badge = document.getElementById(`status-${id}`);
  const proximosDiv = document.getElementById(`prox-${id}`);
  if (!badge || !proximosDiv) return;

  const statusClass = getStatusClass(tempo);
  badge.className = `status-badge ${statusClass}`;
  badge.innerHTML = `
    <svg class="status-dot" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="8"></circle>
    </svg>
    ${tempo <= 1 ? "AGORA" : `${tempo} MIN`}
  `;

  const proximos = bus.proximos;
  proximosDiv.innerHTML = `
    <span>PRÓXIMOS:</span>
    ${proximos.map((t) => `<button>${t} Min</button>`).join(" ")}
  `;
}

function normalizeText(str) {
  return str
    .normalize("NFD") // separa acentos das letras
    .replace(/[\u0300-\u036f]/g, "") // remove os acentos
    .toLowerCase()
    .trim();
}

function filterAndRenderBuses(term) {
  busList.innerHTML = "";

  const normalizedTerm = normalizeText(term);

  const filtered = allBuses
    .filter(bus => {
      const nome = normalizeText(bus.linha_nome);
      const numero = normalizeText(bus.linha_id.toString());

      return nome.includes(normalizedTerm) || numero.includes(normalizedTerm);
    })
    .map(bus => {
      const estado = busState[bus.onibus_id];
      const tempoMin = estado ? estado.tempo : Math.floor(Math.random() * 10) + 2;
      return { bus, tempoMin };
    })
    .sort((a, b) => a.tempoMin - b.tempoMin);

  if (filtered.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "Nenhuma linha encontrada.";
    msg.classList.add("no-results", "fade-in-up");
    busList.appendChild(msg);
    return;
  }

  filtered.forEach((item, index) => {
    const card = renderBusCard(item.bus, item.tempoMin);
    card.style.animationDelay = `${index * 100}ms`;
    busList.appendChild(card);
  });
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault(); 
  const term = searchInput.value.trim();
  filterAndRenderBuses(term);
});

function reordenarCards() {
  const cards = Array.from(busList.children);

  cards.sort((a, b) => {
    const tempoA = busState[a.id]?.tempo || 999;
    const tempoB = busState[b.id]?.tempo || 999;
    return tempoA - tempoB;
  });

  cards.forEach(card => busList.appendChild(card));
}

setInterval(() => {
  Object.keys(busState).forEach((id) => {
    const bus = busState[id];
    if (!bus) return;

    if (bus.tempo > 0) {
      bus.tempo--;
    } else {
      const proxs = bus.proximos;
      bus.tempo = proxs[0];
      proxs[0] = proxs[1];
      proxs[1] = proxs[2];
      proxs[2] = proxs[2] + Math.floor(Math.random() * 5) + 5;
    }
  });

  reordenarCards();
}, 60000);

setInterval(carregarOnibus, 30000);

document.addEventListener("DOMContentLoaded", async () => {
  await carregarOnibus(true);
  filterAndRenderBuses("");
});
