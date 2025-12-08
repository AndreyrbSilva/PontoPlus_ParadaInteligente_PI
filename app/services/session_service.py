from flask import session

class SessionService:
    """
    Serviço simples para manipular sessão de forma organizada.
    """

    @staticmethod
    def login(user):
        session["user_id"] = str(user["_id"])
        session["email"] = user["email"]
        session["usuario"] = user["usuario"]
        session["mfa_pending"] = user.get("mfa_enabled", False)

    @staticmethod
    def is_mfa_verified():
        """
        Verifica se o usuário completou a verificação MFA.
        
        A flag 'mfa_verified' é setada para True APENAS no final do 
        processo de mfa (dentro do mfa_routes/mfa_service).
        """
        return session.get("mfa_verified", False)

    @staticmethod
    def complete_mfa():
        """
        Marca a sessão como verificada por MFA.
        """
        session["mfa_verified"] = True

    @staticmethod
    def logout():
        session.clear()

    @staticmethod
    def is_logged():
        return "user_id" in session

    @staticmethod
    def get_id():
        return session.get("user_id")