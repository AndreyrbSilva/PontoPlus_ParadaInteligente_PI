import requests
import time
import math

URL = "http://localhost:5000/api/update_gps"
bus_id = "O001"

cx, cy = -8.05428, -34.8813   # centro
r = 0.001                     # “raio” do círculo

t = 0
while True:
    lat = cx + r * math.sin(t)
    lng = cy + r * math.cos(t)

    data = {
        "onibus_id": bus_id,
        "lat": lat,
        "lng": lng,
        "velocidade": 25
    }

    requests.post(URL, json=data)
    print("Enviado:", lat, lng)

    t += 0.1
    time.sleep(1)
