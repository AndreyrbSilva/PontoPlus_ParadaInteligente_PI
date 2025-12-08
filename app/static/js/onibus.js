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
const moonIcon = `<svg class="icon moon fade-in" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24px" height="24px" fill="currentColor">  <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>`;

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
    const COR_LIGHT = "#0066ff";
    const COR_DARK = "#6bf5ffff";
    
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
    // INICIAR A SIMULAÇÃO DE FROTA
    // Passamos os arrays de coordenadas (Ida e Volta) e as listas de paradas
    // Atenção: segmentIda/segmentVolta são arrays de [lat, lng]
    if (segmentIda.length > 0 && segmentVolta.length > 0) {
        console.log("Iniciando simulação de ônibus...");
        iniciarSimulacao(segmentIda, segmentVolta, paradasIda, paradasVolta);
    }
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

// === SIDEBAR ===
const sidebar = document.querySelector('.sidebar');
const openBtn = document.getElementById('openSidebarBtn');
const closeBtn = document.getElementById('closeSidebarBtn');

openBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
    document.body.classList.add('sidebar-open');
});

closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
    document.body.classList.remove('sidebar-open');
});

document.body.classList.add('sidebar-open');

// ==========================================
// CONFIGURAÇÕES DA SIMULAÇÃO
// ==========================================
const SIM_CONFIG = {
    qtdOnibus: 8,           // Total de veículos
    velocidadeMedia: 25,    // km/h (base para cálculo)
    tempoParada: 5000,      // Tempo parado no ponto (ms)
    intervaloAtualizacao: 16 // ~60fps
};

// ==========================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO (AJUSTADO)
// ==========================================
function formatarETA(segundos) {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos);

    // Lógica de Contagem Regressiva
    if (segundosRestantes <= 20) {
        // Abaixo de 20s: GATILHO DO "CHEGANDO"
        return { texto: "Chegando", classe: "status-chegando" };
        
    } else if (segundosRestantes < 60) {
        // Entre 21s e 59s: MOSTRA OS SEGUNDOS
        return { texto: `${segundosRestantes} s`, classe: "status-perto" };
        
    } else if (minutos <= 5) {
        // Acima de 1 min e abaixo de 5 min
        return { texto: `${minutos} min`, classe: "status-perto" };
        
    } else {
        // Normal
        return { texto: `${minutos} min`, classe: "status-normal" };
    }
}

// ==========================================
// CLASSE DO ÔNIBUS (COM PREVISÃO CÍCLICA)
// ==========================================
// ==========================================
// CLASSE DO ÔNIBUS (OTIMIZADA)
// ==========================================
class BusAgent {
    constructor(id, rotaInicial, rotaReversa, paradasIda, paradasVolta, map, startOffset = 0, sentidoInicial = 'ida') {
        this.id = id;
        this.map = map;
        
        this.rotaIda = rotaInicial;
        this.rotaVolta = rotaReversa;
        this.paradasIda = paradasIda;
        this.paradasVolta = paradasVolta;

        this.sentido = sentidoInicial;
        this.configurarRotas();
        
        // Posição inicial
        this.index = Math.floor(startOffset * (this.rotaAtual.length - 1)); 
        this.nextIndex = this.index + 1;
        this.progress = 0;

        // Física
        this.speed = (Math.random() * 10 + 35); // Velocidade base
        this.currentSpeed = this.speed;
        this.isStopped = false;

        // CONTROLE DE TEMPO PARA CÁLCULOS (NOVO)
        this.timeSinceLastPrediction = 0; 
        
        this.marker = null;
        this.criarMarcador();
    }

    configurarRotas() {
        if (this.sentido === 'ida') {
            this.rotaAtual = this.rotaIda;
            this.paradasAtuais = this.paradasIda;
            this.rotaProxima = this.rotaVolta;
            this.paradasProximas = this.paradasVolta;
        } else {
            this.rotaAtual = this.rotaVolta;
            this.paradasAtuais = this.paradasVolta;
            this.rotaProxima = this.rotaIda;
            this.paradasProximas = this.paradasIda;
        }
    }

