from datetime import datetime, timedelta
import random
from flask import Blueprint, current_app, jsonify, request
from app.services.osrm_service import OsrmService

bus_bp = Blueprint("bus", __name__, url_prefix="/api")

def gerar_horarios_aleatorios():
    """
    Gera hora_prevista e hora_real iguais ao app_antigo.py,
    garantindo atrasos diferentes por ônibus a cada requisição.
    """
    agora = datetime.now()
    min_previsto = random.randint(1, 20)         
    min_atraso = random.randint(-5, 15)           
    hora_prevista = agora + timedelta(minutes=min_previsto)
    hora_real = hora_prevista + timedelta(minutes=min_atraso)

    return hora_prevista.isoformat(), hora_real.isoformat()

@bus_bp.route("/onibus")
def get_buses():
    """
    Retorna lista de ônibus com atrasos RANDOMIZADOS
    exatamente como no app antigo.
    NADA é salvo no banco.
    Apenas leitura + enriquecimento.
    """

    mongo = current_app.extensions["mongo_client"]
    db = mongo["PontoPlus"]

    # filtros opcionais
    linha_id_filter = request.args.get("linha_id")
    status_filter = request.args.get("status")

    query = {}
    if linha_id_filter:
        query["linha_id"] = linha_id_filter
    if status_filter:
        query["status"] = status_filter

    onibus_data = list(db.onibus.find(query, {"_id": 0}))
    if not onibus_data:
        return jsonify([])

    enriched = []

    for o in onibus_data:

        linha = db.linhas.find_one({"linha_id": o.get("linha_id")}, {"_id": 0})
        if not linha:
            continue

        prox_parada_doc = db.paradas.find_one(
            {"linha_id": linha["linha_id"]},
            {"_id": 0, "name": 1}
        )

        hora_prevista, hora_real = gerar_horarios_aleatorios()

        enriched.append({
            **o,
            "linha_nome": linha.get("nome"),
            "linha_id": linha.get("numero_linha"),
            "linha_numero": linha.get("numero_linha"),
            "linha_codigo": linha.get("linha_id"),
            "prox_parada": prox_parada_doc.get("name") if prox_parada_doc else "Indefinido",
            "hora_prevista": hora_prevista,
            "hora_real": hora_real,
        })

    return jsonify(enriched)

@bus_bp.route("/onibus/<onibus_id>")
def get_bus_by_id(onibus_id):
    """Retorna um ônibus + linha."""
    mongo = current_app.extensions["mongo_client"]
    db = mongo["PontoPlus"]

    onibus = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
    if not onibus:
        return jsonify({"erro": "Ônibus não encontrado"}), 404

    linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})

    hora_prevista, hora_real = gerar_horarios_aleatorios()

    return jsonify({
        "onibus": {
            **onibus,
            "hora_prevista": hora_prevista,
            "hora_real": hora_real
        },
        "linha": linha
    })

@bus_bp.route("/eta/<onibus_id>")
def eta_for_bus(onibus_id):
    """
    Mantém a ETA separada (OSRM).
    Apenas reimplementado para SOLID.
    """
    mongo = current_app.extensions["mongo_client"]
    db = mongo["PontoPlus"]

    osrm: OsrmService = current_app.extensions["osrm_service"]

    eta_cache = current_app.extensions.setdefault("eta_cache", {})
    now = datetime.now().timestamp()

    cache_entry = eta_cache.get(onibus_id)
    if cache_entry and now - cache_entry["ts"] < 60:
        return jsonify(cache_entry["data"])

    onibus = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
    if not onibus:
        return jsonify({"erro": "Ônibus não encontrado"}), 404

    linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
    if not linha:
        return jsonify({"erro": "Linha não encontrada"}), 404

    loc = onibus.get("localizacao")
    if not loc or "lat" not in loc or "lng" not in loc:
        return jsonify({"erro": "posicao indisponível"}), 404

    pos = (loc["lng"], loc["lat"])

    paradas = []
    for p in db.paradas.find({"linha_id": linha["linha_id"]}, {"_id": 0, "localizacao": 1}):
        coord = p.get("localizacao")
        if coord and "lat" in coord and "lng" in coord:
            paradas.append([coord["lng"], coord["lat"]])

    result = {
        "onibus_id": onibus_id,
        "linha_id": linha["linha_id"],
        "linha_numero": linha["numero_linha"],
        "etas": osrm.calculate_eta(pos, paradas)
    }

    eta_cache[onibus_id] = {"ts": now, "data": result}

    return jsonify(result)