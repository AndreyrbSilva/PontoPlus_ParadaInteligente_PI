import time
import math
import requests
from flask_compress import Compress
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import os

# ------------------------------------
# Configuração básica do Flask
# ------------------------------------
app = Flask(__name__)
CORS(app)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(days=30)
Compress(app)

# ------------------------------------
# Configurações (ambiente / padrão)
# ------------------------------------
OSRM_HOST = os.getenv("OSRM_HOST", "https://router.project-osrm.org")
OSRM_TABLE_MAX = int(os.getenv("OSRM_TABLE_MAX", "95"))

# ------------------------------------
# Conexão com o MongoDB
# ------------------------------------
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://PontoPlus:txcYW0zUnClvs7TN@pontoplus.v7tiqaf.mongodb.net/?retryWrites=true&w=majority&appName=PontoPlus"
)
client = MongoClient(MONGO_URI)
db = client["PontoPlus"]

# ------------------------------------
# Helpers
# ------------------------------------
def fmt_coord(coord):
    lon, lat = float(coord[0]), float(coord[1])
    return f"{lon:.6f},{lat:.6f}"

def safe_request_get(url, timeout=10):
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        return {"_request_error": str(e), "status_code": getattr(e.response, "status_code", None)}

# ------------------------------------
# Função unificada ETA (mantida)
# ------------------------------------
def calcular_eta(posicao_atual, paradas, usar_table=True):
    if not posicao_atual or not isinstance(posicao_atual, (list, tuple)) or len(posicao_atual) < 2:
        return {"erro": "Posição atual inválida"}

    hora_agora = datetime.now()

    # tenta usar API /table
    if usar_table and len(paradas) > 1 and len(paradas) + 1 <= OSRM_TABLE_MAX:
        coords_list = [posicao_atual] + paradas
        coords = ";".join([fmt_coord(c) for c in coords_list])
        url = f"{OSRM_HOST}/table/v1/driving/{coords}?sources=0"
        data = safe_request_get(url, timeout=12)

        if "_request_error" not in data:
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

    # fallback rota-a-rota
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

# ------------------------------------
# Novo cálculo ETA baseado em coords IoT
# ------------------------------------
@app.route("/api/eta_from_coords", methods=["POST"])
def eta_from_coords():
    try:
        data = request.get_json(force=True)

        pos = data.get("position")
        if not pos or "lat" not in pos or "lng" not in pos:
            return jsonify({"erro": "position {lat,lng} é obrigatório"}), 400

        posicao_atual = [float(pos["lng"]), float(pos["lat"])]

        # Obtém a(s) parada(s)
        stops = []
        if "next_stop" in data and isinstance(data["next_stop"], dict):
            s = data["next_stop"]
            if "lat" in s and "lng" in s:
                stops.append([float(s["lng"]), float(s["lat"])])

        elif "stops" in data and isinstance(data["stops"], list):
            for s in data["stops"]:
                if "lat" in s and "lng" in s:
                    stops.append([float(s["lng"]), float(s["lat"])])

        if not stops:
            return jsonify({"erro": "Envie next_stop ou stops corretamente."}), 400

        usar_table = data.get("usar_table", True)

        # Chamar cálculo ETA
        etas = calcular_eta(posicao_atual, stops, usar_table=usar_table)

        if isinstance(etas, dict) and "erro" in etas:
            return jsonify(etas), 500

        # Identifica a próxima parada (menor duração)
        proxima_parada = min(
            etas,
            key=lambda x: x["duracao_segundos"] if x["duracao_segundos"] is not None else 999999
        )

        resultado = {
            "requested_at": datetime.now().isoformat(),
            "position": pos,
            "etas": etas,
            "proxima_parada": proxima_parada
        }

        return jsonify(resultado)

    except Exception as e:
        print("Erro no novo cálculo ETA:", repr(e))
        return jsonify({"erro": "Erro interno", "detalhes": str(e)}), 500

# ------------------------------------
# Endpoints básicos ainda mantidos (linhas, paradas, sensores...)
# ------------------------------------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/linhas")
def get_linhas():
    data = list(db.linhas.find({}, {"_id": 0}))
    return jsonify(data)

@app.route("/api/paradas_linha/<linha_ref>")
def get_paradas_linha(linha_ref):
    paradas = list(db.paradas.find({"linha_id": f"L{linha_ref}"}, {"_id": 0}))
    if not paradas:
        paradas = list(db.paradas.find({"linha_id": linha_ref}, {"_id": 0}))

    if not paradas:
        linha = db.linhas.find_one(
            {"$or": [{"numero_linha": int(linha_ref)}, {"linha_id": f"L{linha_ref}"}]},
            {"_id": 0}
        )
        if linha:
            paradas = list(db.paradas.find({"linha_id": linha["linha_id"]}, {"_id": 0}))

    for parada in paradas:
        loc = parada.get("localizacao", {})
        if isinstance(loc, dict):
            if "lat" in loc and "lng" in loc:
                parada["localizacao"] = {"coordinates": [loc["lng"], loc["lat"]]}
            elif "coordinates" not in loc and len(loc) == 2:
                parada["localizacao"] = {"coordinates": loc}

    return jsonify(paradas)

