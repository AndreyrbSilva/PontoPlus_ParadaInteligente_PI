# 🚌 PontoPlus — Sistema de Parada Inteligente

O PontoPlus é um protótipo em desenvolvimento de parada inteligente IoT, criado para simular o funcionamento de um sistema de transporte público conectado.
Ele permite visualizar o tempo estimado de chegada (ETA) dos ônibus em tempo real, integrando:

- Backend: Flask
- Banco de dados: MongoDB Atlas
- Interface: Web interativa com simulação de dados IoT

O projeto combina monitoramento de frotas, coleta de dados de sensores IoT e simulação de ETA, oferecendo insights iniciais para mobilidade urbana inteligente.

---

## 🧭 Visão Geral

O PontoPlus foi pensado como uma solução de mobilidade urbana conectada, com foco em:

- Monitoramento de frotas de ônibus em tempo real
- Coleta e análise de dados de sensores IoT
- Simulação de tempo estimado de chegada em pontos de ônibus
- Experiência interativa para usuários e gestores de transporte

O objetivo é demonstrar como tecnologias IoT e web podem se integrar para otimizar a experiência de passageiros e a gestão de transporte público.

---

## 🚍 Objetivo do Projeto

Desenvolver um **sistema de parada inteligente** que:

- Mostre o tempo estimado de chegada dos ônibus (ETA);
- Permita rastrear veículos e paradas via coordenadas geográficas;
- Simule o comportamento de sensores IoT (GPS, DHT11, LDR, Ultrassom);
- Utilize uma arquitetura moderna com API, banco em nuvem e front-end web.

---

## 🧩 Arquitetura do Sistema

[Sensores IoT Simulados] → [API Flask] → [MongoDB Atlas] → [Front-end Web]
| Camada | Função | Tecnologias |
|--------|--------|--------------|
| **Sensores IoT (simulados)** | Geração de dados de localização e status | JS / Simulação |
| **Backend (API Flask)** | Processa requisições e acessa o banco MongoDB | Python / Flask |
| **Banco de Dados (MongoDB Atlas)** | Armazena ônibus, linhas, paradas e sensores | MongoDB Cloud |
| **Front-end Web** | Interface de usuário, exibição de ETA e mapas | HTML / CSS / JS |

---

## 💾 Estrutura do Banco de Dados

O banco é hospedado no **MongoDB Atlas** e contém as coleções principais:

### 🚌 Coleção: `onibus`
Armazena informações de cada veículo.

| Campo | Tipo | Descrição |
|--------|------|-----------|
| `onibus_id` | String | Identificador único |
| `name` | String | Nome ou número do veículo |
| `modelo` | String | Modelo físico |
| `capacidade` | Int | Capacidade máxima |
| `route_id` | String | Referência da linha |
| `operadora` | String | Empresa responsável |
| `status` | String | ativo / manutenção / inativo |
| `features` | Array | Ar-condicionado, acessibilidade, etc |

---

### 🛣️ Coleção: `linhas`
Define rotas e paradas associadas.

| Campo | Tipo | Descrição |
|--------|------|-----------|
| `linha_id` | String | Identificador único |
| `name` | String | Nome da linha |
| `paradas` | Array | IDs das paradas |
| `onibus` | Array | IDs dos ônibus |
| `shape` | GeoJSON | Trajeto geográfico (LineString) |

---

### 🚏 Coleção: `paradas`
Representa cada ponto de parada inteligente.

| Campo | Tipo | Descrição |
|--------|------|-----------|
| `parada_id` | String | Identificador único |
| `name` | String | Nome da parada |
| `localizacao` | GeoJSON | Coordenadas (latitude, longitude) |
| `status` | String | online / offline |
| `ultima_manutencao` | Date | Data da última manutenção |

---

### 📡 Coleção: `sensores`
Registra os sensores físicos ou simulados.

| Campo | Tipo | Descrição |
|--------|------|-----------|
| `sensor_id` | String | Identificador único |
| `tipo` | String | GPS, DHT11, LDR, etc |
| `instalado_em` | String | Ônibus ou parada |
| `onibus_id` | String | Referência (opcional) |
| `status` | String | online / offline |

---

## ⚙️ Tecnologias Utilizadas

- **Backend:** Python 3, Flask, Requests  
- **Banco de Dados:** MongoDB Atlas (NoSQL, geoespacial)  
- **Frontend:** HTML5, CSS3, JavaScript  
- **APIs:** OSRM (Open Source Routing Machine)  
- **Outros:** JSON, Fetch API, Simulação de ETA  

---

## 🚀 Instalação e Execução

### 🔧 Pré-requisitos
- Python 3.10+  
- Conta no MongoDB Atlas  
- Variável de ambiente `MONGO_URI` configurada  

### 🧱 Passos de instalação

```bash
# 1. Clone o repositório
git clone https://github.com/AndreyrbSilva/PontoPlus_ParadaInteligente_PI.git
cd PontoPlus_ParadaInteligente_PI/PontoPlus_ParadaInteligente_PI

# 2. Crie um ambiente virtual
python -m venv venv
source venv/bin/activate  # (Linux/Mac)
venv\Scripts\activate     # (Windows)

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure as variáveis de ambiente
export MONGO_URI="sua_string_de_conexao_do_mongodb"

# 5. Execute o servidor Flask
python app.py

# O servidor iniciará em: http://127.0.0.1:5000
```

### 🔗 Endpoints da API

| Rota                    | Método | Descrição                          |
| ----------------------- | ------ | ---------------------------------- |
| `/api/onibus`           | GET    | Retorna lista de ônibus            |
| `/api/eta/<onibus_id>`  | GET    | Simula o tempo estimado de chegada |
| `/api/sensores`         | GET    | Lista sensores registrados         |
| `/api/sensores/leitura` | POST   | (Simulado) Envia leitura de sensor |

### 🖥️ Front-end e Simulação

🖥️ Front-end e Simulação

- O front-end (em templates/index.html e static/js/main.js) é responsável por:
- Consultar os dados via /api/onibus e /api/eta/...;
- Exibir os ônibus e seus tempos de chegada;
- Simular a contagem regressiva local (sem GPS real);
- Atualizar automaticamente a cada 30 segundos.

real

## 👨‍💻 Autores / Equipe

<table border="0" cellspacing="0" cellpadding="10">
  <tr>
    <td align="center" style="border: none; box-shadow: none;">
      <a href="https://github.com/AndreyrbSilva" target="_blank">
        <img src="https://github.com/AndreyrbSilva.png" width="100px" alt="Andrey Rodrigo"/><br>
        <sub><b>Andrey Rodrigo</b></sub>
      </a>
    </td>
    <td align="center" style="border: none; box-shadow: none;">
      <a href="https://github.com/MatheusDeSouza" target="_blank">
        <img src="https://github.com/MatheusDeSouza.png" width="100px" alt="Matheus de Souza"/><br>
        <sub><b>Matheus de Souza</b></sub>
      </a>
    </td>
  </tr>
</table>


