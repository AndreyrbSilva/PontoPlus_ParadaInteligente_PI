from flask import Blueprint, jsonify

def sensor_bp(repo):
    """
    Define rotas relacionadas aos sensores (/api/sensores).
    """
    bp = Blueprint("sensor", __name__)

    @bp.route("/sensores")
    def get_sensores():
        """Retorna todos os sensores cadastrados."""
        return jsonify(repo.list_sensores())

    return bp
