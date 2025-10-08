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

// Executa imediatamente ao carregar a página
atualizarRelogio();

// Continua atualizando a cada segundo
setInterval(atualizarRelogio, 1000);

// ====================
// Alternância de tema (modo claro/escuro)
// ====================
const themeToggle = document.querySelector('.theme-toggle');
let isMoon = true;

const sunIcon = `<svg class="icon sun fade-in" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M58.57,25.81c-2.13-3.67-0.87-8.38,2.8-10.51s8.38-0.88,10.51,2.8l9.88,17.1c2.13,3.67.87,8.38-2.8,10.51s-8.38.88-10.51-2.8l-9.88-17.1zM120,51.17c19.01,0,36.21,7.7,48.67,20.16S188.83,101,188.83,120s-7.7,36.21-20.16,48.67S139.01,188.83,120,188.83s-36.21-7.7-48.67-20.16S51.17,139.01,51.17,120s7.7-36.21,20.16-48.67S101,51.17,120,51.17zM158.27,81.73c-9.79-9.79-23.32-15.85-38.27-15.85s-28.48,6.06-38.27,15.85S65.88,105.05,65.88,120s6.06,28.48,15.85,38.27S105.05,174.12,120,174.12s28.48-6.06,38.27-15.85S174.12,134.95,174.12,120s-6.06-28.48-15.85-38.27zM113.88,7.71a7.71,7.71,0,1,1,15.42,0v19.75a7.71,7.71,0,1,1-15.42,0V7.71zM170.87,19.72a7.71,7.71,0,0,1,13.31,7.65l-9.88,17.1a7.71,7.71,0,0,1-13.31-7.65l9.88-17.1zM214.19,58.57a7.71,7.71,0,1,1,7.71,13.31l-17.1,9.88a7.71,7.71,0,0,1-7.71-13.31l17.1-9.88zM232.29,113.88a7.71,7.71,0,1,1,0,15.42h-19.75a7.71,7.71,0,1,1,0-15.42h19.75zM220.28,170.87a7.71,7.71,0,0,1-7.65,13.31l-17.1-9.88a7.71,7.71,0,0,1,7.65-13.31l17.1,9.88zM181.43,214.19a7.71,7.71,0,1,1-13.31,7.65l-9.88-17.1a7.71,7.71,0,1,1,13.31-7.65l9.88,17.1zM126.12,232.29a7.71,7.71,0,1,1-15.42,0v-19.75a7.71,7.71,0,1,1,15.42,0v19.75zM69.13,220.28a7.71,7.71,0,1,1-13.31-7.65l9.88-17.1a7.71,7.71,0,1,1,13.31,7.65l-9.88,17.1zM25.81,181.43a7.71,7.71,0,1,1-7.71-13.31l17.1-9.88a7.71,7.71,0,1,1,7.71,13.31l-17.1,9.88zM7.71,126.12a7.71,7.71,0,1,1,0-15.42h19.75a7.71,7.71,0,1,1,0,15.42H7.71zM19.72,69.13a7.71,7.71,0,0,1,7.65-13.31l17.1,9.88a7.71,7.71,0,1,1-7.65,13.31l-17.1-9.88z"/></svg>`;
const moonIcon = `<svg class="icon moon fade-in" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M13.589 21.659c-3.873 1.038-8.517-.545-10.98-3.632a1 1 0 0 1 .751-1.623c3.984-.118 6.662-1.485 8.17-4.098 1.51-2.613 1.354-5.616-.535-9.125a1 1 0 0 1 1.03-1.463c3.904.59 7.597 3.82 8.635 7.694 1.43 5.334-1.737 10.818-7.071 12.247z"/></svg>`;

// Aplica o tema salvo anteriormente
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.innerHTML = sunIcon;
  isMoon = false;
} else {
  document.body.classList.remove('dark-mode');
  themeToggle.innerHTML = moonIcon;
  isMoon = true;
}

themeToggle.addEventListener('click', () => {
  const icon = themeToggle.querySelector('.icon');

  // Inicia fade-out do ícone
  icon.classList.remove('fade-in');
  icon.classList.add('fade-out');

  // Aguarda o início do fade antes de trocar o tema (200ms)
  setTimeout(() => {
    document.body.classList.toggle('dark-mode');

    // Salva a preferência
    const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
  }, 200); // espera um pouco para que o fade-out comece antes do tema mudar

  // Troca o ícone após o fade-out completo
  setTimeout(() => {
    themeToggle.innerHTML = isMoon ? sunIcon : moonIcon;
    isMoon = !isMoon;

    const newIcon = themeToggle.querySelector('.icon');
    newIcon.classList.add('fade-in');
  }, 600); // mesma duração do fade-out
});

