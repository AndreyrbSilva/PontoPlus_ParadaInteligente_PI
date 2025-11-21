import time
import math
import requests
from flask_compress import Compress
from flask import Flask, render_template, request, redirect, url_for, jsonify, session
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import os
import pyotp
import qrcode
import base64
import secrets
import io
from werkzeug.security import generate_password_hash, check_password_hash

# -------------------------------
# Configuração básica do Flask
# -------------------------------
app = Flask(__name__)
CORS(app)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = timedelta(days=30)
Compress(app)
app.secret_key = secrets.token_hex(32)

# -------------------------------
# Configurações (ambiente / padrão)
# -------------------------------
OSRM_HOST = os.getenv("OSRM_HOST", "https://router.project-osrm.org")
OSRM_TABLE_MAX = int(os.getenv("OSRM_TABLE_MAX", "95"))

# -------------------------------
# Conexão com o MongoDB
# -------------------------------
MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://PontoPlus:AhT9ANv3cDCI5yME@pontoplus.v7tiqaf.mongodb.net/?retryWrites=true&w=majority&appName=PontoPlus"
)
client = MongoClient(MONGO_URI)
db = client["PontoPlus"]

# -------------------------------
# Páginas
# -------------------------------
from flask import render_template, request, redirect, url_for

@app.route("/")
def login():
    # Página inicial agora é o login
    return render_template("login.html")

@app.route("/register", methods=["POST"])
def register():
    usuario = request.form.get("usuario")
    senha = request.form.get("senha")

    if db.users.find_one({"usuario": usuario}):
        return jsonify({"erro": "Usuário já existe"}), 400

    hash_pw = generate_password_hash(senha)

    db.users.insert_one({
        "usuario": usuario,
        "password": hash_pw,
        "mfa_enabled": False,
        "mfa_secret": None,
        "recovery_codes": []
    })

    # AUTO LOGIN + IR PARA O ENROLL
    session["usuario"] = usuario
    session["mfa_pending"] = True

    return redirect(url_for("mfa_enroll"))

@app.route("/login", methods=["POST"])
def fazer_login():
    usuario = request.form.get("usuario")
    senha = request.form.get("senha")
    user = db.users.find_one({"usuario": usuario})

    if not user or not check_password_hash(user["password"], senha):
        return render_template("login.html", erro="Usuário ou senha inválidos")

    # Login básico (sem Flask-Login)
    session["usuario"] = usuario

    # Se MFA estiver habilitada, exigir verificação
    if user.get("mfa_enabled"):
        session["mfa_pending"] = True
        return redirect(url_for("mfa_verify"))

    return redirect(url_for("dashboard"))

@app.route("/mfa/enroll")
def mfa_enroll():
    if "usuario" not in session:
        return redirect(url_for("login"))

    user = db.users.find_one({"usuario": session["usuario"]})

    secret = pyotp.random_base32()
    session["temp_secret"] = secret

    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(name=user["usuario"], issuer_name="PontoPlus")

    img = qrcode.make(uri)
    buf = io.BytesIO()
    img.save(buf, format='PNG')

    qr_base64 = base64.b64encode(buf.getvalue()).decode()

    return render_template("mfa_enroll.html", qr=qr_base64, secret=secret)

@app.route("/mfa/enroll/confirm", methods=["POST"])
def mfa_enroll_confirm():
    token = request.form.get("token")

    secret = session.get("temp_secret")
    if not secret:
        return redirect(url_for("mfa_enroll"))

    totp = pyotp.TOTP(secret)

    if not totp.verify(token):
        return "Código inválido", 400

    db.users.update_one(
        {"usuario": session["usuario"]},
        {"$set": {
            "mfa_enabled": True,
            "mfa_secret": secret
        }}
    )

    session.pop("temp_secret", None)

    return redirect(url_for("dashboard"))

@app.route("/mfa", methods=["GET", "POST"])
def mfa_verify():
    if "mfa_pending" not in session:
        return redirect(url_for("dashboard"))

    user = db.users.find_one({"usuario": session["usuario"]})

    if request.method == "POST":
        token = request.form.get("token")
        totp = pyotp.TOTP(user["mfa_secret"])

        if totp.verify(token):
            session.pop("mfa_pending")
            return redirect(url_for("dashboard"))

        return render_template("mfa_verify.html", erro="Código incorreto")

    return render_template("mfa_verify.html")

@app.route("/painel")
def painel():
    return render_template("index.html")

@app.route("/onibus/<onibus_id>")
def onibus_page(onibus_id):
    return render_template("onibus.html", onibus_id=onibus_id)


# -------------------------------
# Helpers
# -------------------------------
def fmt_coord(coord):
    """Garante formato lon,lat com casas decimais."""
    lon, lat = float(coord[0]), float(coord[1])
    return f"{lon:.6f},{lat:.6f}"

