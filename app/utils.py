import re
from werkzeug.utils import secure_filename

def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """
    Verifica se o arquivo possui extensão permitida.
    """
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in allowed_extensions
    )

def sanitize_filename(filename: str) -> str:
    """
    Garante que o nome do arquivo seja seguro.
    """
    return secure_filename(filename)

def senha_valida(senha: str) -> bool:
    """
    Valida uma senha forte (mínimo padrão profissional).
    """
    if len(senha) < 8:
        return False
    if not re.search(r"[A-Z]", senha):
        return False
    if not re.search(r"[a-z]", senha):
        return False
    if not re.search(r"\d", senha):
        return False
    if not re.search(r"[^A-Za-z0-9]", senha):
        return False
    return True

def fmt_coord(lon: float, lat: float) -> str:
    """
    Formata coordenadas no padrão 'lon,lat' usado pelo OSRM.
    """
    return f"{lon},{lat}"