    criarMarcador() {
        const corBus = this.sentido === 'ida' ? '#FF4500' : '#FF8C00';
        
        // Ícone SVG (o último que definimos)
        const svgSimple = `
        <svg class="bus-svg-icon" viewBox="0 -1.2 122.9 122.9" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#ffffff">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M110.8,103.6h-7.6V114c0,3.6-2.9,6.5-6.5,6.5h-9c-3.6,0-6.5-2.9-6.5-6.5v-10.3H41.5V114
            c0,3.6-2.9,6.5-6.5,6.5h-9c-3.6,0-6.5-2.9-6.5-6.5v-10.3H12v-82c0-7.6,4.4-13.1,13.3-16.5c17.6-6.9,54.6-6.9,72.3,0
            c8.9,3.4,13.3,8.9,13.3,16.5V103.6z M118.6,40.4h-3.8V62h3.8c2.4,0,4.3-1.9,4.3-4.3V44.7C122.9,42.3,121,40.4,118.6,40.4z
            M4.3,40.4h3.8V62H4.3C1.9,62,0,60.1,0,57.7V44.7C0,42.3,1.9,40.4,4.3,40.4z M46.4,8.6h30.1c0.9,0,1.6,0.7,1.6,1.6v5.2
            c0,0.9-0.7,1.6-1.6,1.6H46.4c-0.9,0-1.6-0.7-1.6-1.6v-5.2C44.8,9.3,45.5,8.6,46.4,8.6z M22.9,23.2h76.7c1,0,1.9,0.9,1.9,1.9v42.8
            c0,1-0.9,1.9-1.9,1.9H22.9c-1,0-1.9-0.9-1.9-1.9V25.1C21,24.1,21.8,23.2,22.9,23.2z M98.6,84.9c0-1.9-0.7-3.6-2-4.9
            c-1.3-1.3-3-2-4.9-2c-1.9,0-3.5,0.7-4.9,2c-1.4,1.3-2,3-2,4.9c0,1.9,0.7,3.5,2,4.8c1.4,1.3,3,2,4.9,2c1.9,0,3.6-0.7,4.9-2
            C98,88.4,98.6,86.8,98.6,84.9z M38.1,84.9c0-1.9-0.7-3.6-2-4.9c-1.3-1.3-3-2-4.9-2c-1.9,0-3.6,0.7-4.9,2c-1.3,1.3-2,3-2,4.9
            c0,1.9,0.6,3.5,2,4.8c1.3,1.3,3,2,4.9,2c2,0,3.6-0.7,4.9-2C37.4,88.4,38.1,86.8,38.1,84.9z"/>
        </svg>`;

        const busIcon = L.divIcon({
            className: 'bus-marker-container',
            html: `
                <div class="bus-rotating-wrapper" style="color: ${corBus};">
                    <div class="bus-pulse"></div>
                    <div class="bus-main-circle">
                        ${svgSimple}
                    </div>
                </div>
            `,
            iconSize: [26, 26], 
            iconAnchor: [13, 13]
        });

        const startPos = this.rotaAtual[this.index];
        this.marker = L.marker(startPos, { icon: busIcon, zIndexOffset: 1000 });
        this.marker.bindPopup(() => this.getPopupContent());
        this.marker.addTo(this.map);
    }

