document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Lógica do Tema (Dark/Light) ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    // --- 2. Seleção de Elementos ---
    const inputs = document.querySelectorAll('.digit-input');
    const form = document.getElementById('mfaForm');
    const hiddenInput = document.getElementById('fullToken');

    // [MELHORIA] Foca no primeiro input assim que a página carrega
    if (inputs.length > 0) {
        inputs[0].focus();
    }

    // --- 3. Lógica dos Inputs ---
    inputs.forEach((input, index) => {
        
        input.addEventListener('input', (e) => {
            // Remove letras/símbolos
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            // Garante apenas 1 dígito
            if (e.target.value.length > 1) {
                e.target.value = e.target.value.slice(0, 1); 
            }
            
            // Pula para o próximo
            if (e.target.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                } else {
                    // Se for o último, envia
                    submitForm();
                }
            }
        });

        // Lógica do Backspace (voltar ao apagar)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        // Lógica do Colar (Paste) - ex: colar "123456" direto
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData('text');
            const cleanData = pasteData.replace(/\D/g,'').slice(0, 6).split('');

            cleanData.forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    if (i < inputs.length - 1) inputs[i + 1].focus();
                }
            });

            if (cleanData.length === 6) {
                submitForm();
            }
        });
    });

    // --- 4. Função de Envio ---
    function submitForm() {
        let token = '';
        inputs.forEach(input => token += input.value);
        
        hiddenInput.value = token; 
        
        if(token.length === 6) {
            // Delay visual curto para ver o último número digitado
            setTimeout(() => {
                form.submit();
            }, 300); 
        }
    }
});