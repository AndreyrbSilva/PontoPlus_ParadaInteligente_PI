from flask import Blueprint, request, current_app, redirect, jsonify
from app.services.upload_service import UploadService
from app.services.session_service import SessionService

upload_bp = Blueprint("upload", __name__)

def init_upload_service(app):
    mongo = app.extensions["mongo_client"]
    cfg = app.config

    app.extensions["upload_service"] = UploadService(
        mongo,
        cfg["UPLOAD_FOLDER"],
        cfg["ALLOWED_EXTENSIONS"]
    )

@upload_bp.route("/avatar", methods=["POST"])
def upload_avatar():
    if not SessionService.is_logged():
        return jsonify({"ok": False, "error": "unauthorized"}), 401

    file = request.files.get("file")

    upload_service: UploadService = current_app.extensions["upload_service"]
    result = upload_service.save_avatar(SessionService.get_id(), file)

    return jsonify(result)

@upload_bp.route("/avatar/<user_id>")
def get_avatar(user_id):
    upload_service: UploadService = current_app.extensions["upload_service"]
    url = upload_service.get_avatar_path(user_id)

    if not url:
        return jsonify({"ok": False, "error": "not_found"}), 404

    return redirect(url)