import time
import math
import requests
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import os

# -------------------------------
# 🔹 Configuração básica do Flask
# -------------------------------
app = Flask(__name__)
CORS(app)

# -------------------------------
# 🔹 Configurações (ambiente / padrão)
# -------------------------------
# Se você estiver usando um OSRM local (ex: docker), defina OSRM_HOST no env:
# export OSRM_HOST="http://127.0.0.1:5000"
OSRM_HOST = os.getenv("OSRM_HOST", "https://router.project-osrm.org")
# OSRM costuma ter limites na /table (ex: ~100 coordenadas dependendo da build). 
# Defina um limite prudente:
OSRM_TABLE_MAX = int(os.getenv("OSRM_TABLE_MAX", "95"))

# -------------------------------
# 🔹 Conexão com o MongoDB Atlas
# -------------------------------
client = MongoClient(
    "mongo_uri"
)
db = client["PontoPlus"]

# -------------------------------
# 🔹 Página inicial
# -------------------------------
@app.route("/")
def home():
    return render_template("index.html")

# -------------------------------
# 🔹 Helpers
# -------------------------------
def fmt_coord(coord):
    """Garantir formato 'lon,lat' com casas decimais."""
    lon, lat = float(coord[0]), float(coord[1])
    return f"{lon:.6f},{lat:.6f}"

def safe_request_get(url, timeout=10):
    """Faz GET com tratamento para status e erros de rede."""
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        # devolve um dict padronizado para o chamador tratar
        return {"_request_error": str(e), "status_code": getattr(e.response, "status_code", None)}

# -------------------------------
# 🔹 Função unificada de ETA com OSRM
# -------------------------------
def calcular_eta(posicao_atual, paradas, usar_table=True):
    """
    Calcula ETA com OSRM usando a API /table (várias paradas) ou /route (uma parada).
    - posicao_atual: [lon, lat]
    - paradas: list of [lon, lat]
    - usar_table: tenta /table quando houver >1 parada e o número de pontos for aceitável
    Retorna lista de dicionários com eta, duracao_segundos, (opcional) distancia_km.
    Em caso de erro retorna dict {"erro": "mensagem"}.
    """
    if not posicao_atual or not isinstance(posicao_atual, (list, tuple)) or len(posicao_atual) < 2:
        return {"erro": "Posição atual inválida"}

    hora_agora = datetime.now()

    # Se muitas paradas -> não usar /table de uma vez só (OSRM pode recusar)
    if usar_table and len(paradas) > 1 and len(paradas) + 1 <= OSRM_TABLE_MAX:
        # API /table - Várias paradas, origem é índice 0
        coords_list = [posicao_atual] + paradas
        coords = ";".join([fmt_coord(c) for c in coords_list])
        # sources=0 (origem) ; destinations=1;2;3...
        url = f"{OSRM_HOST}/table/v1/driving/{coords}?sources=0"
        data = safe_request_get(url, timeout=12)

        if "_request_error" in data:
            # fallback para rota por parada se /table falhar
            # retornar erro apenas se o fallback também falhar
            pass
        else:
            # Esperamos 'durations' como matriz
            durations = data.get("durations")
            if durations and len(durations) > 0:
                # durations[0] corresponde às durações da origem para cada destino
                duracoes = durations[0]
                etas = []
                for idx, dur in enumerate(duracoes[1:], start=0):  # pular índice 0 (origem->origem)
                    # dur pode ser None se rota inválida
                    parada_coords = paradas[idx]
                    if dur is not None:
                        etas.append({
                            "parada_coords": parada_coords,
                            "eta": (hora_agora + timedelta(seconds=dur)).isoformat(),
                            "duracao_segundos": dur
                        })
                    else:
                        etas.append({
                            "parada_coords": parada_coords,
                            "eta": None,
                            "duracao_segundos": None,
                            "erro": "rota_indisponivel"
                        })
                return etas
            # se não houver 'durations', vamos tentar fallback abaixo

    # Se chegou aqui: usar /route por parada (ou /table foi rejeitado)
    etas = []
    for parada in paradas:
        coords = f"{fmt_coord(posicao_atual)};{fmt_coord(parada)}"
        url = f"{OSRM_HOST}/route/v1/driving/{coords}?overview=false"
        data = safe_request_get(url, timeout=8)

        if "_request_error" in data:
            etas.append({
                "parada_coords": parada,
                "eta": None,
                "duracao_segundos": None,
                "erro": f"request_error: {data['_request_error']}"
            })
            continue

        routes = data.get("routes")
        if not routes:
            etas.append({
                "parada_coords": parada,
                "eta": None,
                "duracao_segundos": None,
                "erro": "nenhuma_rota"
            })
            continue

        rota = routes[0]
        duracao = rota.get("duration")
        distancia = rota.get("distance")
        etas.append({
            "parada_coords": parada,
            "eta": (hora_agora + timedelta(seconds=duracao)).isoformat() if duracao is not None else None,
            "duracao_segundos": duracao,
            "distancia_km": round(distancia / 1000, 2) if distancia is not None else None
        })

    return etas