    gerarIcone() {
        const corBus = this.sentido === 'ida' ? '#FF4500' : '#FF8C00';
        
        const svgSimple = `
        <svg class="bus-svg-icon" viewBox="0 -1.2 122.9 122.9" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#ffffff">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M110.8,103.6h-7.6V114c0,3.6-2.9,6.5-6.5,6.5h-9c-3.6,0-6.5-2.9-6.5-6.5v-10.3H41.5V114
            c0,3.6-2.9,6.5-6.5,6.5h-9c-3.6,0-6.5-2.9-6.5-6.5v-10.3H12v-82c0-7.6,4.4-13.1,13.3-16.5c17.6-6.9,54.6-6.9,72.3,0
            c8.9,3.4,13.3,8.9,13.3,16.5V103.6z M118.6,40.4h-3.8V62h3.8c2.4,0,4.3-1.9,4.3-4.3V44.7C122.9,42.3,121,40.4,118.6,40.4z
            M4.3,40.4h3.8V62H4.3C1.9,62,0,60.1,0,57.7V44.7C0,42.3,1.9,40.4,4.3,40.4z M46.4,8.6h30.1c0.9,0,1.6,0.7,1.6,1.6v5.2
            c0,0.9-0.7,1.6-1.6,1.6H46.4c-0.9,0-1.6-0.7-1.6-1.6v-5.2C44.8,9.3,45.5,8.6,46.4,8.6z M22.9,23.2h76.7c1,0,1.9,0.9,1.9,1.9v42.8
            c0,1-0.9,1.9-1.9,1.9H22.9c-1,0-1.9-0.9-1.9-1.9V25.1C21,24.1,21.8,23.2,22.9,23.2z M98.6,84.9c0-1.9-0.7-3.6-2-4.9
            c-1.3-1.3-3-2-4.9-2c-1.9,0-3.5,0.7-4.9,2c-1.4,1.3-2,3-2,4.9c0,1.9,0.7,3.5,2,4.8c1.4,1.3,3,2,4.9,2c1.9,0,3.6-0.7,4.9-2
            C98,88.4,98.6,86.8,98.6,84.9z M38.1,84.9c0-1.9-0.7-3.6-2-4.9c-1.3-1.3-3-2-4.9-2c-1.9,0-3.6,0.7-4.9,2c-1.3,1.3-2,3-2,4.9
            c0,1.9,0.6,3.5,2,4.8c1.3,1.3,3,2,4.9,2c2,0,3.6-0.7,4.9-2C37.4,88.4,38.1,86.8,38.1,84.9z"/>
        </svg>`;

        return L.divIcon({
            className: 'bus-marker-container',
            html: `
                <div class="bus-rotating-wrapper" style="color: ${corBus};">
                    <div class="bus-pulse"></div>
                    <div class="bus-main-circle">
                        ${svgSimple}
                    </div>
                </div>
            `,
            iconSize: [26, 26], 
            iconAnchor: [13, 13]
        });
    }

    criarMarcador() {
        const startPos = this.rotaAtual[this.index];
        // Usa o método gerarIcone
        this.marker = L.marker(startPos, { icon: this.gerarIcone(), zIndexOffset: 1000 });
        this.marker.bindPopup(() => this.getPopupContent());
        this.marker.addTo(this.map);
    }

    getPopupContent() {
        const corIcone = this.sentido === 'ida' ? '#FF4500' : '#FF8C00';
        
        const iconBusTitle = `
        <svg style="width:14px;height:14px;fill:${corIcone};"
            viewBox="0 -1.2 122.9 122.9"
            xmlns="http://www.w3.org/2000/svg">

            <path fill-rule="evenodd" clip-rule="evenodd"
                d="M110.8,103.6h-7.6V114c0,3.6-2.9,6.5-6.5,6.5h-9c-3.6,0-6.5-2.9-6.5-6.5v-10.3H41.5V114
                c0,3.6-2.9,6.5-6.5,6.5h-9c-3.6,0-6.5-2.9-6.5-6.5v-10.3H12v-82c0-7.6,4.4-13.1,13.3-16.5c17.6-6.9,54.6-6.9,72.3,0
                c8.9,3.4,13.3,8.9,13.3,16.5V103.6z M118.6,40.4h-3.8V62h3.8c2.4,0,4.3-1.9,4.3-4.3V44.7C122.9,42.3,121,40.4,118.6,40.4z
                M4.3,40.4h3.8V62H4.3C1.9,62,0,60.1,0,57.7V44.7C0,42.3,1.9,40.4,4.3,40.4z M46.4,8.6h30.1c0.9,0,1.6,0.7,1.6,1.6v5.2
                c0,0.9-0.7,1.6-1.6,1.6H46.4c-0.9,0-1.6-0.7-1.6-1.6v-5.2C44.8,9.3,45.5,8.6,46.4,8.6z M22.9,23.2h76.7c1,0,1.9,0.9,1.9,1.9v42.8
                c0,1-0.9,1.9-1.9,1.9H22.9c-1,0-1.9-0.9-1.9-1.9V25.1C21,24.1,21.8,23.2,22.9,23.2z M98.6,84.9c0-1.9-0.7-3.6-2-4.9
                c-1.3-1.3-3-2-4.9-2c-1.9,0-3.5,0.7-4.9,2c-1.4,1.3-2,3-2,4.9c0,1.9,0.7,3.5,2,4.8c1.4,1.3,3,2,4.9,2c1.9,0,3.6-0.7,4.9-2
                C98,88.4,98.6,86.8,98.6,84.9z M38.1,84.9c0-1.9-0.7-3.6-2-4.9c-1.3-1.3-3-2-4.9-2c-1.9,0-3.6,0.7-4.9,2c-1.3,1.3-2,3-2,4.9
                c0,1.9,0.6,3.5,2,4.8c1.3,1.3,3,2,4.9,2c2,0,3.6-0.7,4.9-2C37.4,88.4,38.1,86.8,38.1,84.9z"/>
        </svg>`;

        const statusTexto = this.isStopped ? "Embarcando..." : "Em movimento";

        return `
            <div class="popup-bus">
                <div class="popup-bus-header">
                    ${iconBusTitle}
                    <span>Ônibus ${this.id}</span>
                </div>
                <div class="popup-bus-info">
                    Sentido: <strong>${this.sentido.toUpperCase()}</strong><br>
                    Velocidade: <strong id="pop-speed-${this.id}">${Math.round(this.currentSpeed)} km/h</strong>
                </div>
                <div id="pop-status-${this.id}" class="popup-bus-status">
                    ${statusTexto}
                </div>
            </div>
        `;
    }

