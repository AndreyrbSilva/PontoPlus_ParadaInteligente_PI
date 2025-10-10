import time
from datetime import datetime, timedelta
from ..utils.helpers import fmt_coord, safe_request_get

class ETAService:
    """
    Service responsável por calcular e retornar o ETA (tempo estimado de chegada).
    Usa dados do OSRM (Open Source Routing Machine) e mantém um cache local simples.
    """

    def __init__(self, repo, osrm_host, table_max):
        self.repo = repo
        self.osrm_host = osrm_host.rstrip("/")
        self.table_max = table_max
        self.cache = {}

    def calcular_eta(self, posicao, paradas):
        """
        Calcula o ETA entre uma posição e várias paradas usando a API OSRM.
        Retorna lista de dicionários com as estimativas.
        """
        hora_agora = datetime.now()
        coords_list = [posicao] + paradas
        coords = ";".join(fmt_coord(c) for c in coords_list)
        url = f"{self.osrm_host}/table/v1/driving/{coords}?sources=0"
        data = safe_request_get(url)

        etas = []
        durations = data.get("durations", [[]])[0]

        for idx, dur in enumerate(durations[1:], start=0):
            parada_coords = paradas[idx]
            eta = hora_agora + timedelta(seconds=dur) if dur else None
            etas.append({
                "parada_coords": parada_coords,
                "eta": eta.isoformat() if eta else None,
                "duracao_segundos": dur
            })
        return etas

    def get_eta(self, onibus_id):
        """
        Retorna o ETA de um ônibus específico, com cache e fallback seguro.
        """
        # Verifica cache (válido por até 60 segundos)
        cached = self.cache.get(onibus_id)
        if cached and time.time() - cached[0] < 60:
            return cached[1]

        # Busca dados do ônibus
        bus = self.repo.find_onibus(onibus_id)
        if not bus:
            return {"erro": "Ônibus não encontrado"}

        linha = self.repo.find_linha(bus.get("linha_id"))
        if not linha or not linha.get("paradas"):
            return {"erro": "Linha ou paradas não encontradas"}

        posicao = bus.get("localizacao", {}).get("coordinates")
        if not posicao:
            return {"erro": "Posição do ônibus indisponível"}

        # Coleta coordenadas das paradas válidas
        paradas = []
        for pid in linha["paradas"]:
            parada = self.repo.find_parada_by_id(pid)
            if parada and parada.get("localizacao", {}).get("coordinates"):
                paradas.append(parada["localizacao"]["coordinates"])

        if not paradas:
            return {"erro": "Nenhuma parada válida encontrada"}

        # Calcula ETA com OSRM
        etas = self.calcular_eta(posicao, paradas)

        result = {
            "onibus_id": onibus_id,
            "linha_id": linha.get("numero_linha"),
            "etas": etas,
            "requested_at": datetime.now().isoformat()
        }

        # Armazena em cache
        self.cache[onibus_id] = (time.time(), result)
        return result
