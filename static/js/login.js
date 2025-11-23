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
  const temEspecial   = /[!@#$%¨&*();]/.test(senha);
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