def safe_request_get(url, timeout=10):
    """Requisição GET com tratamento de erro."""
    try:
        r = requests.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        return {"_request_error": str(e), "status_code": getattr(e.response, "status_code", None)}

# -------------------------------
# Função unificada ETA (OSRM)
# -------------------------------
def calcular_eta(posicao_atual, paradas, usar_table=True):
    if not posicao_atual or not isinstance(posicao_atual, (list, tuple)) or len(posicao_atual) < 2:
        return {"erro": "Posição atual inválida"}

    hora_agora = datetime.now()

    if usar_table and len(paradas) > 1 and len(paradas) + 1 <= OSRM_TABLE_MAX:
        coords_list = [posicao_atual] + paradas
        coords = ";".join([fmt_coord(c) for c in coords_list])
        url = f"{OSRM_HOST}/table/v1/driving/{coords}?sources=0"
        data = safe_request_get(url, timeout=12)

        if "_request_error" in data:
            pass
        else:
            durations = data.get("durations")
            if durations and len(durations) > 0:
                duracoes = durations[0]
                etas = []
                for idx, dur in enumerate(duracoes[1:], start=0):
                    parada_coords = paradas[idx]
                    if dur is not None:
                        etas.append({
                            "parada_coords": parada_coords,
                            "eta": (hora_agora + timedelta(seconds=dur)).isoformat(),
                            "duracao_segundos": dur
                        })
                    else:
                        etas.append({
                            "parada_coords": parada_coords,
                            "eta": None,
                            "duracao_segundos": None,
                            "erro": "rota_indisponivel"
                        })
                return etas

    # fallback: rota por rota
    etas = []
    for parada in paradas:
        coords = f"{fmt_coord(posicao_atual)};{fmt_coord(parada)}"
        url = f"{OSRM_HOST}/route/v1/driving/{coords}?overview=false"
        data = safe_request_get(url, timeout=8)

        if "_request_error" in data:
            etas.append({
                "parada_coords": parada,
                "eta": None,
                "duracao_segundos": None,
                "erro": f"request_error: {data['_request_error']}"
            })
            continue

        routes = data.get("routes")
        if not routes:
            etas.append({
                "parada_coords": parada,
                "eta": None,
                "duracao_segundos": None,
                "erro": "nenhuma_rota"
            })
            continue

        rota = routes[0]
        duracao = rota.get("duration")
        distancia = rota.get("distance")
        etas.append({
            "parada_coords": parada,
            "eta": (hora_agora + timedelta(seconds=duracao)).isoformat() if duracao is not None else None,
            "duracao_segundos": duracao,
            "distancia_km": round(distancia / 1000, 2) if distancia is not None else None
        })

    return etas

# -------------------------------
# Endpoint: ônibus com info da linha
# -------------------------------
@app.route("/api/onibus")
def get_onibus():
    onibus_data = list(db.onibus.find({}, {"_id": 0}))
    enriched = []

    for onibus in onibus_data:
        linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
        if not linha:
            continue

        prox_parada = db.paradas.find_one({"linha_id": linha["linha_id"]}, {"_id": 0})

        enriched.append({
            "onibus_id": onibus["onibus_id"],
            "name": onibus["name"],
            "linha_id": linha.get("numero_linha"),
            "linha_nome": linha.get("nome"),
            "modelo": onibus.get("modelo"),
            "capacidade": onibus.get("capacidade"),
            "status": onibus.get("status"),
            "features": onibus.get("features"),
            "tarifa": f"{float(onibus.get('tarifa', 0)):.2f}",
            "tempo_estimado": None,
            "prox_parada": prox_parada["name"] if prox_parada else "Não disponível"
        })

    return jsonify(enriched)

# -------------------------------
# Endpoint ETA (OSRM)
# -------------------------------
eta_cache = {}

@app.route("/api/eta/<onibus_id>")
def get_eta(onibus_id):
    try:
        now = time.time()
        cache_entry = eta_cache.get(onibus_id)
        if cache_entry and now - cache_entry[0] < 60:
            return jsonify(cache_entry[1])

        onibus = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
        if not onibus:
            return jsonify({"erro": "Ônibus não encontrado"}), 404

        linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
        if not linha:
            return jsonify({"erro": "Linha não encontrada"}), 404

        loc = onibus.get("localizacao", {})
        if "coordinates" in loc:
            posicao_atual = loc["coordinates"]
        elif "lat" in loc and "lng" in loc:
            posicao_atual = [loc["lng"], loc["lat"]]
        else:
            return jsonify({"erro": "Posição do ônibus indisponível"}), 404

        paradas = []
        for parada in db.paradas.find({"linha_id": linha["linha_id"]}, {"_id": 0, "localizacao": 1}):
            coords = parada.get("localizacao")
            if coords and "lat" in coords and "lng" in coords:
                paradas.append([coords["lng"], coords["lat"]])

        if not paradas:
            return jsonify({"erro": "Nenhuma parada válida encontrada"}), 404

        if len(paradas) + 1 > OSRM_TABLE_MAX:
            paradas = paradas[: (OSRM_TABLE_MAX - 1)]

        etas = calcular_eta(posicao_atual, paradas, usar_table=True)

        if isinstance(etas, dict) and "erro" in etas:
            return jsonify(etas), 500

        resultado = {
            "onibus_id": onibus_id,
            "linha_id": linha.get("numero_linha"),
            "requested_at": datetime.now().isoformat(),
            "etas": etas
        }

        eta_cache[onibus_id] = (now, resultado)
        return jsonify(resultado)

    except requests.Timeout:
        return jsonify({"erro": "Tempo limite de requisição OSRM excedido"}), 504
    except Exception as e:
        print("Erro ETA:", repr(e))
        return jsonify({"erro": "Erro interno ao calcular ETA", "detalhes": str(e)}), 500

