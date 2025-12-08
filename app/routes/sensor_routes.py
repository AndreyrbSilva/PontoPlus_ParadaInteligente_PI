from flask import Blueprint, jsonify, current_app

sensor_bp = Blueprint("sensor", __name__, url_prefix="/api")

@sensor_bp.route("/sensores")
def get_sensores():
    mongo = current_app.extensions["mongo_client"]
    db = mongo["PontoPlus"]

    data = list(db.sensores.find({}, {"_id": 0}))
    return jsonify(data)