@app.route("/api/linha/<linha_id>")
def get_linha_by_id(linha_id):
    try:
        linha = db.linhas.find_one(
            {"$or": [{"linha_id": linha_id}, {"numero_linha": int(linha_id)}]},
            {"_id": 0}
        )
        if not linha:
            return jsonify({"erro": "Linha não encontrada"}), 404

        return jsonify(linha)

    except Exception as e:
        return jsonify({"erro": "Falha ao buscar linha", "detalhes": str(e)}), 500


# ------------------------------------
# Endpoint: Buscar ônibus por ID
# ------------------------------------
@app.route("/api/onibus/<onibus_id>")
def listar_onibus(onibus_id):
    try:
        doc = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
        if not doc:
            return jsonify({"erro": "Ônibus não encontrado"}), 404
        return jsonify(doc)
    except Exception as e:
        return jsonify({"erro": "Erro ao buscar ônibus", "detalhes": str(e)}), 500


# ------------------------------------
# Endpoint: Listar todos ônibus
# ------------------------------------
@app.route("/api/onibus")
def get_onibus():
    try:
        onibus_data = list(db.onibus.find({}, {"_id": 0}))
        enriched = []
    
        for onibus in onibus_data:
            linha = db.linhas.find_one(
                {
                    "$or": [
                        {"linha_id": onibus["linha_id"]},
                        {"numero_linha": onibus["linha_id"]}
                    ]
                },
                {"_id": 0}
            )

            if not linha:
                # Linha não encontrada no banco: evitar crash
                enriched.append({
                    "onibus_id": onibus["onibus_id"],
                    "name": onibus.get("name"),
                    "linha_id": onibus.get("linha_id"),
                    "linha_nome": "Não encontrada",
                    "modelo": onibus.get("modelo"),
                    "capacidade": onibus.get("capacidade"),
                    "status": onibus.get("status"),
                    "features": onibus.get("features"),
                    "tarifa": f"{float(onibus.get('tarifa', 0)):.2f}",
                    "tempo_estimado": None,
                    "prox_parada": "Indefinida"
                })
                continue

            # Buscar primeira parada dessa linha
            prox_parada = db.paradas.find_one(
                {
                    "$or": [
                        {"linha_id": linha.get("linha_id")},
                        {"linha_id": f"L{linha.get('numero_linha')}"}
                    ]
                },
                {"_id": 0}
            )

            enriched.append({
                "onibus_id": onibus["onibus_id"],
                "name": onibus.get("name"),
                "linha_id": linha.get("numero_linha"),
                "linha_nome": linha.get("nome"),
                "modelo": onibus.get("modelo"),
                "capacidade": onibus.get("capacidade"),
                "status": onibus.get("status"),
                "features": onibus.get("features"),
                "tarifa": f"{float(onibus.get('tarifa', 0)):.2f}",
                "tempo_estimado": None,
                "prox_parada": prox_parada.get("name") if prox_parada else "Não disponível"
            })

        return jsonify(enriched)

    except Exception as e:
        print("Erro no /api/onibus:", e)
        return jsonify({"erro": "Falha interna", "detalhes": str(e)}), 500

# ------------------------------------
# Endpoint: Receber dados do IoT (GPS do ônibus)
# ------------------------------------
@app.route("/api/update_gps", methods=["POST"])
def update_gps():
    try:
        data = request.get_json(force=True)
        onibus_id = data.get("onibus_id")
        lat = data.get("lat")
        lng = data.get("lng")
        velocidade = data.get("velocidade", None)
        horario = datetime.now().isoformat()

        if not onibus_id or lat is None or lng is None:
            return jsonify({"erro": "Campos obrigatórios: onibus_id, lat, lng"}), 400

        db.onibus.update_one(
            {"onibus_id": onibus_id},
            {
                "$set": {
                    "ultima_posicao": {
                        "lat": float(lat),
                        "lng": float(lng),
                        "velocidade": velocidade,
                        "horario": horario
                    }
                }
            },
            upsert=True
        )

        return jsonify({"status": "OK", "atualizado_em": horario})

    except Exception as e:
        return jsonify({"erro": "Erro ao atualizar GPS", "detalhes": str(e)}), 500


# ------------------------------------
# Endpoint: buscar sensores
# ------------------------------------
@app.route("/api/sensores")
def get_sensores():
    try:
        dados = list(db.sensores.find({}, {"_id": 0}))
        return jsonify(dados)
    except Exception as e:
        return jsonify({"erro": "Erro ao obter sensores", "detalhes": str(e)}), 500


# ------------------------------------
# Cache estático / headers
# ------------------------------------
@app.after_request
def add_headers(response):
    response.headers["Cache-Control"] = "public, max-age=3600"
    return response

# ------------------------------------
# Inicialização da API
# ------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)