# -------------------------------
# Demais endpoints
# -------------------------------
@app.route("/api/linhas")
def get_linhas():
    data = list(db.linhas.find({}, {"_id": 0}))
    return jsonify(data)

@app.route("/api/paradas_linha/<linha_ref>")
def get_paradas_linha(linha_ref):
    """
    Retorna as paradas de uma linha, podendo filtrar por sentido (?sentido=ida|volta).
    Exemplo:
       /api/paradas_linha/116?sentido=ida
       /api/paradas_linha/L116?sentido=volta
    """
 
    sentido = request.args.get("sentido", None)  # ida | volta | None
 
    # Normalizar referencia da linha
    linha = db.linhas.find_one(
        {
            "$or": [
                {"linha_id": linha_ref},
                {"linha_id": f"L{linha_ref}"},
                {"numero_linha": linha_ref if isinstance(linha_ref, int) else None},
                {"numero_linha": int(linha_ref) if linha_ref.isdigit() else None}
            ]
        },
        {"_id": 0}
    )
 
    if not linha:
        return jsonify({"erro": "Linha não encontrada"}), 404
 
    linha_id = linha["linha_id"]
 
    # ----------------------------
    # 1. Se houver sentido declarado
    # ----------------------------
    if sentido in ("ida", "volta"):
        if "paradas" not in linha or sentido not in linha["paradas"]:
            return jsonify([])
 
        # Lista ordenada de IDs
        lista_ids = linha["paradas"][sentido]
 
        # Buscar todas as paradas do sentido
        docs = list(db.paradas.find(
            {"linha_id": linha_id, "sentido": sentido},
            {"_id": 0}
        ))
 
        # Indexar por parada_id
        mapa_paradas = {p["parada_id"]: p for p in docs}
 
        # Ordenar na ordem oficial da linha
        resultado = [mapa_paradas[id_] for id_ in lista_ids if id_ in mapa_paradas]
 
        return jsonify(resultado)
 
    # ----------------------------
    # 2. Se NÃO houver parâmetro sentido
    # devolve ida + volta concatenados
    # ----------------------------
    docs = list(db.paradas.find(
        {"linha_id": linha_id},
        {"_id": 0}
    ))
 
    return jsonify(docs)

    # ----------------------------
    # 2. Se NÃO houver parâmetro sentido
    # devolve ida + volta concatenados
    # ----------------------------
    docs = list(db.paradas.find(
        {"linha_id": linha_id},
        {"_id": 0}
    ))

    return jsonify(docs)

@app.route("/api/linha/<linha_id>")
def get_linha_by_id(linha_id):
    """Retorna os dados completos de uma linha (com shape e paradas)."""
    try:
        linha = db.linhas.find_one({"linha_id": linha_id}, {"_id": 0})
        if not linha:
            return jsonify({"erro": "Linha não encontrada"}), 404
        return jsonify({"linha": linha})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route("/api/sensores")
def get_sensores():
    data = list(db.sensores.find({}, {"_id": 0}))
    return jsonify(data)

@app.route("/api/onibus/<onibus_id>")
def get_onibus_by_id(onibus_id):
    onibus = db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})
    if not onibus:
        return jsonify({"erro": "Ônibus não encontrado"}), 404
    linha = db.linhas.find_one({"linha_id": onibus["linha_id"]}, {"_id": 0})
    return jsonify({"onibus": onibus, "linha": linha})

@app.route("/dashboard")
def dashboard():
    if "usuario" not in session:
        return redirect(url_for("login"))

    if session.get("mfa_pending"):
        return redirect(url_for("mfa_verify"))

    return render_template("dashboard.html")

# -------------------------------
# Cache e headers
# -------------------------------
@app.after_request
def add_cache_headers(response):
    if response.content_type.startswith('text/html'):
        response.cache_control.max_age = 300
        response.cache_control.public = True
    return response

# -------------------------------
# Inicialização do servidor
# -------------------------------
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)
