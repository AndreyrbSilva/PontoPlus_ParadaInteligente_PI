from flask import Blueprint, jsonify

def stop_bp(repo):
    """
    Define rotas relacionadas às paradas (/api/paradas).
    """
    bp = Blueprint("stop", __name__)

    @bp.route("/paradas")
    def get_paradas():
        """Retorna todas as paradas cadastradas."""
        return jsonify(repo.list_paradas())

    return bp