    update(dt) {
        // Controle de Visibilidade (Ida/Volta)
        const devoAparecer = (rotaNormal && this.sentido === 'ida') || (!rotaNormal && this.sentido === 'volta');
        if (devoAparecer) {
            if (!this.map.hasLayer(this.marker)) this.map.addLayer(this.marker);
        } else {
            if (this.map.hasLayer(this.marker)) this.map.removeLayer(this.marker);
        }

        if (this.isStopped) {
            this.atualizarPopupDinamico();
            return;
        }

        const p1 = this.rotaAtual[this.index];
        const p2 = this.rotaAtual[this.nextIndex];

        if (!p1 || !p2) {
            this.trocarSentido();
            return;
        }

        const dist = this.map.distance(p1, p2);
        
        // Se a distância for muito pequena, pula para o próximo ponto
        if (dist < 1) {
            this.avancarIndice();
            return;
        }

        // Simulação de velocidade com ruído leve
        const noise = Math.sin(Date.now() / 1000 + this.id) * 5; 
        this.currentSpeed = Math.max(0, this.speed + noise);

        const speedMS = this.currentSpeed / 3.6;
        const moveDist = speedMS * dt;
        const deltaProgress = moveDist / dist; // Porcentagem do segmento percorrida
        this.progress += deltaProgress;

        // Interpolação da posição
        const lat = p1[0] + (p2[0] - p1[0]) * this.progress;
        const lng = p1[1] + (p2[1] - p1[1]) * this.progress;
        const newPos = [lat, lng];

        this.marker.setLatLng(newPos);
        this.atualizarPopupDinamico();

        // ----------------------------------------------------
        // OTIMIZAÇÃO: Atualiza previsões apenas a cada 1 segundo
        // ----------------------------------------------------
        this.timeSinceLastPrediction += dt;
        if (this.timeSinceLastPrediction >= 1.0) { // 1.0 segundos
            const distRestanteNoSegmento = dist * (1 - this.progress);
            this.atualizarPrevisoesParadas(distRestanteNoSegmento);
            this.timeSinceLastPrediction = 0; // Reseta o timer
        }

        // Verifica se completou o segmento
        if (this.progress >= 1) {
            this.progress = 0;
            this.avancarIndice();
        }
    }

    avancarIndice() {
        this.index++;
        this.nextIndex = this.index + 1;

        if (this.nextIndex >= this.rotaAtual.length) {
            this.trocarSentido();
            return;
        }
        this.verificarParada();
    }

    verificarParada() {
        const posAtual = this.rotaAtual[this.index];
        
        // Verifica se há uma parada a menos de 25 metros
        const paradaProxima = this.paradasAtuais.find(p => {
            if(!p.localizacao?.coordinates) return false;
            const [plon, plat] = p.localizacao.coordinates;
            const dist = this.map.distance(posAtual, [plat, plon]);
            return dist < 25; 
        });

        if (paradaProxima) {
            this.realizarParada(paradaProxima);
        }
    }