# -------------------------------
# 🔹 Endpoint: ônibus com info da linha (SEM cálculo ETA aqui)
# -------------------------------
@app.route("/api/onibus")
def get_onibus():
    onibus_data = list(db.onibus.find({}, {"_id": 0}))
    enriched = []

    for onibus in onibus_data:
        linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
        if not linha:
            continue

        prox_parada = None
        if linha.get("paradas"):
            prox_parada = db.paradas.find_one({"parada_id": linha["paradas"][0]}, {"_id": 0})

        enriched.append({
            "onibus_id": onibus["onibus_id"],
            "name": onibus["name"],
            "linha_id": linha.get("numero_linha"),
            "linha_nome": linha.get("nome"),
            "modelo": onibus["modelo"],
            "capacidade": onibus["capacidade"],
            "status": onibus["status"],
            "features": onibus["features"],
            "tempo_estimado": None,  # ETA só via /api/eta/<id>
            "prox_parada": prox_parada["name"] if prox_parada else "Não disponível"
        })

    return jsonify(enriched)

# -------------------------------
# 🔹 Endpoint ETA (usando função unificada OSRM)
# -------------------------------
eta_cache = {}  # Cache simples: {onibus_id: (timestamp, resultado)}

@app.route("/api/eta/<onibus_id>")
def get_eta(onibus_id):
    try:
        now = time.time()
        cache_entry = eta_cache.get(onibus_id)

        # Reutiliza cache por 30-60 segundos (aumentei responsividade)
        if cache_entry and now - cache_entry[0] < 60:
            return jsonify(cache_entry[1])

        onibus = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
        if not onibus:
            return jsonify({"erro": "Ônibus não encontrado"}), 404

        linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
        if not linha or not linha.get("paradas"):
            return jsonify({"erro": "Linha ou paradas não encontradas"}), 404

        # Coordenadas da posição atual do ônibus (espera-se [lon, lat])
        posicao_atual = onibus.get("localizacao", {}).get("coordinates")
        if not posicao_atual:
            return jsonify({"erro": "Posição do ônibus indisponível"}), 404

        # Coordenadas das paradas (ordem da linha)
        paradas = []
        for pid in linha["paradas"]:
            parada = db.paradas.find_one({"parada_id": pid}, {"_id": 0, "localizacao": 1})
            if parada and parada.get("localizacao", {}).get("coordinates"):
                paradas.append(parada["localizacao"]["coordinates"])

        if not paradas:
            return jsonify({"erro": "Nenhuma parada válida encontrada"}), 404

        # Se muitas paradas -> limitar para evitar rejeição do OSRM ou chunkar
        if len(paradas) + 1 > OSRM_TABLE_MAX:
            # Estratégia simples: só considera as N paradas mais próximas em índices iniciais
            paradas = paradas[: (OSRM_TABLE_MAX - 1)]

        # Chama função unificada (usa /table se houver múltiplas paradas)
        etas = calcular_eta(posicao_atual, paradas, usar_table=True)

        if isinstance(etas, dict) and "erro" in etas:
            return jsonify(etas), 500

        resultado = {
            "onibus_id": onibus_id,
            "linha_id": linha.get("numero_linha"),
            "requested_at": datetime.now().isoformat(),
            "etas": etas
        }

        eta_cache[onibus_id] = (now, resultado)
        return jsonify(resultado)

    except requests.Timeout:
        return jsonify({"erro": "Tempo limite de requisição OSRM excedido"}), 504
    except Exception as e:
        # Log minimal local
        print("Erro ETA:", repr(e))
        return jsonify({"erro": "Erro interno ao calcular ETA", "detalhes": str(e)}), 500

# -------------------------------
# 🔹 Demais endpoints
# -------------------------------
@app.route("/api/linhas")
def get_linhas():
    data = list(db.linhas.find({}, {"_id": 0}))
    return jsonify(data)

@app.route("/api/paradas")
def get_paradas():
    data = list(db.paradas.find({}, {"_id": 0}))
    return jsonify(data)

@app.route("/api/sensores")
def get_sensores():
    data = list(db.sensores.find({}, {"_id": 0}))
    return jsonify(data)

# -------------------------------
# 🔹 Inicialização do servidor
# -------------------------------
if __name__ == "__main__":
    # Não deixe o '?' aqui — era só um typo no seu arquivo.
    app.run(debug=True)
