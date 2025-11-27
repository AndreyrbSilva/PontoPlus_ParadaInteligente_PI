const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

// --- PASSWORD STRENGTH CHECKER ---
const senhaInput = document.getElementById("senha-register");
const strengthMsg = document.getElementById("password-strength");
const strengthFill = document.getElementById("strength-fill");
const senhaField = document.getElementById("senha-field");

if (senhaInput) {
  senhaInput.addEventListener("input", () => {
    const senha = senhaInput.value;

    // Regras
    const temMaiuscula = /[A-Z]/.test(senha);
    const temMinuscula = /[a-z]/.test(senha);
    const temNumero = /\d/.test(senha);
    const temEspecial = /[!@#$%¨&*();]/.test(senha);
    const tamanhoValido = senha.length >= 8;

    let score = 0;

    if (tamanhoValido) score++;
    if (temMaiuscula) score++;
    if (temMinuscula) score++;
    if (temNumero) score++;
    if (temEspecial) score++;

    // Reset visual
    strengthMsg.className = "strength-msg";
    strengthFill.style.width = "0%";

    senhaField.classList.remove("border-weak", "border-medium", "border-strong");

    if (senha.length === 0) {
      strengthMsg.textContent = "";
      return;
    }

    if (score <= 2) {
      strengthMsg.textContent = "Senha fraca";
      strengthMsg.classList.add("strength-weak");

      strengthFill.style.width = "33%";
      strengthFill.style.backgroundColor = "#ff4d4d";

      senhaField.classList.add("border-weak");
    } 
    else if (score === 3 || score === 4) {
      strengthMsg.textContent = "Senha média";
      strengthMsg.classList.add("strength-medium");

      strengthFill.style.width = "66%";
      strengthFill.style.backgroundColor = "#ffcc00";

      senhaField.classList.add("border-medium");
    } 
    else if (score === 5) {
      strengthMsg.textContent = "Senha forte";
      strengthMsg.classList.add("strength-strong");

      strengthFill.style.width = "100%";
      strengthFill.style.backgroundColor = "#4dff4d";

      senhaField.classList.add("border-strong");
    }
  });
}

// elementos das regras
const ruleLength  = document.getElementById("rule-length");
const ruleUpper   = document.getElementById("rule-upper");
const ruleLower   = document.getElementById("rule-lower");
const ruleNumber  = document.getElementById("rule-number");
const ruleSpecial = document.getElementById("rule-special");

function toggleRule(li, ok) {
  // sempre limpa classes visuais
  li.classList.remove("rules-ok", "rules-hidden");

  if (ok) {
    // marca como OK
    li.classList.add("rules-ok");

    // esconde suavemente
    setTimeout(() => {
      li.classList.add("rules-hidden");
    }, 120); // espera a cor aplicar antes de sumir
  }
}

senhaInput.addEventListener("input", () => {
  const senha = senhaInput.value;

  const temMaiuscula  = /[A-Z]/.test(senha);
  const temMinuscula  = /[a-z]/.test(senha);
  const temNumero     = /\d/.test(senha);
  const temEspecial = /[^A-Za-z0-9]/.test(senha);
  const tamanhoValido = senha.length >= 8;

  toggleRule(ruleLength, tamanhoValido);
  toggleRule(ruleUpper,  temMaiuscula);
  toggleRule(ruleLower,  temMinuscula);
  toggleRule(ruleNumber, temNumero);
  toggleRule(ruleSpecial, temEspecial);
});

// 1. Seleciona o elemento do cabeçalho
const mainHeader = document.querySelector(".main-header"); // <--- ADICIONE ISSO AQUI

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
  // 2. Adiciona a classe no cabeçalho também
  mainHeader.classList.add("sign-up-mode"); // <--- E ISSO AQUI
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
  // 3. Remove a classe do cabeçalho
  mainHeader.classList.remove("sign-up-mode"); // <--- E ISSO AQUI
});

/* =========================================
   ALTERNÂNCIA DE TEMA (DARK MODE)
   ========================================= */
