"""
Extensões globais da aplicação.

Este módulo inicializa e registra todas as extensões utilizadas
em toda a aplicação Flask, incluindo:
    - CORS
    - Compress (GZIP)
    - MongoDB Client
    - OSRM Service

As extensões ficam armazenadas em `app.extensions[]`, permitindo
acesso centralizado por qualquer módulo do sistema.
"""

from flask_cors import CORS
from flask_compress import Compress
from pymongo import MongoClient
from app.services.osrm_service import OsrmService

def init_extensions(app):
    """
    Inicializa todas as extensões utilizadas pela aplicação e
    registra cada uma delas em `app.extensions[]`.
    """

    # ---------------------------
    # CORS
    # ---------------------------
    CORS(app)

    # ---------------------------
    # Compress (gzip, deflate, etc.)
    # ---------------------------
    Compress(app)

    # ---------------------------
    # MongoDB Client
    # ---------------------------
    mongo_uri = app.config["MONGO_URI"]
    mongo_client = MongoClient(mongo_uri)

    # Mantém o client acessível globalmente
    app.extensions["mongo_client"] = mongo_client

    # ---------------------------
    # OSRM Service
    # ---------------------------
    app.extensions["osrm_service"] = OsrmService(
        app.config["OSRM_HOST"],
        app.config["OSRM_TABLE_MAX"]
    )

    print("Extensões inicializadas com sucesso.")
