from typing import Any, Dict, List, Optional

class Repository:
    """
    Interface que define os métodos que qualquer repositório deve implementar.
    Segue o princípio da Inversão de Dependência (DIP).
    """

    def list_onibus(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def find_onibus(self, onibus_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def list_linhas(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def find_linha(self, linha_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def list_paradas(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    def find_parada_by_id(self, parada_id: str) -> Optional[Dict[str, Any]]:
        raise NotImplementedError

    def list_sensores(self) -> List[Dict[str, Any]]:
        raise NotImplementedError
