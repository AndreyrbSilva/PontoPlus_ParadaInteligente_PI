// Pega o ID do ônibus da URL
const onibusId = window.location.pathname.split("/").pop();
let rotaNormal = true; // controla o sentido atual da rota
let mapa; // referência global do mapa

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
    document.getElementById("busName").textContent = onibus.name || "Detalhes do Ônibus";
    const linhaNumeroEl = document.getElementById("linhaNumero");
    linhaNumeroEl.textContent = linha.numero_linha || onibus.linha_id || "--";

    // Atualiza também o título principal dinamicamente
    document.getElementById("busName").textContent = `Ônibus ${linhaNumeroEl.textContent}`;
    document.getElementById("linhaNome").textContent = linha.nome || "Linha desconhecida";

    // Carrega as paradas e o mapa
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
// 3. Exibe as paradas na lista
// ==============================
function carregarParadas(paradas) {
  const lista = document.getElementById("stopsList");
  lista.innerHTML = ""; // limpa lista

  paradas.forEach(parada => {
    const item = document.createElement("div");
    item.className = "stop-item";

    item.innerHTML = `
      <div class="stop-icon"></div>
      <div class="stop-content">
        <div class="stop-header">
          <span class="stop-title">${parada.name || "Parada"}</span>
          <span class="stop-time">Próxima chegada: ${parada.horario_prox || "--:--"}</span>
        </div>
        <div class="stop-details">
          <p><strong>Horários:</strong></p>
          <ul>
            ${(parada.horarios || ["--:--"]).map(h => `<li>${h}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="stop-expand"><i class="fa-solid fa-chevron-right"></i></div>
    `;

    // adiciona o evento de abrir/fechar (accordion)
    item.addEventListener("click", () => {
      item.classList.toggle("open");
    });

    lista.appendChild(item);
  });
}

// ==============================
// 4. Inicializa o mapa e marcadores
// ==============================
function initMap(paradas) {
  // Cria o mapa apenas uma vez
  if (!mapa) {
    mapa = L.map("map").setView([-8.05, -34.9], 13); // Recife padrão
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(mapa);
  }

  // Remove marcadores antigos
  if (window.marcadoresGroup) {
    mapa.removeLayer(window.marcadoresGroup);
  }

  const marcadores = [];

  paradas.forEach(parada => {
    if (parada.localizacao?.coordinates) {
      const [lon, lat] = parada.localizacao.coordinates;
      const marker = L.marker([lat, lon])
        .bindPopup(`<strong>${parada.name}</strong><br>Próxima chegada: ${parada.horario_prox || "--:--"}`);
      marcadores.push(marker);
    }
  });

  if (marcadores.length) {
    window.marcadoresGroup = L.featureGroup(marcadores).addTo(mapa);
    mapa.fitBounds(window.marcadoresGroup.getBounds().pad(0.2));
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
