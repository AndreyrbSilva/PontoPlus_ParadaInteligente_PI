from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId
from app.utils import senha_valida

class AuthService:
    """
    Serviço responsável por operações de autenticação e gerenciamento de usuários.
    Este serviço segue o princípio de responsabilidade única (SRP).
    """

    def __init__(self, mongo_client):
        """
        Inicializa o serviço de autenticação com a conexão ao banco de dados.
        """
        self.db = mongo_client["PontoPlus"]

    def create_user(self, usuario: str, email: str, senha: str):
        """
        Cria um novo usuário no sistema após validar senha e verificar se o
        e-mail ou nome de usuário já existem.
        """
        if not senha_valida(senha):
            return {"ok": False, "error": "weak_password"}

        exists = self.db.users.find_one({
            "$or": [{"usuario": usuario}, {"email": email}]
        })

        if exists:
            return {"ok": False, "error": "user_exists"}

        hashed = generate_password_hash(senha)

        user = {
            "usuario": usuario,
            "email": email,
            "password": hashed,
            "mfa_enabled": False,
            "mfa_secret": None,
            "recovery_codes": [],
            "profile_pic": None
        }

        result = self.db.users.insert_one(user)
        return {"ok": True, "user_id": str(result.inserted_id)}

    def authenticate(self, email: str, senha: str):
        """
        Verifica as credenciais do usuário e retorna o documento
        do MongoDB se a autenticação for bem-sucedida.
        """
        user = self.db.users.find_one({"email": email})
        if not user:
            return None
        if not check_password_hash(user["password"], senha):
            return None
        return user

    def get_user_by_id(self, user_id: str):
        """
        Recupera um usuário pelo seu ID.
        """
        return self.db.users.find_one({"_id": ObjectId(user_id)})
