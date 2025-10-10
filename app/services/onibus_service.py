class BusService:
    """
    Service responsável pelas regras de negócio dos ônibus.
    Faz a ligação entre o repositório e as rotas.
    """

    def __init__(self, repo):
        self.repo = repo

    def get_all(self):
        """
        Retorna todos os ônibus com informações enriquecidas
        (linha e próxima parada, se disponíveis).
        """
        onibus_list = self.repo.list_onibus()
        enriched = []

        for bus in onibus_list:
            linha = self.repo.find_linha(bus.get("linha_id")) or {}
            prox_parada = None

            if linha.get("paradas"):
                parada = self.repo.find_parada_by_id(linha["paradas"][0])
                prox_parada = parada.get("name") if parada else None

            enriched.append({
                "onibus_id": bus.get("onibus_id"),
                "name": bus.get("name"),
                "linha_id": linha.get("numero_linha") or bus.get("linha_id"),
                "linha_nome": linha.get("nome") or "",
                "modelo": bus.get("modelo"),
                "capacidade": bus.get("capacidade"),
                "status": bus.get("status"),
                "features": bus.get("features", {}),
                "prox_parada": prox_parada or "Não disponível"
            })

        return enriched
