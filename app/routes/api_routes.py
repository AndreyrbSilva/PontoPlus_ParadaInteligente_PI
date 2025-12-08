from flask import Blueprint, request, jsonify, current_app
from app.services.osrm_service import OsrmService
import random

api_bp = Blueprint("api", __name__)

@api_bp.route("/eta", methods=["POST"])
def calculate_eta():
    data = request.get_json()

    pos = data.get("posicao_atual")   # [lon, lat]
    paradas = data.get("paradas")     # [[lon, lat], ...]

    osrm: OsrmService = current_app.extensions["osrm_service"]

    eta = osrm.calculate_eta(tuple(pos), [tuple(p) for p in paradas])

    if eta is None:
        return jsonify({"ok": False, "eta": None}), 500

    return jsonify({"ok": True, "eta": eta})