    realizarParada(parada) {
        this.isStopped = true;
        this.currentSpeed = 0;
        
        // 1. Remove previsão deste ônibus da parada atual (pois ele já chegou)
        if(parada.previsoes) {
            parada.previsoes = parada.previsoes.filter(p => p.busId !== this.id);
            // Atualiza o display para "Chegou" ou mostra o próximo
            if(parada.previsoes.length > 0) {
                 atualizarDisplays(parada);
            } else {
                 // Reseta display se não houver mais ônibus vindo
                 const lat = parada.localizacao.coordinates[1];
                 const item = document.querySelector(`.stop-item[data-lat="${lat}"] .stop-details ul`);
                 if(item) item.innerHTML = "<li>--:--</li>";
            }
        }

        // Estilo visual
        const el = this.marker.getElement();
        if(el) el.classList.add('bus-stopped');

        setTimeout(() => {
            this.isStopped = false;
            if(el) el.classList.remove('bus-stopped');
            
            // 2. IMPORTANTE: Força recálculo IMEDIATO ao sair da parada
            // Isso garante que a próxima parada receba a previsão assim que o ônibus sai
            this.atualizarPrevisoesParadas(0); 

        }, SIM_CONFIG.tempoParada);
    }

    trocarSentido() {
        // Lógica de inversão
        this.sentido = this.sentido === 'ida' ? 'volta' : 'ida';
        this.configurarRotas();
        
        this.index = 0;
        this.nextIndex = 1;
        this.progress = 0;

        // Atualiza cor do ícone
        this.marker.setIcon(this.gerarIcone());
    }

    atualizarPopupDinamico() {
        if (this.marker && this.marker.isPopupOpen()) {
            const elSpeed = document.getElementById(`pop-speed-${this.id}`);
            const elStatus = document.getElementById(`pop-status-${this.id}`);
            if (elSpeed) elSpeed.innerText = `${Math.round(this.currentSpeed)} km/h`;
            if (elStatus) elStatus.innerText = this.isStopped ? "Embarcando..." : "Em movimento";
        }
    }

    // ==========================================
    // LÓGICA DE PREVISÃO
    // ==========================================
    atualizarPrevisoesParadas(distRestanteNoSegmento) {
        let distanciaAcumulada = distRestanteNoSegmento;
        // Usa a média da velocidade configurada para estabilidade, não a velocidade instantânea
        let busSpeedMS = Math.max(1, SIM_CONFIG.velocidadeMedia / 3.6); 

        // 1. Percorre a rota ATUAL do ponto onde o ônibus está até o fim
        for (let i = this.index + 1; i < this.rotaAtual.length - 1; i++) {
            const pA = this.rotaAtual[i];
            const pB = this.rotaAtual[i+1];
            distanciaAcumulada += this.map.distance(pA, pB);

            // Verifica paradas na rota atual
            this.calcularTempoParaParadas(pB, distanciaAcumulada, busSpeedMS, this.paradasAtuais);
        }

        // 2. (Opcional) Percorre a PRÓXIMA rota para dar previsões de ciclo contínuo
        // Se quiser economizar CPU, pode comentar este bloco 'distanciaFase2'
        let distanciaFase2 = distanciaAcumulada;
        const limiteFase2 = Math.floor(this.rotaProxima.length * 0.5); // Olha 50% da próxima rota
        for (let j = 0; j < limiteFase2 - 1; j++) {
            const pA = this.rotaProxima[j];
            const pB = this.rotaProxima[j+1];
            distanciaFase2 += this.map.distance(pA, pB);
            this.calcularTempoParaParadas(pB, distanciaFase2, busSpeedMS, this.paradasProximas);
        }
    }