const themeToggle = document.querySelector('.theme-toggle');
// Verifica se o botão existe antes de rodar o script (evita erros em outras telas)
if (themeToggle) {
    let isMoon = true;

    // Ícones SVG (Strings)
    const sunIcon = `<svg class="icon sun" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M58.57,25.81c-2.13-3.67-0.87-8.38,2.8-10.51s8.38-0.88,10.51,2.8l9.88,17.1c2.13,3.67.87,8.38-2.8,10.51s-8.38.88-10.51-2.8l-9.88-17.1zM120,51.17c19.01,0,36.21,7.7,48.67,20.16S188.83,101,188.83,120s-7.7,36.21-20.16,48.67S139.01,188.83,120,188.83s-36.21-7.7-48.67-20.16S51.17,139.01,51.17,120s7.7-36.21,20.16-48.67S101,51.17,120,51.17zM158.27,81.73c-9.79-9.79-23.32-15.85-38.27-15.85s-28.48,6.06-38.27,15.85S65.88,105.05,65.88,120s6.06,28.48,15.85,38.27S105.05,174.12,120,174.12s28.48-6.06,38.27-15.85S174.12,134.95,174.12,120s-6.06-28.48-15.85-38.27zM113.88,7.71a7.71,7.71,0,1,1,15.42,0v19.75a7.71,7.71,0,1,1-15.42,0V7.71zM170.87,19.72a7.71,7.71,0,0,1,13.31,7.65l-9.88,17.1a7.71,7.71,0,0,1-13.31-7.65l9.88-17.1zM214.19,58.57a7.71,7.71,0,1,1,7.71,13.31l-17.1,9.88a7.71,7.71,0,0,1-7.71-13.31l17.1-9.88zM232.29,113.88a7.71,7.71,0,1,1,0,15.42h-19.75a7.71,7.71,0,1,1,0-15.42h19.75zM220.28,170.87a7.71,7.71,0,0,1-7.65,13.31l-17.1-9.88a7.71,7.71,0,0,1,7.65-13.31l17.1,9.88zM181.43,214.19a7.71,7.71,0,1,1-13.31,7.65l-9.88-17.1a7.71,7.71,0,1,1,13.31-7.65l9.88,17.1zM126.12,232.29a7.71,7.71,0,1,1-15.42,0v-19.75a7.71,7.71,0,1,1,15.42,0v19.75zM69.13,220.28a7.71,7.71,0,1,1-13.31-7.65l9.88-17.1a7.71,7.71,0,1,1,13.31,7.65l-9.88,17.1zM25.81,181.43a7.71,7.71,0,1,1-7.71-13.31l17.1-9.88a7.71,7.71,0,1,1,7.71,13.31l-17.1,9.88zM7.71,126.12a7.71,7.71,0,1,1,0-15.42h19.75a7.71,7.71,0,1,1,0,15.42H7.71zM19.72,69.13a7.71,7.71,0,0,1,7.65-13.31l17.1,9.88a7.71,7.71,0,1,1-7.65,13.31l-17.1-9.88z"/></svg>`;
    const moonIcon = `<svg class="icon moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="24px" height="24px" fill="currentColor">  <path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z"/></svg>`;

    // Checa localStorage ao carregar
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = sunIcon;
        isMoon = false;
    } else {
        themeToggle.innerHTML = moonIcon;
    }

    // Evento de Clique
    themeToggle.addEventListener('click', () => {
        const icon = themeToggle.querySelector('.icon');
        
        // 1. Inicia animação de saída
        icon.classList.add('spin');

        // 2. Alterna o tema no body
        document.body.classList.toggle('dark-mode');
        const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);

        // 3. Troca o ícone no meio da animação
        setTimeout(() => {
            themeToggle.innerHTML = isMoon ? sunIcon : moonIcon;
            isMoon = !isMoon;
            
            // Pega o NOVO ícone que acabou de ser inserido
            const newIcon = themeToggle.querySelector('.icon');
            newIcon.classList.add('spin-reverse'); // Animação de entrada
        }, 350);

        // 4. Limpa as classes de animação para o próximo clique
        setTimeout(() => {
            const currentIcon = themeToggle.querySelector('.icon');
            if(currentIcon) {
                currentIcon.classList.remove('spin', 'spin-reverse');
            }
        }, 900);
    });
}

document.querySelectorAll(".toggle-password").forEach(icon => {
  icon.addEventListener("click", () => {
    const input = document.getElementById(icon.dataset.target);

    // fade out
    icon.classList.add("fading");

    setTimeout(() => {
      const isPassword = input.type === "password";

      input.type = isPassword ? "text" : "password";

      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");

      // fade in
      icon.classList.remove("fading");
    }, 100); // tempo da animação
  });
});
