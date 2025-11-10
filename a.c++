#include <Arduino.h>
#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>
#include <esp_task_wdt.h>

// ---------------- CONFIGURAÇÃO DE PINS ----------------

// UARTs
#define SIM_RX_PIN 16
#define SIM_TX_PIN 17
#define GPS_RX_PIN 20
#define GPS_TX_PIN 21

// Configurações gerais
const char APN[] = "SEU_APN_AQUI";

// URL REAL da sua API:
const char SERVER_URL[] = "http://<IP_DO_SERVIDOR>/api/update_gps";

#define INTERVAL_MS 1000      // Atualizar GPS a cada 1 segundos
#define GPRS_TIMEOUT 15000
#define WDT_TIMEOUT 20

// ---------------- OBJETOS ----------------
HardwareSerial SerialSIM(1);
HardwareSerial SerialGPS(2);
TinyGPSPlus gps;

// ---------------- FUNÇÕES AUXILIARES ----------------

// Envia AT e aguarda resposta esperada
bool sendAT(const char *cmd, const char *expected, uint16_t timeout = 2000) {
    SerialSIM.println(cmd);

    String resp = "";
    unsigned long start = millis();

    while (millis() - start < timeout) {
        if (SerialSIM.available()) {
        resp += (char)SerialSIM.read();
        if (resp.indexOf(expected) != -1) {
            return true;
        }
        }
    }

    Serial.println("[ERRO] AT falhou: " + String(cmd) + " Resp: " + resp);
    return false;
}

// Inicializa GPRS corretamente
bool initGPRS() {
    Serial.println("Iniciando GPRS...");

    if (!sendAT("AT", "OK")) return false;
    if (!sendAT("AT+CPIN?", "READY")) return false;

    sendAT("AT+SAPBR=0,1", "OK");
    sendAT("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"", "OK");

    SerialSIM.printf("AT+SAPBR=3,1,\"APN\",\"%s\"\r\n", APN);
    delay(300);

    if (!sendAT("AT+SAPBR=1,1", "OK", GPRS_TIMEOUT)) return false;
    return sendAT("AT+SAPBR=2,1", "OK");
}

// POST JSON via HTTP
bool sendHTTPPost(const String &json) {
    if (!sendAT("AT+HTTPINIT", "OK")) return false;

    SerialSIM.printf("AT+HTTPPARA=\"URL\",\"%s\"\r\n", SERVER_URL);
    sendAT("AT+HTTPPARA=\"CONTENT\",\"application/json\"", "OK");

    SerialSIM.printf("AT+HTTPDATA=%d,8000\r\n", json.length());
    delay(200);
    SerialSIM.print(json);
    delay(300);

    if (!sendAT("AT+HTTPACTION=1", "OK", 12000)) return false;

    sendAT("AT+HTTPREAD", "OK");
    sendAT("AT+HTTPTERM", "OK");
    return true;
}

// Lê dados do GPS
bool readGPS(double &lat, double &lng, double &vel_kmph) {
    unsigned long start = millis();

    while (millis() - start < 3000) {
        while (SerialGPS.available()) gps.encode(SerialGPS.read());

        if (gps.location.isUpdated()) {
        lat = gps.location.lat();
        lng = gps.location.lng();
        vel_kmph = gps.speed.kmph();
        return true;
        }
    }

    return false;
}

// ---------------- SETUP ----------------
void setup() {
    Serial.begin(115200);

    SerialSIM.begin(9600, SERIAL_8N1, SIM_RX_PIN, SIM_TX_PIN);
    SerialGPS.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

    // Watchdog
    esp_task_wdt_config_t wdt = {
        .timeout_ms = WDT_TIMEOUT * 1000,
        .idle_core_mask = (1 << portNUM_PROCESSORS) - 1,
        .trigger_panic = true
    };
    esp_task_wdt_init(&wdt);
    esp_task_wdt_add(NULL);

    Serial.println("=== ESP32 IoT - GPS + SIM ===");

    if (!initGPRS()) Serial.println("ERRO: sem GPRS");
    else Serial.println("GPRS pronto!");
}

// ---------------- LOOP ----------------
void loop() {
    static unsigned long lastTs = 0;
    unsigned long now = millis();

    esp_task_wdt_reset();

    if (now - lastTs < INTERVAL_MS) return;
    lastTs = now;

    Serial.println("\n--- Novo Ciclo ---");

    double lat = 0, lng = 0, vel = 0;
    bool hasGPS = readGPS(lat, lng, vel);

    if (!hasGPS) Serial.println("GPS sem fixo!");
    else Serial.printf("GPS: %.6f, %.6f | Vel: %.2f km/h\n", lat, lng, vel);

    // JSON para API
    StaticJsonDocument<256> doc;
    doc["onibus_id"] = "O123";     // Trocar depois
    doc["lat"] = lat;
    doc["lng"] = lng;
    doc["velocidade"] = vel;
    doc["timestamp"] = millis();   // Pode trocar por hora GSM

    String payload;
    serializeJson(doc, payload);

    Serial.println("Enviando para API: " + payload);

    if (sendHTTPPost(payload))
        Serial.println("✓ Dados enviados");
    else
        Serial.println("✗ Falha no envio");
}
