from flask import Flask, jsonify, render_template
from faker import Faker
import random

app = Flask(__name__)
faker = Faker("pt_BR")

# --- Geração de dados falsos ---

def gerar_onibus():
    status = random.choice(["ativo", "manutencao", "inativo"])
    return {
        "onibus_id": faker.uuid4(),
        "name": faker.word().capitalize(),
        "modelo": random.choice(["Scania", "Volvo", "Marcopolo"]),
        "capacidade": random.randint(30, 80),
        "route_id": random.randint(100, 999),
        "operadora_id": random.randint(1, 10),
        "status": status
    }

def gerar_linha():
    return {
        "linha_id": faker.uuid4(),
        "name": faker.city(),
        "paradas": [faker.street_name() for _ in range(random.randint(3, 8))],
        "onibus": [gerar_onibus() for _ in range(random.randint(1, 3))],
        "shape": {
            "type": "LineString",
            "coordenadas": [
                [faker.latitude(), faker.longitude()] for _ in range(random.randint(3, 6))
            ]
        }
    }

def gerar_parada():
    return {
        "parada_id": faker.uuid4(),
        "name": faker.street_name(),
        "numeracao": random.randint(1000, 9999),
        "localizacao": {
            "type": "Point",
            "coordenadas": [faker.latitude(), faker.longitude()]
        },
        "status": random.choice(["online", "offline"]),
        "ultima_manutencao": faker.date_this_year().isoformat()
    }

def gerar_sensor():
    return {
        "sensor_id": faker.uuid4(),
        "tipo": random.choice(["GPS", "Temperatura", "Proximidade"]),
        "onibus_id": faker.uuid4(),
        "instalado_em": faker.date_this_decade().isoformat(),
        "status": random.choice(["online", "offline"])
    }

# --- Rotas da API ---

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/linhas")
def api_linhas():
    linhas = [gerar_linha() for _ in range(5)]
    return jsonify(linhas)

@app.route("/api/onibus")
def api_onibus():
    onibus = [gerar_onibus() for _ in range(8)]
    return jsonify(onibus)

@app.route("/api/paradas")
def api_paradas():
    paradas = [gerar_parada() for _ in range(10)]
    return jsonify(paradas)

@app.route("/api/sensores")
def api_sensores():
    sensores = [gerar_sensor() for _ in range(6)]
    return jsonify(sensores)

if __name__ == "__main__":
    app.run(debug=True)
