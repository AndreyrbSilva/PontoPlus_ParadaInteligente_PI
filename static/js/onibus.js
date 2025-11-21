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

      // Fecha todos os itens abertos
      const openItems = lista.querySelectorAll(".stop-item.open");
      openItems.forEach((openItem) => openItem.classList.remove("open"));

      const clickedLat = item.dataset.lat;
      const clickedLon = item.dataset.lon;

      // Centraliza o mapa na parada clicada
      if (!isCurrentlyOpen && mapa && clickedLat && clickedLon) {
        centralizarComOffset(clickedLat, clickedLon);

        // Cria o efeito ripple duplo
        criarRipple([clickedLat, clickedLon], mapa, 2);  // primeiro ripple
        setTimeout(() => {
          criarRipple([clickedLat, clickedLon], mapa, 2);  // segundo ripple
        }, 900); // tempo entre os dois ripples

        // Espera a animação de centralização terminar para abrir o pop-up
        mapa.once('moveend', () => {
          const marker = window.marcadores[index];  // Obtém o marcador correspondente à parada
          if (marker) {
            marker.openPopup(); // Abre o pop-up do marcador após a centralização
          }
        });
      } else if (isCurrentlyOpen && mapa) {
        const marker = window.marcadores[index];
        if (marker) {
          marker.openPopup(); // Abre o pop-up da parada
        }
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

function irParaParada(lat, lon, index, lista) {
  const sidebar = document.querySelector(".sidebar");
  const container = document.querySelector(".container");
  const openBtn = document.getElementById("openSidebarBtn");

  const abrirSidebar = () => {
    return new Promise(resolve => {
      if (sidebar.classList.contains("hidden")) {
        openBtn.classList.remove("visible");
        sidebar.classList.remove("hidden");
        container.classList.add("sidebar-open");
        container.classList.remove("sidebar-hidden");

        // Espera animação terminar
        setTimeout(() => {
          mapa.invalidateSize();
          resolve();
        }, 350);
      } else {
        resolve();
      }
    });
  };

  abrirSidebar().then(() => {
    // Atualiza o mapa após abrir a sidebar
    mapa.once("moveend", () => {
      criarRipple([lat, lon], mapa, 2); // Adiciona ripple na parada
      setTimeout(() => criarRipple([lat, lon], mapa, 2), 900);
    });

    // Move o mapa para a localização da parada
    mapa.setView([lat, lon], 16, { animate: true });

    // Abre a parada correspondente na sidebar
    const abertas = lista.querySelectorAll(".stop-item.open");
    abertas.forEach(item => item.classList.remove("open"));

    const item = lista.querySelector(`.stop-item[data-index="${index}"]`);
    if (item) {
      item.classList.add("open");
      item.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

function atualizarMarcadores(paradas) {
  if (!mapa) return;
  if (window.marcadoresGroup) {
    mapa.removeLayer(window.marcadoresGroup);
  }

  const iconImage = L.icon({
    iconUrl: '/static/images/parada-onibus.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  window.marcadores = paradas.map((p, index) => {
    if (!p.localizacao?.coordinates) return null;
    const [lon, lat] = p.localizacao.coordinates;

    const marker = L.marker([lat, lon], { icon: iconImage })
      .bindPopup(criarConteudoPopup(p));

    marker.on("click", () => {
      // 1. Centralizar o mapa na parada
      centralizarComOffset(lat, lon);

      // 2. Criar ripple na parada
      criarRipple([lat, lon], mapa, 2);
      setTimeout(() => {
        criarRipple([lat, lon], mapa, 2);
      }, 900);

      // 3. Verificar se a sidebar está oculta (minimizada)
      const sidebar = document.querySelector(".sidebar");
      const container = document.querySelector(".container");

      // Se a sidebar estiver oculta, abre com animação
      if (sidebar.classList.contains("hidden")) {
        const openBtn = document.getElementById("openSidebarBtn");

        // Função para abrir a sidebar com animação
        const abrirSidebar = () => {
          return new Promise(resolve => {
            openBtn.classList.remove("visible");
            sidebar.classList.remove("hidden");
            container.classList.add("sidebar-open");
            container.classList.remove("sidebar-hidden");

            // Espera animação terminar
            setTimeout(() => {
              mapa.invalidateSize();
              resolve();
            }, 10); // Ajuste o tempo de animação, se necessário
          });
        };

        // Abre a sidebar e depois exibe as informações da parada
        abrirSidebar().then(() => {
          // Mostrar informações da parada na sidebar
          const item = document.querySelector(`.stop-item[data-index="${index}"]`);
          if (item) {
            document.querySelectorAll(".stop-item.open")
              .forEach(it => it.classList.remove("open"));

            item.classList.add("open");
            item.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      } else {
        // Se a sidebar já estiver aberta, apenas mostra as informações da parada
        const item = document.querySelector(`.stop-item[data-index="${index}"]`);
        if (item) {
          document.querySelectorAll(".stop-item.open")
            .forEach(it => it.classList.remove("open"));

          item.classList.add("open");
          item.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });

    return marker;
  }).filter(Boolean);

  window.marcadoresGroup = L.featureGroup(marcadores).addTo(mapa);
}

async function initMap(paradas) {
  const MAPTILER_KEY = "WY3jUNR2NAoodGvJ7vnY";
  
  // Inicializa o mapa apenas uma vez
  if (!mapa) {
    const myRenderer = L.svg({ padding: 2.0 });

    mapa = L.map("map", {
      attributionControl: false, 
      zoomControl: false,
      renderer: myRenderer // Usa o renderizador otimizado
    }).setView([-8.05, -34.9], 13);
    
    mapa.on("click", e => criarRipple(e.latlng, mapa, 1));

    // ======================================================
// INÍCIO DA ADIÇÃO: Botão de Geolocalização e Marcador Pulsante
// ======================================================

// 1. CRIAÇÃO DO PANE (CAMADA) PARA O USUÁRIO
// Isso é CRUCIAL para que o ponto azul fique EM BAIXO dos ícones de ônibus.
// Marcadores normais usam zIndex 600. Usaremos 550 para ficar abaixo.
if (!mapa.getPane('userLocationPane')) {
  mapa.createPane('userLocationPane');
  mapa.getPane('userLocationPane').style.zIndex = 550;
}

// 2. INJETAR O BOTÃO HTML NO MAPA
const mapContainer = document.getElementById('map');
// Verifica se já não existe para não duplicar
if (!document.querySelector('.custom-map-controls')) {
  const customControls = document.createElement('div');
  customControls.className = 'custom-map-controls leaflet-bar'; // leaflet-bar adiciona estilo padrão
  // Ícone SVG de mira
  customControls.innerHTML = `
    <button class="locate-btn" title="Onde estou?">
       <svg class="locate-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>
    </button>
  `;
  mapContainer.appendChild(customControls);

  // 3. LÓGICA DE CLIQUE E GEOLOCALIZAÇÃO
  const btnLocate = customControls.querySelector('.locate-btn');
  let userMarker = null;

  btnLocate.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }

    btnLocate.style.opacity = '0.5';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        btnLocate.style.opacity = '1';
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        if (userMarker) {
          mapa.removeLayer(userMarker);
        }

        const userIcon = L.divIcon({
          className: 'user-location-marker-container',
          html: '<div class="user-pulse"></div><div class="user-dot"></div>',
          iconSize: [20, 20], 
          iconAnchor: [10, 10] 
        });

        userMarker = L.marker([lat, lon], {
          icon: userIcon,
          pane: 'userLocationPane', 
          interactive: false 
        }).addTo(mapa);

        centralizarComOffset(lat, lon);
      },
      (error) => {
        btnLocate.style.opacity = '1';
        let msg = "Erro ao obter localização.";
        if (error.code === 1) msg = "Precisamos da sua permissão para acessar a localização.";
        console.error("Erro Geo:", error);
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
    L.control.zoom({ position: 'bottomright' }).addTo(mapa);
    L.control.attribution({ prefix: false }).addTo(mapa);
    mapa.attributionControl.addAttribution("© OpenStreetMap | © MapTiler");

    if (!lightTiles || !darkTiles) {
      lightTiles = L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, { tileSize: 512, zoomOffset: -1 });
      darkTiles = L.tileLayer(`https://api.maptiler.com/maps/topo-v2-dark/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`, { tileSize: 512, zoomOffset: -1 });
    }
    
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") darkTiles.addTo(mapa);
    else lightTiles.addTo(mapa);

    // Botão de troca de tema
    document.getElementById("toggleTheme")?.addEventListener("click", () => {
      const newTheme = mapa.hasLayer(lightTiles) ? "dark" : "light";
      if (newTheme === "dark") { mapa.removeLayer(lightTiles); darkTiles.addTo(mapa); }
      else { mapa.removeLayer(darkTiles); lightTiles.addTo(mapa); }
      localStorage.setItem("theme", newTheme);
    });
  }

  // Remove camadas anteriores para não duplicar ao recarregar
  if (window.marcadoresGroup) mapa.removeLayer(window.marcadoresGroup);
  if (window.rotaLayer) mapa.removeLayer(window.rotaLayer);

  // 1. ADICIONAR MARCADORES
  const iconImage = L.icon({
    iconUrl: '/static/images/parada-onibus.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  const marcadores = [];
  paradas.forEach((p, index) => {
    if (p.localizacao?.coordinates) {
      const [lon, lat] = p.localizacao.coordinates;
      const marker = L.marker([lat, lon], { icon: iconImage })
        .bindPopup(criarConteudoPopup(p));

      marker.on("click", () => {
        centralizarComOffset(lat, lon);
        criarRipple([lat, lon], mapa, 2);
        const item = document.querySelector(`.stop-item[data-index="${index}"]`);
        if (item) {
          document.querySelectorAll(".stop-item.open").forEach(it => it.classList.remove("open"));
          item.classList.add("open");
          item.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      marcadores.push(marker);
    }
  });

  if (marcadores.length) {
    window.marcadoresGroup = L.featureGroup(marcadores).addTo(mapa);
  }

  // 2. CÁLCULO E DESENHO DA ROTA (IDA/VOLTA)
  try {
    const linhaId = document.getElementById("linhaNumero").textContent.trim();
    
    // Funções auxiliares de geometria
    const closestIndex = (target, coordsArr) => {
      let minDist = Infinity, minIndex = 0;
      for (let i = 0; i < coordsArr.length; i++) {
        const d = Math.hypot(coordsArr[i][0] - target[0], coordsArr[i][1] - target[1]);
        if (d < minDist) { minDist = d; minIndex = i; }
      }
      return minIndex;
    };

    const getSegment = (coordsArr, startIdx, endIdx) => {
      if (startIdx <= endIdx) return coordsArr.slice(startIdx, endIdx + 1);
      return coordsArr.slice(startIdx).concat(coordsArr.slice(0, endIdx + 1));
    };

    // Busca dados necessários
    const [respLinha, respIda, respVolta] = await Promise.all([
       fetch(`/api/linha/L${linhaId}`),
       fetch(`/api/paradas_linha/${linhaId}?sentido=ida`),
       fetch(`/api/paradas_linha/${linhaId}?sentido=volta`)
    ]);
    
    const dataLinha = await respLinha.json();
    const paradasIda = await respIda.json();
    const paradasVolta = await respVolta.json();

    const shape = dataLinha.linha?.shape || dataLinha.shape;
    if (!shape?.coordinates?.length) return;

    const coords = shape.coordinates.map((c) => [c[1], c[0]]);

    // Processa coordenadas das paradas
    const getCoords = (list) => (list || []).filter(p => p.localizacao?.coordinates).map(p => [p.localizacao.coordinates[1], p.localizacao.coordinates[0]]);
    const coordsIdaStops = getCoords(paradasIda);
    const coordsVoltaStops = getCoords(paradasVolta);

    // Fatia o shape
    let segmentIda = [], segmentVolta = [];
    
    if (coordsIdaStops.length >= 2) {
        const start = closestIndex(coordsIdaStops[0], coords);
        const end = closestIndex(coordsIdaStops[coordsIdaStops.length - 1], coords);
        segmentIda = getSegment(coords, start, end);
    } else { segmentIda = coords.slice(); } // Fallback

    if (coordsVoltaStops.length >= 2) {
        const start = closestIndex(coordsVoltaStops[0], coords);
        const end = closestIndex(coordsVoltaStops[coordsVoltaStops.length - 1], coords);
        segmentVolta = getSegment(coords, start, end);
    } else { segmentVolta = coords.slice(); } // Fallback

    // Configura Panes e Estilos
    if (!mapa.getPane("shadowPane")) {
      mapa.createPane("shadowPane");
      mapa.getPane("shadowPane").style.zIndex = 350;
      mapa.getPane("shadowPane").style.pointerEvents = "none";
    }

    // 1. DEFINIÇÃO DE CORES
    const COR_LIGHT = "#0066ff"; // Azul (Modo Claro)
    const COR_DARK = "#6bf5ffff";  // Amarelo Ouro (Modo Escuro)
    
    // Função que descobre qual cor usar agora
    const getCorAtual = () => document.body.classList.contains('dark-mode') ? COR_DARK : COR_LIGHT;

    const estiloAtivo = { weight: 10, opacity: 0.95, renderer: mapa.options.renderer };
    const estiloInativo = { weight: 8, opacity: 0.35, renderer: mapa.options.renderer };

    const makeShadow = (latlngs, w) => L.polyline(latlngs, {
        color: "#7d7d7dff", weight: Math.max(2, w + 7), opacity: 0.13,
        lineCap: "round", lineJoin: "round", pane: "shadowPane", interactive: false, renderer: mapa.options.renderer
    });

    const sombraIda = makeShadow(segmentIda, estiloAtivo.weight);
    const sombraVolta = makeShadow(segmentVolta, estiloInativo.weight);

    // 2. CRIA AS LINHAS JÁ COM A COR CERTA
    const idaLayer = L.polyline(segmentIda, { 
        ...estiloAtivo, 
        color: getCorAtual(), 
        smoothFactor: 2, 
        pane: "overlayPane" 
    });
    
    const voltaLayer = L.polyline(segmentVolta, { 
        ...estiloInativo, 
        color: getCorAtual(), 
        smoothFactor: 2, 
        pane: "overlayPane" 
    });

    window.rotaLayer = L.layerGroup([sombraIda, sombraVolta, idaLayer, voltaLayer]).addTo(mapa);
    
    const bounds = L.latLngBounds([...segmentIda, ...segmentVolta]);
    if(bounds.isValid()) mapa.fitBounds(bounds, { padding: [30, 30] });

    // Lógica de Ativação
    const ativarIda = () => {
        rotaNormal = true;
        document.getElementById("sentidoAtual").textContent = "Ida";
        
        const cor = getCorAtual();
        idaLayer.setStyle({ ...estiloAtivo, color: cor }).bringToFront();
        voltaLayer.setStyle({ ...estiloInativo, color: cor });
        
        sombraIda.setStyle({ opacity: 0.25 });
        sombraVolta.setStyle({ opacity: 0.05 });
        document.getElementById("direcaoLegenda").classList.remove("volta-ativa");
        
        carregarParadas(paradasIda);
        atualizarMarcadores(paradasIda);
    };

    const ativarVolta = () => {
        rotaNormal = false;
        document.getElementById("sentidoAtual").textContent = "Volta";
        
        const cor = getCorAtual();
        voltaLayer.setStyle({ ...estiloAtivo, color: cor }).bringToFront();
        idaLayer.setStyle({ ...estiloInativo, color: cor });
        
        sombraVolta.setStyle({ opacity: 0.25 });
        sombraIda.setStyle({ opacity: 0.05 });
        document.getElementById("direcaoLegenda").classList.add("volta-ativa");

        carregarParadas(paradasVolta);
        atualizarMarcadores(paradasVolta);
    };

    // Listeners de clique na linha
    idaLayer.on("click", ativarIda);
    voltaLayer.on("click", ativarVolta);

    // Listener do botão de inverter sentido (esse aqui podemos substituir pois é local)
    const btnToggle = document.getElementById("toggleDirection");
    if(btnToggle) {
        const newBtn = btnToggle.cloneNode(true);
        btnToggle.parentNode.replaceChild(newBtn, btnToggle);
        newBtn.addEventListener("click", () => rotaNormal ? ativarVolta() : ativarIda());
    }

    // 3. LISTENER DE TROCA DE TEMA (CORRIGIDO: AGORA NÃO QUEBRA O BOTÃO)
    // Apenas adicionamos o evento de clique ao botão existente
    const btnTema = document.querySelector('.theme-toggle-map');
    if (btnTema) {
        btnTema.addEventListener('click', () => {
            // Espera um pouquinho (50ms) para o CSS global mudar a classe do body
            setTimeout(() => {
                const corFinal = document.body.classList.contains('dark-mode') ? COR_DARK : COR_LIGHT;
                
                // Atualiza a cor base das linhas
                idaLayer.setStyle({ color: corFinal });
                voltaLayer.setStyle({ color: corFinal });

                // Reaplica o estilo ativo/inativo para garantir a opacidade correta
                if (rotaNormal) {
                    idaLayer.setStyle(estiloAtivo); 
                    voltaLayer.setStyle(estiloInativo);
                } else {
                    voltaLayer.setStyle(estiloAtivo);
                    idaLayer.setStyle(estiloInativo);
                }
            }, 50);
        });
    }

    // Inicializa
    ativarIda();

  } catch (err) {
    console.error("Erro ao desenhar rota:", err);
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

function criarRipple(latlng, mapa, tipo = 1) {
  const ripple = document.createElement("div");
  ripple.className = tipo === 2 ? "click-ripple-parada" : "click-ripple";

  // adiciona no overlayPane (sempre visível)
  const pane = mapa.getPanes().overlayPane;
  pane.appendChild(ripple);

  const atualizarPosicao = () => {
    const point = mapa.latLngToLayerPoint(latlng);
    ripple.style.left = point.x + "px";
    ripple.style.top = point.y + "px";
  };

  atualizarPosicao();
  mapa.on("move", atualizarPosicao);

  ripple.addEventListener("animationend", () => {
    ripple.remove();
    mapa.off("move", atualizarPosicao);
  });
}

function centralizarComOffset(lat, lon) {
  const sidebar = document.querySelector(".sidebar");
  const zoomLevel = 16;
  
  // 1. Verificação de Mobile/Tablet pequeno
  // Se a tela for menor que 768px (padrão mobile), a sidebar costuma cobrir tudo
  // ou ficar oculta. Nesses casos, centralizamos normal (sem offset).
  if (window.innerWidth <= 768) {
    mapa.setView([lat, lon], zoomLevel, { animate: true, duration: 0.6 });
    return;
  }

  // 2. Verificação se a Sidebar está aberta
  // Se a sidebar estiver oculta (tem a classe 'hidden'), não precisamos compensar nada.
  if (sidebar.classList.contains("hidden")) {
     mapa.setView([lat, lon], zoomLevel, { animate: true, duration: 0.6 });
     return;
  }

  // 3. Pega a largura REAL da sidebar neste exato momento
  // Isso faz funcionar em qualquer tamanho de tablet ou monitor!
  const sidebarWidth = sidebar.offsetWidth; 

  // 4. Matemática do Leaflet para mover o centro
  const point = mapa.project([lat, lon], zoomLevel);
  
  // Desloca metade da largura da sidebar para a esquerda
  const newPoint = point.subtract([sidebarWidth / 2, 0]);
  
  const newLatLng = mapa.unproject(newPoint, zoomLevel);

  mapa.setView(newLatLng, zoomLevel, { animate: true, duration: 0.6 });
}

function criarConteudoPopup(parada) {
  // Dados
  const numero = parada.name || "--";
  const nomeLocal = parada.nome_formatado || "Local desconhecido";
  
  // Lógica do tempo: Se tiver horário, mostra. Se não, "-- Minutos".
  const tempoTexto = parada.horario_prox 
    ? `Próximo: ${parada.horario_prox}` 
    : "Próximo: --";

  const referencia = parada.referencia || "";

  return `
    <div class="popup-card">
      <div class="popup-header">
        Parada: ${numero}
      </div>

      <div class="popup-subheader">
        ${nomeLocal}
      </div>

      <div class="popup-body">
        <div class="popup-time">${tempoTexto}</div>
        <div class="popup-ref">${referencia}</div>
      </div>
    </div>
  `;
}