// ====================
// 🔄 Carregar linhas de ônibus da API Flask
// ====================

// Função para buscar e renderizar as linhas
async function carregarLinhas() {
  try {
    const resposta = await fetch("/api/linhas");
    const linhas = await resposta.json();

    const container = document.querySelector(".bus-list");
    container.innerHTML = "";

    linhas.forEach(linha => {
      const card = document.createElement("div");
      card.classList.add("bus-card");

      const bus = linha.onibus?.[0] || {};

      // SVGs originais do index.html
      const svgOnibus = `
        <svg class="icon bus-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M6 3a2 2 0 0 0-2 2v11a3 3 0 0 0 3 3v2a1 1 0 0 0 2 0v-2h6v2a1 1 0 0 0 2 0v-2a3 3 0 0 0 3-3V5a2 2 0 0 0-2-2H6Zm0 2h12v7H6V5Zm0 9h12v2H6v-2Zm2 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm11 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
        </svg>
      `;

      const svgWifi = `
        <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M2.8072 10.8076C7.88402 5.7308 16.1152 5.7308 21.192 10.8076C21.5825 11.1981 22.2157 11.1981 22.6062 10.8076C22.9967 10.4171 22.9967 9.78392 22.6062 9.3934C16.7483 3.53553 7.25085 3.53553 1.39299 9.3934C1.00247 9.78392 1.00247 10.4171 1.39299 10.8076C1.78352 11.1981 2.41668 11.1981 2.8072 10.8076ZM5.63563 13.636C9.15035 10.1213 14.8488 10.1213 18.3636 13.636C18.7541 14.0266 19.3872 14.0266 19.7778 13.636C20.1683 13.2455 20.1683 12.6123 19.7778 12.2218C15.482 7.92606 8.51719 7.92606 4.22142 12.2218C3.83089 12.6123 3.83089 13.2455 4.22142 13.636C4.61194 14.0266 5.24511 14.0266 5.63563 13.636ZM8.46406 16.4645C10.4167 14.5118 13.5825 14.5118 15.5351 16.4645C15.9257 16.855 16.5588 16.855 16.9493 16.4645C17.3399 16.0739 17.3399 15.4408 16.9493 15.0503C14.2157 12.3166 9.78351 12.3166 7.04984 15.0503C6.65932 15.4408 6.65932 16.0739 7.04984 16.4645C7.44037 16.855 8.07353 16.855 8.46406 16.4645ZM9.8781 17.8787C11.0497 16.7071 12.9492 16.7071 14.1207 17.8787C14.5113 18.2692 14.5113 18.9024 14.1207 19.2929L12.7065 20.7071C12.316 21.0976 11.6828 21.0976 11.2923 20.7071L9.8781 19.2929C9.48757 18.9024 9.48757 18.2692 9.8781 17.8787Z" fill="currentColor"/>
        </svg>`;
      const svgFloco = `
        <svg class="icon" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M43.5,26.5a1.9,1.9,0,0,0-2.4-1.1l-7.3,2L28,24l5.8-3.3,7.3,1.9a2,2,0,1,0,1.1-3.8l-3.5-1,3.6-2.1a2,2,0,0,0,.8-2.7,2,2,0,0,0-2.8-.7l-3.6,2.1.9-3.6a1.9,1.9,0,0,0-1.7-2.5,2,2,0,0,0-2.1,1.6l-2,7.3L26,20.5V13.8l5.4-5.3a2.1,2.1,0,0,0,.2-2.7,1.9,1.9,0,0,0-3-.2L26,8.2V4a2,2,0,0,0-4,0V8.2L19.4,5.6a1.9,1.9,0,0,0-3,.2,2.1,2.1,0,0,0,.2,2.7L22,13.8v6.7l-5.8-3.3-2-7.3a2,2,0,0,0-2.1-1.6,1.9,1.9,0,0,0-1.7,2.5l.9,3.6L7.7,12.3a2,2,0,0,0-2.8.7,2,2,0,0,0,.8,2.7l3.6,2.1-3.5,1a1.9,1.9,0,0,0-1.3,2.7,1.9,1.9,0,0,0,2.4,1.1l7.3-2L20,24l-5.8,3.3L6.9,25.4a1.9,1.9,0,0,0-2.4,1.1,1.9,1.9,0,0,0,1.3,2.7l3.5,1L5.7,32.3A2,2,0,0,0,4.9,35a2,2,0,0,0,2.8.7l3.6-2.1-.9,3.6a1.9,1.9,0,0,0,1.7,2.5,2,2,0,0,0,2.1-1.6l2-7.3L22,27.5v6.7l-5.4,5.3a2.1,2.1,0,0,0-.2,2.7,1.9,1.9,0,0,0,3,.2L22,39.8V44a2,2,0,0,0,4,0V39.8l2.6,2.6a1.9,1.9,0,0,0,3-.2,2.1,2.1,0,0,0-.2-2.7L26,34.2V27.5l5.8,3.3,2,7.3a2,2,0,0,0,2.1,1.6,1.9,1.9,0,0,0,1.7-2.5l-.9-3.6,3.6,2.1a2,2,0,0,0,2.8-.7,2,2,0,0,0-.8-2.7l-3.6-2.1,3.5-1A1.9,1.9,0,0,0,43.5,26.5Z" fill="currentColor"/>
        </svg>`;
      const svgCadeirante = `
        <svg class="icon" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.783 9c2.219 0 4-1.805 4-4 0-2.219-1.781-4-4-4-2.206 0-4 1.782-4 4 0 2.195 1.794 4 4 4zm2.824 36.675c-6.812 0-12.336-5.601-12.336-12.537 0-3.797 1.689-7.185 4.324-9.489l-.219-3.922c-4.412 2.802-7.376 7.731-7.376 13.411 0 8.752 6.983 15.862 15.607 15.862 6.346 0 11.955-4.471 14.393-10l-2.376-3.272c-1.174 5.665-6.09 9.947-12.017 9.947zm24.393-7.675h-2l-8-11c-.433-.761-2-3-4-3h-9v-4h8c1.036 0 2.154-.441 2.154-1.506 0-1.057-1.089-1.494-2.154-1.494h-8v-4c-.147-2.218-2-3-3.99-2.954-2.01.046-3.01.954-3.01 2.954v14c.19 2.246 1.807 3 4 3h12l7 9c.451.746 2 3 2 3h5c1.032 0 2-.938 2-2 0-1.057-.936-2-2-2z" fill="currentColor"/>
        </svg>`;

      const iconsHTML = `
        <div class="icon-container">
          ${svgWifi}
          ${svgFloco}
          ${svgCadeirante}
        </div>
      `;

      const infoExtra = `
        <div class="bus-extra">
          <small>
            <strong>Modelo:</strong> ${bus.modelo || "Desconhecido"} |
            <strong>Capacidade:</strong> ${bus.capacidade || "?"} |
            <strong>Operadora:</strong> ${bus.operadora_id || "-"}
          </small>
        </div>
      `;

      card.innerHTML = `
        <div class="bus-top">
          <span class="status-badge status-amarelo">
            <svg class="status-dot" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="8" />
            </svg>
            ${linha.status || "3 MIN"}
          </span>
          ${iconsHTML}
        </div>

        <div class="bus-info">
          <span class="line-number">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M6 3a2 2 0 0 0-2 2v11a3 3 0 0 0 3 3v2a1 1 0 0 0 2 0v-2h6v2a1 1 0 0 0 2 0v-2a3 3 0 0 0 3-3V5a2 2 0 0 0-2-2H6Zm0 2h12v7H6V5Zm0 9h12v2H6v-2Zm2 3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm11 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" fill="currentColor"/>
            </svg>
            ${bus.name || "206"}
          </span>
          <span class="line-name">— ${linha.name}</span>
        </div>

        <div class="bus-times">
          <span>PRÓXIMOS:</span>
          <button>3 Min</button><button>12 Min</button><button>20 Min</button>
        </div>

        ${infoExtra}
      `;


      container.appendChild(card);
    });

  } catch (err) {
    console.error("Erro ao carregar dados:", err);
  }
}

// Executa automaticamente quando a página carrega
document.addEventListener("DOMContentLoaded", carregarLinhas);
