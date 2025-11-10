const onibusId = window.location.pathname.split("/").pop();
let rotaNormal = true;
let mapa;
let lightTiles, darkTiles;

fetch(`/api/onibus/${onibusId}`)
  .then(res => res.json())
  .then(data => {
    if (!data.onibus) {
      document.body.innerHTML = "<h2>Ônibus não encontrado</h2>";
      return;
    }

    const onibus = data.onibus;
    const linha = data.linha;

    document.getElementById("busName").textContent = `Ônibus ${linha.numero_linha || onibus.linha_id || "--"}`;
    document.getElementById("linhaNumero").textContent = linha.numero_linha || "--";
    document.getElementById("linhaNome").textContent = linha.nome || "Linha desconhecida";

    carregarLinha(linha);
  })
  .catch(err => {
    console.error("Erro ao buscar dados do ônibus:", err);
    document.body.innerHTML = "<h2>Erro ao carregar informações do ônibus</h2>";
  });

function carregarLinha(linha) {
  if (!linha || !linha.numero_linha) return;

  fetch(`/api/paradas_linha/${linha.numero_linha}`)
    .then(res => res.json())
    .then(paradas => {
      if (!paradas || !paradas.length) {
        document.getElementById("stopsList").innerHTML = "<p>Nenhuma parada encontrada.</p>";
        return;
      }

      const paradasOrdenadas = rotaNormal ? paradas : [...paradas].reverse();
      carregarParadas(paradasOrdenadas);
      initMap(paradasOrdenadas, document.getElementById("stopsList"));
    })
    .catch(err => console.error("Erro ao carregar paradas:", err));
}

function carregarParadas(paradas) {
  const lista = document.getElementById("stopsList");
  lista.innerHTML = "";

  const paradasFiltradas = rotaNormal ? paradas : [...paradas].reverse();

  paradas.forEach((parada, index) => {
    const item = document.createElement("div");
    item.className = "stop-item";
    item.dataset.index = index;

    let lat, lon;
    if (parada.localizacao?.coordinates) {
      [lon, lat] = parada.localizacao.coordinates;

      item.dataset.lat = lat;
      item.dataset.lon = lon;
    }

    item.innerHTML = `
      <div class="stop-line"></div>
      <div class="stop-dot"></div>
      <div class="stop-content">
        <div class="stop-header">
          <span class="stop-title">${parada.nome_formatado || "Parada"}</span>
          <span class="stop-time">${
            parada.horario_prox ? `⏱️ ${parada.horario_prox}` : ""
          }</span>
        </div>
        <div class="stop-details">
          <p><strong>Horários:</strong></p>
          <ul>
            ${(parada.horarios || ["--:--"])
              .map((h) => `<li>${h}</li>`)
              .join("")}
          </ul>
        </div>
      </div>
    `;

    item.addEventListener("click", () => {
      const isCurrentlyOpen = item.classList.contains("open");

      const openItems = lista.querySelectorAll(".stop-item.open");
      openItems.forEach((openItem) => openItem.classList.remove("open"));

      const clickedLat = item.dataset.lat;
      const clickedLon = item.dataset.lon;

      if (!isCurrentlyOpen && mapa && clickedLat && clickedLon) {
        mapa.setView([clickedLat, clickedLon], 16);
      } else if (isCurrentlyOpen && mapa) {
      }

      if (!isCurrentlyOpen) {
        item.classList.add("open");
      }
    });

    lista.appendChild(item);
  });
}

// ====================
// Alternância de tema (modo claro/escuro)
// ====================
const themeToggle = document.querySelector('.theme-toggle-map');
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
  icon.classList.add('spin');
  document.body.classList.toggle('dark-mode');
  const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem('theme', newTheme);

  // alterna tiles
  if (mapa) {
    if (newTheme === 'dark') {
      mapa.removeLayer(lightTiles);
      darkTiles.addTo(mapa);
    } else {
      mapa.removeLayer(darkTiles);
      lightTiles.addTo(mapa);
    }
  }
  
  setTimeout(() => {
    themeToggle.innerHTML = isMoon ? sunIcon : moonIcon;
    isMoon = !isMoon;
    const newIcon = themeToggle.querySelector('.icon');
    newIcon.classList.add('spin-reverse');
  }, 350);

  setTimeout(() => {
    themeToggle.querySelectorAll('.icon').forEach(i => {
      i.classList.remove('spin', 'spin-reverse');
    });
  }, 900);
});


