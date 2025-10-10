import requests

def fmt_coord(coord):
    """
    Formata coordenadas geográficas (longitude, latitude)
    no formato esperado pela API OSRM.
    Exemplo:
        Entrada: [-46.6333, -23.5505]
        Saída: "-46.633300,-23.550500"
    """
    lon, lat = float(coord[0]), float(coord[1])
    return f"{lon:.6f},{lat:.6f}"

def safe_request_get(url: str, timeout: int = 10):
    """
    Realiza uma requisição GET segura, tratando erros de rede e tempo limite.
    Retorna o JSON decodificado ou um dicionário com erro.
    """
    try:
        res = requests.get(url, timeout=timeout)
        res.raise_for_status()
        return res.json()
    except requests.RequestException as e:
        return {"_request_error": str(e)}
