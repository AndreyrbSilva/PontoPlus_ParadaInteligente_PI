import time
import math
import requests
from flask_compress import Compress
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import os

# -------------------------------
# Configuração básica do Flask
# -------------------------------
app = Flask(__name__)
CORS(app)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(days=30)
Compress(app)

# -------------------------------
# Configurações (ambiente / padrão)
# -------------------------------
OSRM_HOST = os.getenv("OSRM_HOST", "https://router.project-osrm.org")
OSRM_TABLE_MAX = int(os.getenv("OSRM_TABLE_MAX", "95"))

# -------------------------------
# Conexão com o MongoDB
# -------------------------------
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://PontoPlus:MlMLKNXPkpYBbNgP@pontoplus.v7tiqaf.mongodb.net/?retryWrites=true&w=majority&appName=PontoPlus"
)
client = MongoClient(MONGO_URI)
db = client["PontoPlus"]

# -------------------------------
# Páginas
# -------------------------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/onibus/<onibus_id>")
def onibus_page(onibus_id):
    return render_template("onibus.html", onibus_id=onibus_id)

# -------------------------------
# Helpers
# -------------------------------
def fmt_coord(coord):
    """Garante formato lon,lat com casas decimais."""
    lon, lat = float(coord[0]), float(coord[1])
    return f"{lon:.6f},{lat:.6f}"

def safe_request_get(url, timeout=10):
    """Requisição GET com tratamento de erro."""
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        return {"_request_error": str(e), "status_code": getattr(e.response, "status_code", None)}

# -------------------------------
# Função unificada ETA (OSRM)
# -------------------------------
def calcular_eta(posicao_atual, paradas, usar_table=True):
    if not posicao_atual or not isinstance(posicao_atual, (list, tuple)) or len(posicao_atual) < 2:
        return {"erro": "Posição atual inválida"}

    hora_agora = datetime.now()

    if usar_table and len(paradas) > 1 and len(paradas) + 1 <= OSRM_TABLE_MAX:
        coords_list = [posicao_atual] + paradas
        coords = ";".join([fmt_coord(c) for c in coords_list])
        url = f"{OSRM_HOST}/table/v1/driving/{coords}?sources=0"
        data = safe_request_get(url, timeout=12)

        if "_request_error" in data:
            pass
        else:
            durations = data.get("durations")
            if durations and len(durations) > 0:
                duracoes = durations[0]
                etas = []
                for idx, dur in enumerate(duracoes[1:], start=0):
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

    # fallback: rota por rota
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
# Endpoint: ônibus com info da linha
# -------------------------------
@app.route("/api/onibus")
def get_onibus():
    onibus_data = list(db.onibus.find({}, {"_id": 0}))
    enriched = []

    for onibus in onibus_data:
        linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
        if not linha:
            continue

        prox_parada = db.paradas.find_one({"linha_id": linha["linha_id"]}, {"_id": 0})

        enriched.append({
            "onibus_id": onibus["onibus_id"],
            "name": onibus["name"],
            "linha_id": linha.get("numero_linha"),
            "linha_nome": linha.get("nome"),
            "modelo": onibus.get("modelo"),
            "capacidade": onibus.get("capacidade"),
            "status": onibus.get("status"),
            "features": onibus.get("features"),
            "tarifa": f"{float(onibus.get('tarifa', 0)):.2f}",
            "tempo_estimado": None,
            "prox_parada": prox_parada["name"] if prox_parada else "Não disponível"
        })

    return jsonify(enriched)

# -------------------------------
# Endpoint ETA (OSRM)
# -------------------------------
eta_cache = {}

