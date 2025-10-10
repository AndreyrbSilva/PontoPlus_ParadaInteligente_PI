from flask import Blueprint, jsonify

def bus_bp(bus_service, eta_service):
    """
    Define rotas relacionadas aos ônibus (/api/onibus e /api/eta).
    Recebe as dependências (services) via injeção.
    """
    bp = Blueprint("bus", __name__)

    @bp.route("/onibus")
    def get_onibus():
        """Retorna todos os ônibus cadastrados no sistema."""
        return jsonify(bus_service.get_all())

    @bp.route("/eta/<onibus_id>")
    def get_eta(onibus_id):
        """Retorna o ETA (tempo estimado de chegada) para um ônibus específico."""
        return jsonify(eta_service.get_eta(onibus_id))

    return bp
