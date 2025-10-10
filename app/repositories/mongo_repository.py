from pymongo import MongoClient
from typing import Any, Dict, List, Optional
from .repository import Repository

class MongoRepository(Repository):
    """
    Implementação concreta do repositório usando MongoDB.
    Depende apenas da interface Repository (não do restante do sistema).
    """

    def __init__(self, uri: str, dbname: str):
        self.client = MongoClient(uri)
        self.db = self.client[dbname]

    # Ônibus
    def list_onibus(self) -> List[Dict[str, Any]]:
        return list(self.db.onibus.find({}, {"_id": 0}))

    def find_onibus(self, onibus_id: str) -> Optional[Dict[str, Any]]:
        return self.db.onibus.find_one({"onibus_id": onibus_id}, {"_id": 0})


    # Linhas
    def list_linhas(self) -> List[Dict[str, Any]]:
        return list(self.db.linhas.find({}, {"_id": 0}))

    def find_linha(self, linha_id: str) -> Optional[Dict[str, Any]]:
        return self.db.linhas.find_one({"linha_id": linha_id}, {"_id": 0})

    # Paradas
    def list_paradas(self) -> List[Dict[str, Any]]:
        return list(self.db.paradas.find({}, {"_id": 0}))

    def find_parada_by_id(self, parada_id: str) -> Optional[Dict[str, Any]]:
        return self.db.paradas.find_one({"parada_id": parada_id}, {"_id": 0})

    # Sensores
    def list_sensores(self) -> List[Dict[str, Any]]:
        return list(self.db.sensores.find({}, {"_id": 0}))
