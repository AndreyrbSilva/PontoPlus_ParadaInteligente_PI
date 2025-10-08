from flask import Flask, request, jsonify
from datetime import datetime, timedelta
from pymongo import MongoClient
import requests
import threading

app = Flask(__name__)

# Configuração do MongoDB
client = MongoClient("mongodb_url")
db = client["sistema_onibus"]

# Host do servidor OSRM público
OSRM_HOST = "https://router.project-osrm.org"

def calcular_eta(posicao_atual, paradas):
    """
    Faz requisição direta à API OSRM /table para calcular tempo entre o ônibus e as paradas.
    """
    coords = f"{posicao_atual[0]},{posicao_atual[1]};" + ";".join(
        [f"{p[0]},{p[1]}" for p in paradas]
    )
    url = f"{OSRM_HOST}/table/v1/driving/{coords}?sources=0"
    response = requests.get(url)
    data = response.json()

    duracoes = data["durations"][0]
    hora_agora = datetime.now()

    etas = []
    for parada, dur in zip(paradas, duracoes):
        etas.append(
            {
                "parada_coords": parada,
                "eta": hora_agora + timedelta(seconds=dur),
                "duracao_segundos": dur,
            }
        )
    return etas


def salvar_eta(onibus_id, etas):
    """
    Salva ou atualiza previsões de chegada no MongoDB.
    """
    collection = db["etas"]
    for e in etas:
        collection.update_one(
            {"onibus_id": onibus_id, "parada_coords": e["parada_coords"]},
            {
                "$set": {
                    "eta": e["eta"],
                    "duracao_segundos": e["duracao_segundos"],
                    "atualizado_em": datetime.now(),
                }
            },
            upsert=True,
        )


def processar_eta(onibus_id, posicao_atual, paradas):
    """
    Calcula e salva ETAs em uma thread separada.
    """
    etas = calcular_eta(posicao_atual, paradas)
    salvar_eta(onibus_id, etas)

@app.route("/update_gps", methods=["POST"])
def atualizar_posicao():
    dados = request.get_json()
    sensor_id = dados.get("sensor_id")
    lat = dados.get("lat")
    lon = dados.get("lon")

    sensor = db.sensores.find_one({"sensor_id": sensor_id})
    if not sensor:
        return jsonify({"erro": "Sensor não encontrado"}), 404

    onibus = db.onibus.find_one({"onibus_id": sensor["onibus_id"]})
    if not onibus:
        return jsonify({"erro": "Ônibus não encontrado"}), 404

    linha = db.linhas.find_one({"linha_id": onibus["route_id"]})
    if not linha:
        return jsonify({"erro": "Linha não encontrada"}), 404

    paradas = [
        p["localizacao"]["coordinates"]
        for p in db.paradas.find({"parada_id": {"$in": linha["paradas"]}})
    ]
    posicao_atual = [lon, lat]

    thread = threading.Thread(
        target=processar_eta, args=(onibus["onibus_id"], posicao_atual, paradas)
    )
    thread.start()

    return jsonify({"status": "Processando ETA", "onibus_id": onibus["onibus_id"]})


@app.route("/eta/<int:onibus_id>", methods=["GET"])
def listar_etas(onibus_id):
    etas = list(db.etas.find({"onibus_id": onibus_id}, {"_id": 0}))
    return jsonify({"onibus_id": onibus_id, "etas": etas})


@app.route("/seed", methods=["POST"])
def seed_dados():
    """
    Popula o banco de dados com dados de exemplo (paradas, linha, ônibus e sensor)
    """
    db.onibus.delete_many({})
    db.linhas.delete_many({})
    db.paradas.delete_many({})
    db.sensores.delete_many({})

    paradas = [
        {"parada_id": 1, "name": "Parada A", "localizacao": {"type": "Point", "coordinates": [-46.6500, -23.5600]}, "status": "online", "ultima_manutencao": datetime.now()},
        {"parada_id": 2, "name": "Parada B", "localizacao": {"type": "Point", "coordinates": [-46.6550, -23.5650]}, "status": "online", "ultima_manutencao": datetime.now()},
        {"parada_id": 3, "name": "Parada C", "localizacao": {"type": "Point", "coordinates": [-46.6600, -23.5700]}, "status": "online", "ultima_manutencao": datetime.now()}
    ]
    db.paradas.insert_many(paradas)

    linha = {
        "linha_id": 1,
        "name": "Linha Centro - Bairro",
        "paradas": [1, 2, 3],
        "onibus": [1],
        "shape": {
            "type": "LineString",
            "coordinates": [[-46.6500, -23.5600], [-46.6550, -23.5650], [-46.6600, -23.5700]]
        }
    }
    db.linhas.insert_one(linha)

    onibus = {
        "onibus_id": 1,
        "name": "Ônibus 01",
        "modelo": "Mercedes",
        "capacidade": 50,
        "route_id": 1,
        "operadora_id": 101,
        "status": "ativo"
    }
    db.onibus.insert_one(onibus)

    sensor = {
        "sensor_id": 500,
        "tipo": "GPS",
        "onibus_id": 1,
        "instalado_em": datetime.now(),
        "status": "online"
    }
    db.sensores.insert_one(sensor)

    return jsonify({"status": "Banco populado com dados de exemplo."})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
