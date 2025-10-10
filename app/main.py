from flask import Flask, render_template
from .config import Config
from .repositories.mongo_repository import MongoRepository
from .services.onibus_service import BusService
from .services.eta_service import ETAService
from .routes.onibus_routes import bus_bp
from .routes.linhas_routes import line_bp
from .routes.paradas_routes import stop_bp
from .routes.sensores_routes import sensor_bp

def create_app(config: Config = None) -> Flask:
    """
    Cria e configura a aplicação Flask com injeção de dependências.
    """
    config = config or Config.from_env()
    app = Flask(__name__, template_folder="../templates", static_folder="../static")
    app.config.from_object(config)

    # Repositório de dados
    repo = MongoRepository(config.MONGO_URI, config.MONGO_DBNAME)

    # Services (camada de lógica de negócio)
    bus_service = BusService(repo)
    eta_service = ETAService(repo, osrm_host=config.OSRM_HOST, table_max=config.OSRM_TABLE_MAX)

    # Rotas (controllers)
    app.register_blueprint(bus_bp(bus_service, eta_service), url_prefix="/api")
    app.register_blueprint(line_bp(repo), url_prefix="/api")
    app.register_blueprint(stop_bp(repo), url_prefix="/api")
    app.register_blueprint(sensor_bp(repo), url_prefix="/api")

    # Página inicial (frontend)
    @app.route("/")
    def index():
        return render_template("index.html")

    return app
