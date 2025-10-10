from flask import Blueprint, jsonify

def line_bp(repo):
    """
    Define rotas relacionadas às linhas (/api/linhas).
    """
    bp = Blueprint("line", __name__)

    @bp.route("/linhas")
    def get_linhas():
        """Retorna todas as linhas de ônibus cadastradas."""
        return jsonify(repo.list_linhas())

    return bp
