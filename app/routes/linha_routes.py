from flask import Blueprint, jsonify, current_app, request

linha_bp = Blueprint("linha", __name__, url_prefix="/api")

@linha_bp.route("/linhas")
def get_linhas():
    mongo = current_app.extensions["mongo_client"]
    db = mongo["PontoPlus"]

    data = list(db.linhas.find({}, {"_id": 0}))
    return jsonify(data)


@linha_bp.route("/paradas_linha/<linha_ref>")
def get_paradas_linha(linha_ref):
    mongo = current_app.extensions["mongo_client"]
    db = mongo["PontoPlus"]

    sentido = request.args.get("sentido")

    linha = db.linhas.find_one(
        {
            "$or": [
                {"linha_id": linha_ref},
                {"linha_id": f"L{linha_ref}"},
                {"numero_linha": int(linha_ref) if linha_ref.isdigit() else None}
            ]
        },
        {"_id": 0}
    )

    if not linha:
        return jsonify({"erro": "Linha não encontrada"}), 404

    linha_id = linha["linha_id"]

    if sentido in ("ida", "volta"):
        if "paradas" not in linha or sentido not in linha["paradas"]:
            return jsonify([])

        lista_ids = linha["paradas"][sentido]

        docs = list(db.paradas.find(
            {"linha_id": linha_id, "sentido": sentido},
            {"_id": 0}
        ))

        mapa = {p["parada_id"]: p for p in docs}

        resultado = [mapa[i] for i in lista_ids if i in mapa]

        return jsonify(resultado)

    docs = list(db.paradas.find({"linha_id": linha_id}, {"_id": 0}))
    return jsonify(docs)

@linha_bp.route("/linha/<linha_id>")
def get_linha_by_id(linha_id):
    mongo = current_app.extensions["mongo_client"]
    db = mongo["PontoPlus"]

    linha = db.linhas.find_one({"linha_id": linha_id}, {"_id": 0})
    if not linha:
        return jsonify({"erro": "Linha não encontrada"}), 404

    return jsonify(linha)