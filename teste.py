import time
import requests
from requests.exceptions import RequestException
import json

BASE_URL = "http://localhost:5000"

def try_json(resp):
    try:
        return resp.json()
    except ValueError:
        print("Não foi possível decodificar JSON.")
        print("Status code:", resp.status_code)
        print("Content-Type:", resp.headers.get("Content-Type"))
        print("Body (raw):")
        print(resp.text)
        return None

def testar_seed():
    print("\n[1] Populando banco (/seed)...")
    try:
        resp = requests.post(f"{BASE_URL}/seed", timeout=10)
    except RequestException as e:
        print("Erro de conexão com o servidor:", e)
        return None
    data = try_json(resp)
    if data is None and resp.status_code != 200:
        print("Verifique o console do Flask para traceback.")
    else:
        print("Resposta:", data)
    return resp

def testar_update_gps():
    print("\n[2] Enviando /update_gps ...")
    payload = {"sensor_id": 500, "lat": -23.5618, "lon": -46.6548}
    try:
        resp = requests.post(f"{BASE_URL}/update_gps", json=payload, timeout=10)
    except RequestException as e:
        print("Erro de conexão com o servidor:", e)
        return None
    data = try_json(resp)
    if data is None and resp.status_code != 200:
        print("Verifique o console do Flask para traceback.")
    else:
        print("Resposta:", data)
    return resp

def testar_eta():
    print("\n[3] Consultando /eta/1 ...")
    try:
        resp = requests.get(f"{BASE_URL}/eta/1", timeout=10)
    except RequestException as e:
        print("Erro de conexão com o servidor:", e)
        return None
    data = try_json(resp)
    if data is None and resp.status_code != 200:
        print("Verifique o console do Flask para traceback.")
    else:
        print("Resposta:", json.dumps(data, indent=2, default=str))
    return resp

if __name__ == "__main__":
    print("=== TESTE ===")
    r = testar_seed()
    time.sleep(1)
    r = testar_update_gps()
    print("\nAguarde para o processamento em background (thread)...")
    time.sleep(5)
    r = testar_eta()
    print("\n=== FIM ===")
