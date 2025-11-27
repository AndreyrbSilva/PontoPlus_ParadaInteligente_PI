document.addEventListener('DOMContentLoaded', function() {
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    const inputs = document.querySelectorAll('.digit-input');
    const form = document.getElementById('mfaForm');
    const hiddenInput = document.getElementById('fullToken');

    inputs.forEach((input, index) => {
        // 1. Ao digitar um número
        // 1. Ao digitar um número
        input.addEventListener('input', (e) => {
            // --- NOVO: Remove qualquer caractere que NÃO seja número (letras, símbolos, etc) ---
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            // Se digitar mais de 1 numero, pega só o primeiro
            if (e.target.value.length > 1) {
                e.target.value = e.target.value.slice(0, 1); 
            }
            
            // Se digitou algo válido (que sobrou depois da limpeza), pula pro próximo
            if (e.target.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // Se for o último (índice 5), junta tudo e envia
                    submitForm();
                }
            }
        });

        // 2. Lógica para o Backspace (voltar foco ao apagar)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        // 3. Lógica para Colar (Paste) - Usuário cola "123456"
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            // Pega o texto da área de transferência
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            // Limpa espaços e pega só os primeiros 6 caracteres
            const cleanData = pasteData.replace(/\D/g,'').slice(0, 6).split('');

            cleanData.forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    // Foca no input seguinte ou no último preenchido
                    if (i < inputs.length - 1) inputs[i + 1].focus();
                }
            });

            // Se colou os 6 números completos, envia
            if (cleanData.length === 6) {
                submitForm();
            }
        });
    });

    function submitForm() {
        let token = '';
        inputs.forEach(input => token += input.value);
        
        hiddenInput.value = token; // Joga os 6 números no input hidden
        
        // Validação final: só envia se tiver 6 dígitos
        if(token.length === 6) {
            // Pequeno delay visual para o usuário ver o último número antes de enviar
            setTimeout(() => {
                form.submit();
            }, 300); 
        }
    }
});