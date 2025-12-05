import io
import base64
from bson.objectid import ObjectId
import pyotp
import qrcode
from flask import Blueprint, current_app, render_template, request, redirect, url_for, session
from app.services.mfa_service import MfaService
from app.services.session_service import SessionService

mfa_bp = Blueprint("mfa", __name__)

def init_mfa_service(app):
    """
    Inicializa o serviço de MFA (Autenticação de Múltiplos Fatores) e o registra
    dentro da instância da aplicação Flask.
    """

    mongo = app.extensions["mongo_client"]
    app.extensions["mfa_service"] = MfaService(mongo)


def generate_qr(secret, email):
    """
    Gera um código QR em Base64 contendo a URI de configuração TOTP para uso em
    aplicativos autenticadores (Google Authenticator, Authy, etc.).
    """
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=email, issuer_name="PontoPlus")

    qr = qrcode.make(uri)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    qr_bytes = base64.b64encode(buf.getvalue()).decode("utf-8")
    return qr_bytes


@mfa_bp.route("/enroll", methods=["GET"])
def enroll_page():
    """
    Página inicial de ativação do MFA. Gera uma nova chave secreta, cria o QR Code
    correspondente e exibe o template de cadastro MFA.
    """

    if not SessionService.is_logged():
        return redirect(url_for("auth.login_page"))

    mfa_service: MfaService = current_app.extensions["mfa_service"]

    secret = mfa_service.generate_secret()
    session["tmp_mfa_secret"] = secret

    qr_img = generate_qr(secret, session.get("email"))

    return render_template("mfa_enroll.html", secret=secret, qr_img=qr_img)


@mfa_bp.route("/verify-enroll", methods=["POST"])
def verify_enroll():
    """
    Verifica o token informado pelo usuário durante o processo de ativação do MFA.
    Caso o código esteja correto, habilita o MFA para o usuário e gera códigos
    de recuperação.
    """

    if not SessionService.is_logged():
        return redirect(url_for("auth.login_page"))

    token = request.form.get("token")
    secret = session.get("tmp_mfa_secret")

    mfa_service: MfaService = current_app.extensions["mfa_service"]

    if not mfa_service.verify_token(secret, token):
        return render_template("mfa_enroll.html", error="Código inválido", secret=secret)

    recovery = mfa_service.generate_recovery_codes()
    user_id = session["user_id"]

    mfa_service.enable_mfa(ObjectId(user_id), secret, recovery)
    session.pop("tmp_mfa_secret")

    SessionService.complete_mfa()

    return render_template("mfa_recovery_codes.html", codes=recovery)


@mfa_bp.route("/verify", methods=["GET"])
def verify_page():
    """
    Página de verificação MFA exibida quando o usuário já possui MFA habilitado
    e precisa confirmar sua identidade usando token ou código de recuperação.
    """

    if not SessionService.is_logged():
        return redirect(url_for("auth.login_page"))

    return render_template("mfa_verify.html")

@mfa_bp.route("/verify", methods=["POST"])
def verify_post():
    """
    Processa o envio do token TOTP ou de um código de recuperação durante a
    verificação MFA.
    """

    token = request.form.get("token")
    recovery_code = request.form.get("recovery_code")

    mfa_service: MfaService = current_app.extensions["mfa_service"]
    user_id = session["user_id"]

    user = mfa_service.db.users.find_one({"_id": ObjectId(user_id)})

    if token:
        if mfa_service.verify_token(user["mfa_secret"], token):
            SessionService.complete_mfa()
            return redirect(url_for("page.dashboard"))
    elif recovery_code:
        if mfa_service.verify_recovery_code(ObjectId(user_id), recovery_code):
            SessionService.complete_mfa()
            return redirect(url_for("page.dashboard"))

    return render_template("mfa_verify.html", error="Código inválido")
