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
