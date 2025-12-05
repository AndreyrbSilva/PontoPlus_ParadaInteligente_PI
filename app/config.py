import os
from dotenv import load_dotenv

# Carrega .env
load_dotenv()


class Config:
    # -----------------------------
    # Flask
    # -----------------------------
    SECRET_KEY = os.getenv("SECRET_KEY", os.urandom(32).hex())
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

    # -----------------------------
    # Mongo
    # -----------------------------
    MONGO_URI = os.getenv("MONGO_URI")

    # -----------------------------
    # OSRM
    # -----------------------------
    OSRM_HOST = os.getenv("OSRM_HOST", "http://localhost:5000")
    OSRM_TABLE_MAX = int(os.getenv("OSRM_TABLE_MAX", "80"))

    # -----------------------------
    # Uploads
    # -----------------------------
    UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads/profile_data")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}

    # Garante que a pasta existe
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # -----------------------------
    # Render port
    # -----------------------------
    PORT = int(os.getenv("PORT", 5000))