import secrets
import string
import pyotp

class MfaService:
    """
    Serviço responsável por gerenciar funcionalidades de MFA (Autenticação
    de Múltiplos Fatores) baseadas em TOTP.
    """

    def __init__(self, mongo_client):
        """
        Inicializa o serviço de MFA com a conexão do MongoDB.
        """
        self.db = mongo_client["PontoPlus"]

    def generate_secret(self):
        """
        Gera uma nova chave secreta para uso em TOTP (Google Authenticator, Authy etc.).
        """
        return pyotp.random_base32()

    def generate_recovery_codes(self, amount=6):
        """
        Gera uma lista de códigos de recuperação para acesso ao sistema
        caso o usuário perca acesso ao app autenticador.
        """
        chars = string.ascii_letters + string.digits
        return ["".join(secrets.choice(chars) for _ in range(10)) for _ in range(amount)]

    def enable_mfa(self, user_id: str, secret: str, recovery_codes: list):
        """
        Ativa o MFA na conta do usuário, salvando o segredo TOTP e os códigos
        de recuperação no banco de dados.
        """
        self.db.users.update_one(
            {"_id": user_id},
            {"$set": {
                "mfa_enabled": True,
                "mfa_secret": secret,
                "recovery_codes": recovery_codes
            }}
        )

    def verify_token(self, secret: str, token: str) -> bool:
        """
        Verifica se o token TOTP informado pelo usuário é válido.
        """
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)

    def verify_recovery_code(self, user_id: str, code: str):
        """
        Verifica se o código de recuperação informado é válido e, se for,
        remove-o da lista de códigos do usuário.
        """
        user = self.db.users.find_one({"_id": user_id})

        if not user or "recovery_codes" not in user:
            return False

        if code in user["recovery_codes"]:
            new_codes = [c for c in user["recovery_codes"] if c != code]

            self.db.users.update_one(
                {"_id": user_id},
                {"$set": {"recovery_codes": new_codes}}
            )
            return True

        return False