@app.route("/api/eta/<onibus_id>")
def get_eta(onibus_id):
    try:
        now = time.time()
        cache_entry = eta_cache.get(onibus_id)
        if cache_entry and now - cache_entry[0] < 60:
            return jsonify(cache_entry[1])

        onibus = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
        if not onibus:
            return jsonify({"erro": "Ônibus não encontrado"}), 404

        linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
        if not linha:
            return jsonify({"erro": "Linha não encontrada"}), 404

        loc = onibus.get("localizacao", {})
        if "coordinates" in loc:
            posicao_atual = loc["coordinates"]
        elif "lat" in loc and "lng" in loc:
            posicao_atual = [loc["lng"], loc["lat"]]
        else:
            return jsonify({"erro": "Posição do ônibus indisponível"}), 404

        paradas = []
        for parada in db.paradas.find({"linha_id": linha["linha_id"]}, {"_id": 0, "localizacao": 1}):
            coords = parada.get("localizacao")
            if coords and "lat" in coords and "lng" in coords:
                paradas.append([coords["lng"], coords["lat"]])

        if not paradas:
            return jsonify({"erro": "Nenhuma parada válida encontrada"}), 404

        if len(paradas) + 1 > OSRM_TABLE_MAX:
            paradas = paradas[: (OSRM_TABLE_MAX - 1)]

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
        print("Erro ETA:", repr(e))
        return jsonify({"erro": "Erro interno ao calcular ETA", "detalhes": str(e)}), 500

# -------------------------------
# Demais endpoints
# -------------------------------
@app.route("/api/linhas")
def get_linhas():
    data = list(db.linhas.find({}, {"_id": 0}))
    return jsonify(data)

@app.route("/api/paradas_linha/<linha_ref>")
def get_paradas_linha(linha_ref):
    """
    Retorna as paradas de uma linha.
    Aceita tanto '116' quanto 'L116' como referência.
    """
    # 1️⃣ Tenta buscar diretamente com e sem o prefixo "L"
    paradas = list(db.paradas.find({"linha_id": f"L{linha_ref}"}, {"_id": 0}))
    if not paradas:
        paradas = list(db.paradas.find({"linha_id": linha_ref}, {"_id": 0}))

    # 2️⃣ Caso ainda não encontre, tenta buscar a linha correspondente
    if not paradas:
        linha = db.linhas.find_one(
            {"$or": [{"numero_linha": int(linha_ref)}, {"linha_id": f"L{linha_ref}"}]},
            {"_id": 0}
        )
        if linha:
            paradas = list(db.paradas.find({"linha_id": linha["linha_id"]}, {"_id": 0}))

    # 3️⃣ Corrige formato das coordenadas, se necessário
    for parada in paradas:
        loc = parada.get("localizacao", {})
        # Garante formato {"coordinates": [lon, lat]}
        if isinstance(loc, dict):
            if "lat" in loc and "lng" in loc:
                parada["localizacao"] = {"coordinates": [loc["lng"], loc["lat"]]}
            elif "coordinates" not in loc and len(loc) == 2:
                parada["localizacao"] = {"coordinates": loc}

    return jsonify(paradas)


@app.route("/api/linha/<linha_id>")
def get_linha_by_id(linha_id):
    """Retorna os dados completos de uma linha (com shape e paradas)."""
    try:
        linha = db.linhas.find_one({"linha_id": linha_id}, {"_id": 0})
        if not linha:
            return jsonify({"erro": "Linha não encontrada"}), 404
        return jsonify({"linha": linha})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route("/api/sensores")
def get_sensores():
    data = list(db.sensores.find({}, {"_id": 0}))
    return jsonify(data)

@app.route("/api/onibus/<onibus_id>")
def get_onibus_by_id(onibus_id):
    onibus = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
    if not onibus:
        return jsonify({"erro": "Ônibus não encontrado"}), 404
    linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
    return jsonify({"onibus": onibus, "linha": linha})

# -------------------------------
# Cache e headers
# -------------------------------
@app.after_request
def add_cache_headers(response):
    if response.content_type.startswith('text/html'):
        response.cache_control.max_age = 300
        response.cache_control.public = True
    return response

# -------------------------------
# Inicialização do servidor
# -------------------------------
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
