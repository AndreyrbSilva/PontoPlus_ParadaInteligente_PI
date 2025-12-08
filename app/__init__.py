from flask import Flask
from app.extensions import init_extensions
from app.config import Config


def create_app(config_class=Config):
    # Cria a aplicação Flask
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static"
    )

    # Carrega configuração
    app.config.from_object(config_class)

    # Inicializa extensões globais (Mongo, CORS, Compress, etc.)
    init_extensions(app)
    # inicializar serviços que dependem das extensões
    from app.routes.auth_routes import init_auth_service
    from app.routes.mfa_routes import init_mfa_service
    from app.routes.upload_routes import init_upload_service

    init_auth_service(app)
    init_mfa_service(app)
    init_upload_service(app)

    # Importa e registra os Blueprints
    register_blueprints(app)

    return app

def register_blueprints(app):
    """
    Registra TODOS os blueprints da aplicação,
    seguindo exatamente a arquitetura que você escolheu.
    """

    # Rotas de autenticação
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    # Rotas de MFA
    from app.routes.mfa_routes import mfa_bp
    app.register_blueprint(mfa_bp)

    # Rotas de upload
    from app.routes.upload_routes import upload_bp
    app.register_blueprint(upload_bp)

    # Rotas das APIs OSRM (ETA POST /eta)
    from app.routes.api_routes import api_bp
    app.register_blueprint(api_bp)

    # Rotas de ônibus (GET /api/onibus, /api/eta/<id>, etc.)
    from app.routes.bus_routes import bus_bp
    app.register_blueprint(bus_bp)

    # Rotas de linhas e paradas
    from app.routes.linha_routes import linha_bp
    app.register_blueprint(linha_bp)

    # Rotas de sensores
    from app.routes.sensor_routes import sensor_bp
    app.register_blueprint(sensor_bp)

    # Rotas de páginas (index, dashboard, painel)
    from app.routes.page_routes import page_bp
    app.register_blueprint(page_bp)