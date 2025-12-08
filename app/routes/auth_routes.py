from flask import Blueprint, render_template, request, redirect, url_for, current_app
from app.services.auth_service import AuthService
from app.services.session_service import SessionService

auth_bp = Blueprint("auth", __name__)

def init_auth_service(app):
    """
    Inicializa o serviço de autenticação (AuthService) e o registra
    nas extensões da aplicação Flask.
    """

    mongo = app.extensions["mongo_client"]
    app.extensions["auth_service"] = AuthService(mongo)

@auth_bp.route("/login", methods=["GET"])
def login_page():
    """
    Exibe a página de login.
    """

    return render_template("login.html")


@auth_bp.route("/login", methods=["POST"])
def login_post():
    """
    Processa o envio do formulário de login, validando as credenciais
    do usuário e iniciando a sessão caso o login seja bem-sucedido.
    """
    email = request.form.get("email")
    senha = request.form.get("senha")

    auth_service: AuthService = current_app.extensions["auth_service"]
    user = auth_service.authenticate(email, senha)

    if not user:
        return render_template("login.html", erro_login="Credenciais inválidas")

    SessionService.login(user)

    if user.get("mfa_enabled"):
        return redirect(url_for("mfa.verify_page"))

    return redirect(url_for("page.dashboard"))

@auth_bp.route("/register", methods=["POST"])
def register_post():
    """
    Processa o registro de um novo usuário e inicia sua sessão caso o
    cadastro seja realizado com sucesso.
    """

    usuario = request.form.get("usuario")
    email = request.form.get("email")
    senha = request.form.get("senha")

    auth_service: AuthService = current_app.extensions["auth_service"]
    result = auth_service.create_user(usuario, email, senha)

    if not result["ok"]:
        return render_template("login.html", erro_register=result["error"], force_register=True)

    user = auth_service.get_user_by_id(result["user_id"])
    SessionService.login(user)

    return redirect(url_for("mfa.enroll_page"))

@auth_bp.route("/logout")
def logout():
    """
    Encerra a sessão do usuário e redireciona para a página de login.
    """
    SessionService.logout()
    return redirect(url_for("auth.login_page"))
