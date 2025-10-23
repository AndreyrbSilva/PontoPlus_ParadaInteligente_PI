// ==============================
// Configurações básicas
// ==============================
const onibusId = window.location.pathname.split("/").pop();
let rotaNormal = true;
let mapa;

// ==============================
// 1. Busca o ônibus e a linha
// ==============================
fetch(`/api/onibus/${onibusId}`)
  .then(res => res.json())
  .then(data => {
    if (!data.onibus) {
      document.body.innerHTML = "<h2>Ônibus não encontrado</h2>";
      return;
    }

    const onibus = data.onibus;
    const linha = data.linha;

    // Preenche informações básicas no topo
    document.getElementById("busName").textContent = `Ônibus ${linha.numero_linha || onibus.linha_id || "--"}`;
    document.getElementById("linhaNumero").textContent = linha.numero_linha || "--";
    document.getElementById("linhaNome").textContent = linha.nome || "Linha desconhecida";

    carregarLinha(linha);
  })
  .catch(err => {
    console.error("Erro ao buscar dados do ônibus:", err);
    document.body.innerHTML = "<h2>Erro ao carregar informações do ônibus</h2>";
  });

// ==============================
// 2. Carrega a linha e as paradas
// ==============================
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
      initMap(paradasOrdenadas);
    })
    .catch(err => console.error("Erro ao carregar paradas:", err));
}

// ==============================
// 3. Exibe as paradas na sidebar
// ==============================
function carregarParadas(paradas) {
  const lista = document.getElementById("stopsList");
  lista.innerHTML = "";

  paradas.forEach((parada) => {
    const item = document.createElement("div");
    item.className = "stop-item";

    // Extrai as coordenadas, se existirem
    let lat, lon;
    if (parada.localizacao?.coordinates) {
      [lon, lat] = parada.localizacao.coordinates;

      // **NOVIDADE:** Armazenar coordenadas como atributos de dados
      item.dataset.lat = lat;
      item.dataset.lon = lon;
    }

    // Monta o conteúdo HTML do item
    item.innerHTML = `
      <div class="stop-line"></div>
      <div class="stop-dot"></div>
      <div class="stop-content">
        <div class="stop-header">
          <span class="stop-title">${parada.name || "Parada"}</span>
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

    // ==========================================
    // EVENTO DE CLIQUE COM LÓGICA DO MAPA
    // ==========================================
    item.addEventListener("click", () => {
      const isCurrentlyOpen = item.classList.contains("open");

      // Fecha todos os itens abertos
      const openItems = lista.querySelectorAll(".stop-item.open");
      openItems.forEach((openItem) => openItem.classList.remove("open"));

      // ----------------------------------------------------
      // **NOVIDADE:** LÓGICA DO MAPA
      // ----------------------------------------------------
      const clickedLat = item.dataset.lat;
      const clickedLon = item.dataset.lon;

      // Se o item não estava aberto e tem coordenadas, centraliza o mapa
      if (!isCurrentlyOpen && mapa && clickedLat && clickedLon) {
        mapa.setView([clickedLat, clickedLon], 16); // Zoom 16 = bom detalhe
      } else if (isCurrentlyOpen && mapa) {
        // Opcional: reposicionar ou ajustar visualização geral
        // initMap(paradas); // Evitado por performance
      }

      // Abre o item (se não estava aberto)
      if (!isCurrentlyOpen) {
        item.classList.add("open");
      }
    });

    lista.appendChild(item);
  });
}

async function initMap(paradas) {
  const MAPTILER_KEY = "ikdoP1u9s2FX498f4gRI";

  // Inicializa o mapa se ainda não existir
  if (!mapa) {
    mapa = L.map("map").setView([-8.05, -34.9], 13);
    L.tileLayer(
      `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
      {
        tileSize: 512,
        zoomOffset: -1,
        attribution: "© OpenStreetMap | © MapTiler",
      }
    ).addTo(mapa);
  }

  // Remove camadas antigas
  if (window.marcadoresGroup) mapa.removeLayer(window.marcadoresGroup);
  if (window.rotaLayer) mapa.removeLayer(window.rotaLayer);

  // 🔵 Paradas (círculos)
  const marcadores = [];
  paradas.forEach((p) => {
    if (p.localizacao?.coordinates) {
      const [lon, lat] = p.localizacao.coordinates;
      const marker = L.circleMarker([lat, lon], {
        radius: 5,
        color: "#2b57d9",
        fillColor: "#2b57d9",
        fillOpacity: 1,
      }).bindPopup(`<strong>${p.name}</strong>`);
      marcadores.push(marker);
    }
  });

  if (marcadores.length) {
    window.marcadoresGroup = L.featureGroup(marcadores).addTo(mapa);
  }

  // 🟩🟦 Desenhar as rotas coloridas (ida/volta)
  try {
    const linhaId = document.getElementById("linhaNumero").textContent.trim();
    const resp = await fetch(`/api/linha/L${linhaId}`);
    const data = await resp.json();

    const shape = data.linha?.shape || data.shape;

    if (shape?.coordinates?.length) {
      const coords = shape.coordinates.map((c) => [c[1], c[0]]);

      // Divide a rota em duas partes (metade para ida e metade para volta)
      const metade = Math.floor(coords.length / 2);
      const coordsIda = coords.slice(0, metade);
      const coordsVolta = coords.slice(metade);

      // 🟢 Linha verde (ida)
      const idaLayer = L.polyline(coordsIda, {
        color: "#00cc66",
        weight: 4,
        opacity: 0.9,
        smoothFactor: 1,
      }).addTo(mapa);

      // 🔵 Linha azul (volta)
      const voltaLayer = L.polyline(coordsVolta, {
        color: "#0033cc",
        weight: 4,
        opacity: 0.9,
        smoothFactor: 1,
      }).addTo(mapa);

      // Agrupa as duas rotas em um layer global
      window.rotaLayer = L.layerGroup([idaLayer, voltaLayer]).addTo(mapa);

      // Ajusta o zoom pra caber toda a linha
      mapa.fitBounds(L.latLngBounds(coords));

      // 🧭 Adiciona legenda de cores
      const legenda = L.control({ position: "bottomleft" });
      legenda.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        div.style.background = "white";
        div.style.padding = "8px";
        div.style.borderRadius = "8px";
        div.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
        div.innerHTML = `
          <div style="display:flex;align-items:center;margin-bottom:4px;">
            <span style="background:#00cc66;width:20px;height:5px;display:inline-block;margin-right:6px;"></span>
            Ida
          </div>
          <div style="display:flex;align-items:center;">
            <span style="background:#0033cc;width:20px;height:5px;display:inline-block;margin-right:6px;"></span>
            Volta
          </div>
        `;
        return div;
      };
      legenda.addTo(mapa);
    } else {
      console.warn("⚠️ Nenhum shape encontrado para a linha", linhaId);
    }
  } catch (err) {
    console.error("Erro ao desenhar rota da linha:", err);
  }
}


// ==============================
// 5. Alternar o sentido da linha
// ==============================
document.getElementById("toggleDirection").addEventListener("click", () => {
  rotaNormal = !rotaNormal;
  document.getElementById("toggleDirection").classList.toggle("active");

  const linhaId = document.getElementById("linhaNumero").textContent.trim();
  fetch(`/api/paradas_linha/${linhaId}`)
    .then(res => res.json())
    .then(paradas => {
      const paradasOrdenadas = rotaNormal ? paradas : [...paradas].reverse();
      carregarParadas(paradasOrdenadas);
      initMap(paradasOrdenadas);
    });
});
