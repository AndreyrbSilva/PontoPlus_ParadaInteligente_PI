import os
from dataclasses import dataclass

@dataclass
class Config:
    """Gerencia as configurações e variáveis de ambiente do projeto."""
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb+srv://teste:teste@cluster0.jdyk3bt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
    MONGO_DBNAME: str = "sistema_onibus"
    OSRM_HOST: str = "https://router.project-osrm.org"
    OSRM_TABLE_MAX: int = 95
    ETA_CACHE_TTL: int = 60  # segundos

    @staticmethod
    def from_env() -> "Config":
        """Carrega configurações a partir das variáveis de ambiente."""
        return Config(
            MONGO_URI=os.getenv("MONGO_URI", "mongodb://localhost:27017"),
            MONGO_DBNAME=os.getenv("MONGO_DBNAME", "PontoPlus"),
            OSRM_HOST=os.getenv("OSRM_HOST", "https://router.project-osrm.org"),
            OSRM_TABLE_MAX=int(os.getenv("OSRM_TABLE_MAX", "95")),
            ETA_CACHE_TTL=int(os.getenv("ETA_CACHE_TTL", "60")),
        )
