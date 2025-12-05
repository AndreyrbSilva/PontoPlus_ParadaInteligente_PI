import requests
from app.utils import fmt_coord

class OsrmService:
    """
    Serviço responsável por integração com OSRM:
    - ETA
    - Distâncias
    - Table
    - Route
    """

    def __init__(self, host: str, table_max: int):
        self.host = host.rstrip("/")
        self.table_max = table_max

    def _safe_get(self, url: str, params=None):
        try:
            res = requests.get(url, params=params, timeout=10)
            if res.status_code == 200:
                return res.json()
        except:
            pass
        return None

    def calculate_eta(self, current: tuple, stops: list):
        """
        current = (lon, lat)
        stops = [(lon1, lat1), (lon2, lat2)...]
        """
        if not current or not stops:
            return None

        joined = ";".join([fmt_coord(*current)] + [fmt_coord(*s) for s in stops])

        url = f"{self.host}/route/v1/driving/{joined}"
        data = self._safe_get(url, params={"overview": "false"})

        if not data or not data.get("routes"):
            return None

        duration = data["routes"][0]["duration"]
        return int(duration)