    calcularTempoParaParadas(pontoRota, distancia, velocidade, listaParadas) {
        listaParadas.forEach(parada => {
            if (!parada.localizacao?.coordinates) return;
            const [plon, plat] = parada.localizacao.coordinates;
            
            // Se o ponto da rota está perto da parada (40m)
            if (this.map.distance(pontoRota, [plat, plon]) < 40) {
                const segundosParaChegar = distancia / velocidade;
                
                if (!parada.previsoes) parada.previsoes = [];
                
                // Remove previsão antiga deste ônibus para atualizar com a nova
                parada.previsoes = parada.previsoes.filter(p => p.busId !== this.id);
                
                // Só adiciona se estiver a menos de 40 min
                if (segundosParaChegar < 2400) {
                    parada.previsoes.push({ 
                        busId: this.id, 
                        segundos: segundosParaChegar 
                    });
                }
                
                // Ordena para pegar o menor tempo
                parada.previsoes.sort((a, b) => a.segundos - b.segundos);
                
                if (parada.previsoes.length > 0) {
                    const dados = formatarETA(parada.previsoes[0].segundos);
                    parada.horario_prox = dados.texto; 
                    parada.classe_status = dados.classe; 
                }

                // Atualiza a interface
                atualizarDisplays(parada);
            }
        });
    }
}

// ==========================================
// GERENCIADOR DA FROTA
// ==========================================
let frota = [];
let lastTime = 0;

function iniciarSimulacao(segmentIda, segmentVolta, paradasIda, paradasVolta) {
    if (!mapa) return;
    
    frota.forEach(b => mapa.removeLayer(b.marker));
    frota = [];
// Antes estava: i < 4
    const QUANTIDADE_POR_SENTIDO = 2; 

    // Ônibus na IDA
    for (let i = 0; i < QUANTIDADE_POR_SENTIDO; i++) {
        // Ajusta o espaçamento (offset) para dividir bem a rota
        // Se são 2 ônibus, offset será 0 e 0.5 (começo e meio)
        const offset = i * (1 / QUANTIDADE_POR_SENTIDO); 
        frota.push(new BusAgent(100 + i, segmentIda, segmentVolta, paradasIda, paradasVolta, mapa, offset, 'ida'));
    }

    // Ônibus na VOLTA
    for (let i = 0; i < QUANTIDADE_POR_SENTIDO; i++) {
        const offset = i * (1 / QUANTIDADE_POR_SENTIDO); 
        frota.push(new BusAgent(200 + i, segmentIda, segmentVolta, paradasIda, paradasVolta, mapa, offset, 'volta'));
    }

    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    frota.forEach(bus => bus.update(deltaTime));

    requestAnimationFrame(gameLoop);
}

// ==========================================
// INTEGRAÇÃO COM A UI (AJUSTADO PARA A LISTA)
// ==========================================
function atualizarDisplays(parada) {
    if (!parada.previsoes || parada.previsoes.length === 0) return;

    // Pega o ônibus mais próximo
    const melhorPrevisao = parada.previsoes[0];
    const dadosFormatados = formatarETA(melhorPrevisao.segundos);

    // 1. Atualiza a Sidebar
    const lat = parada.localizacao.coordinates[1];
    const stopItem = document.querySelector(`.stop-item[data-lat="${lat}"]`);
    
    if (stopItem) {
        // MUDANÇA AQUI: Alvo agora é a lista dentro de details, não o header
        const listaHorarios = stopItem.querySelector('.stop-details ul');
        
        // Opcional: Limpar o tempo do header se ele existir estático
        const headerTime = stopItem.querySelector('.stop-header .stop-time');
        if(headerTime) headerTime.textContent = ""; 

        if (listaHorarios) {
            // Substitui o "--:--" pelo tempo formatado (SEM EMOJI)
            // Mantemos o estilo de lista <li>
            listaHorarios.innerHTML = `<li class="${dadosFormatados.classe}">${dadosFormatados.texto}</li>`;
        }
    }

    // 2. Atualiza o Popup (se aberto)
    if (mapa) {
        mapa.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.getPopup() && layer.getPopup().isOpen()) {
                const latlng = layer.getLatLng();
                const [plon, plat] = parada.localizacao.coordinates;
                
                // Compara posição com tolerância pequena (float)
                if (Math.abs(latlng.lat - plat) < 0.0001 && Math.abs(latlng.lng - plon) < 0.0001) {
                    const contentDiv = layer.getPopup().getElement().querySelector('.popup-time');
                    if (contentDiv) {
                        contentDiv.className = 'popup-time ' + dadosFormatados.classe;
                        contentDiv.innerHTML = `Próximo: ${dadosFormatados.texto}`;
                    }
                }
            }
        });
    }
}