from flask import Blueprint, request, current_app, redirect, jsonify, session
from app.services.upload_service import UploadService
from app.services.session_service import SessionService

upload_bp = Blueprint("upload", __name__)

def init_upload_service(app):
    """
    Inicializa o serviço de upload e registra no app.
    """
    mongo = app.extensions["mongo_client"]
    cfg = app.config

    app.extensions["upload_service"] = UploadService(
        mongo,
        cfg["UPLOAD_FOLDER"],
        cfg["ALLOWED_EXTENSIONS"]
    )

@upload_bp.route("/avatar", methods=["POST"])
def upload_avatar():
    """
    Faz upload do avatar do usuário logado.
    Retorna JSON com sucesso ou erro.
    """
    if not SessionService.is_logged():
        return jsonify({"ok": False, "error": "unauthorized"}), 401

    file = request.files.get("file")

    upload_service: UploadService = current_app.extensions["upload_service"]
    result = upload_service.save_avatar(SessionService.get_id(), file)

    if result.get("ok"):
        session["profile_pic"] = result["filename"]
        session.modified = True 

    return jsonify(result)

@upload_bp.route("/avatar/<user_id>")
def get_avatar(user_id):
    """
    Retorna o avatar do usuário.
    Se não tiver, redireciona para a imagem padrão.
    """
    upload_service: UploadService = current_app.extensions["upload_service"]
    url = upload_service.get_avatar_path(user_id)

    if not url:
        # Se não tiver avatar, manda para a imagem padrão
        return redirect("/static/images/default.png")

    return redirect(url)