async function initMap(paradas, lista) {
  const MAPTILER_KEY = "WY3jUNR2NAoodGvJ7vnY";

  // Inicializa o mapa apenas uma vez
  if (!mapa) {
    mapa = L.map("map", {
      attributionControl: false, // remove o "Leaflet"
      zoomControl: false // remove o controle padrão
    }).setView([-8.05, -34.9], 13);

    // adiciona o controle de zoom no canto inferior direito
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapa);

    // Cria layers apenas uma vez
    if (!lightTiles || !darkTiles) {
      lightTiles = L.tileLayer(
        `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
        { tileSize: 512, zoomOffset: -1 }
      );

      darkTiles = L.tileLayer(
        `https://api.maptiler.com/maps/topo-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
        { tileSize: 512, zoomOffset: -1 }
      );
    }

    // Função para alternar tema
    function setTheme(theme) {
      if (mapa.hasLayer(lightTiles)) mapa.removeLayer(lightTiles);
      if (mapa.hasLayer(darkTiles)) mapa.removeLayer(darkTiles);

      if (theme === "dark") darkTiles.addTo(mapa);
      else lightTiles.addTo(mapa);

      localStorage.setItem("theme", theme);
    }

    // Inicializa tema salvo
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    // Botão de troca de tema
    document.getElementById("toggleTheme")?.addEventListener("click", () => {
      setTheme(mapa.hasLayer(lightTiles) ? "dark" : "light");
    });

    // Adiciona créditos manualmente
    L.control.attribution({ prefix: false }).addTo(mapa);
    mapa.attributionControl.addAttribution("© OpenStreetMap | © MapTiler");
  }

  // Remove marcadores e rota anteriores
  if (window.marcadoresGroup) mapa.removeLayer(window.marcadoresGroup);
  if (window.rotaLayer) mapa.removeLayer(window.rotaLayer);


 const iconImage = L.icon({
  iconUrl: '/static/images/parada-onibus.png', // Caminho do PNG
  iconSize: [30, 30],  // Tamanho do ícone
  iconAnchor: [15, 15],  // Ancoragem do ícone (ponto onde o marcador será posicionado)
  popupAnchor: [0, -15]  // Posição do pop-up
});

  // Adiciona marcadores das paradas
