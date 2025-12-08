from flask import Blueprint, render_template, redirect, url_for
from app.services.session_service import SessionService

page_bp = Blueprint("page", __name__)

@page_bp.route("/")
def home():
    return render_template("login.html")

@page_bp.route("/dashboard")
def dashboard():
    if not SessionService.is_logged():
        return redirect(url_for("auth.login_page"))

    if not SessionService.is_mfa_verified():
        return redirect(url_for("mfa.verify_page"))

    return render_template("dashboard.html")

@page_bp.route("/painel")
def painel():
    return render_template("index.html")

@page_bp.route("/onibus/<onibus_id>")
def onibus_page(onibus_id):
    return render_template("onibus.html", onibus_id=onibus_id)