const marcadores = [];
paradas.forEach((p, index) => { // Adiciona index no loop
  if (p.localizacao?.coordinates) {
    const [lon, lat] = p.localizacao.coordinates;
    const marker = L.marker([lat, lon], { icon: iconImage })
      .bindPopup(`<strong>${p.name}</strong>`);

    // Evento de clique no marcador
      marker.on('click', () => {
      // Abre a sidebar se estiver fechada
      const sidebar = document.querySelector(".sidebar");
      const openBtn = document.getElementById("openSidebarBtn");
      const container = document.querySelector(".container");

      if (sidebar.classList.contains("hidden")) {
        openBtn.classList.remove("visible");
        sidebar.classList.remove("hidden");
        container.classList.add("sidebar-open");
        container.classList.remove("sidebar-hidden");

        setTimeout(() => {
          if (mapa) mapa.invalidateSize();
        }, 350);
      }

      // Centraliza o mapa e abre o item correspondente
      mapa.setView([lat, lon], 16);

      const openItems = lista.querySelectorAll(".stop-item.open");
      openItems.forEach(openItem => openItem.classList.remove("open"));

      const item = lista.querySelector(`.stop-item[data-index="${index}"]`);
      if (item) {
        item.classList.add('open');
        item.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });


      marcadores.push(marker);
    }
  });
  if (marcadores.length) {
    window.marcadoresGroup = L.featureGroup(marcadores).addTo(mapa);
  }

  // Desenha rota
  try {
    const linhaId = document.getElementById("linhaNumero").textContent.trim();
    const resp = await fetch(`/api/linha/L${linhaId}`);
    const data = await resp.json();
    const shape = data.linha?.shape || data.shape;

    if (!shape?.coordinates?.length) return console.warn("Nenhum shape encontrado", linhaId);

    const coords = shape.coordinates.map((c) => [c[1], c[0]]);
    const metade = Math.floor(coords.length / 2);
    const coordsIda = coords.slice(0, metade);
    const coordsVolta = coords.slice(metade);

    const estiloAtivo = { weight: 10, opacity: 0.95 };
    const estiloInativo = { weight: 8, opacity: 0.45 };

    if (!mapa.getPane("shadowPane")) {
      mapa.createPane("shadowPane");
      const pane = mapa.getPane("shadowPane");
      pane.style.zIndex = 350;
      pane.style.pointerEvents = "none";
    }

    const makeShadow = (latlngs, weight) => L.polyline(latlngs, {
      color: "#7d7d7dff",
      weight: Math.max(2, weight + 7),
      opacity: 0.13,
      lineCap: "round",
      lineJoin: "round",
      pane: "shadowPane",
      interactive: false
    });

    const sombraIda = makeShadow(coordsIda, estiloAtivo.weight);
    const sombraVolta = makeShadow(coordsVolta, estiloInativo.weight);

    const idaLayer = L.polyline(coordsIda, {
      color: "#0066ff",
      weight: estiloAtivo.weight,
      opacity: estiloAtivo.opacity,
      lineJoin: "round",
      lineCap: "round",
      smoothFactor: 2,
      pane: "overlayPane"
    });

    const voltaLayer = L.polyline(coordsVolta, {
      color: "#0066ff",
      weight: estiloInativo.weight,
      opacity: estiloInativo.opacity,
      lineJoin: "round",
      lineCap: "round",
      smoothFactor: 2,
      pane: "overlayPane"
    });

    window.rotaLayer = L.layerGroup([sombraIda, sombraVolta, idaLayer, voltaLayer]).addTo(mapa);
    mapa.fitBounds(L.latLngBounds(coords));

    const ativarIda = () => {
      rotaNormal = true;
      document.getElementById("sentidoAtual").textContent = "Ida";

      idaLayer.setStyle(estiloAtivo);
      voltaLayer.setStyle(estiloInativo);
      sombraIda.setStyle({ opacity: 0.25 });
      sombraVolta.setStyle({ opacity: 0.05 });

      document.getElementById("direcaoLegenda").classList.remove("volta-ativa");

      fetch(`/api/paradas_linha/${linhaId}`)
        .then(res => res.json())
        .then(paradas => carregarParadas(paradas));
    };

    const ativarVolta = () => {
      rotaNormal = false;
      document.getElementById("sentidoAtual").textContent = "Volta";

      voltaLayer.setStyle(estiloAtivo);
      idaLayer.setStyle(estiloInativo);
      sombraVolta.setStyle({ opacity: 0.25 });
      sombraIda.setStyle({ opacity: 0.05 });

      document.getElementById("direcaoLegenda").classList.add("volta-ativa");

      fetch(`/api/paradas_linha/${linhaId}`)
        .then(res => res.json())
        .then(paradas => carregarParadas([...paradas].reverse()));
    };

    idaLayer.on("click", ativarIda);
    voltaLayer.on("click", ativarVolta);

    document.getElementById("toggleDirection")?.addEventListener("click", () => {
      rotaNormal ? ativarVolta() : ativarIda();
    });

    ativarIda();
  } catch (err) {
    console.error("Erro ao desenhar rota da linha:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const sidebar = document.querySelector(".sidebar");
  const openBtn = document.getElementById("openSidebarBtn");
  const closeBtn = document.getElementById("closeSidebarBtn");

  // Fecha a sidebar
  closeBtn.addEventListener("click", () => {
    sidebar.classList.add("hidden");
    container.classList.remove("sidebar-open");
    container.classList.add("sidebar-hidden");

    setTimeout(() => openBtn.classList.add("visible"), 300);

    // Atualiza tamanho do mapa (Leaflet precisa disso!)
    setTimeout(() => {
      if (mapa) mapa.invalidateSize();
    }, 350);
  });

  // Abre a sidebar
  openBtn.addEventListener("click", () => {
    openBtn.classList.remove("visible");
    sidebar.classList.remove("hidden");
    container.classList.add("sidebar-open");
    container.classList.remove("sidebar-hidden");

    setTimeout(() => {
      if (mapa) mapa.invalidateSize();
    }, 350);
  });
});