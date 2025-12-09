import time
import cloudinary
import cloudinary.uploader
from bson.objectid import ObjectId
from app.utils import allowed_file

class UploadService:
    """
    Serviço responsável por salvar e recuperar avatares de usuários.
    """
    def __init__(self, mongo_client, upload_folder: str, allowed: set):
        """
        Inicializa o serviço de upload.

        Args:
            mongo_client: Conexão com o MongoDB.
            upload_folder (str): Pasta usada para uploads (não usada no Cloudinary).
            allowed (set): Extensões permitidas.
        """
        self.db = mongo_client["PontoPlus"]
        self.allowed_extensions = allowed

    def save_avatar(self, user_id: str, file):
        """
        Salva o avatar do usuário no Cloudinary e atualiza a URL no banco.

        Args:
            user_id (str): ID do usuário.
            file: Arquivo enviado.

        Returns:
            dict: Resultado contendo `ok`, `filename` ou mensagem de erro.
        """
        if not file or file.filename == "":
            return {"ok": False, "error": "no_file"}

        if not allowed_file(file.filename, self.allowed_extensions):
            return {"ok": False, "error": "invalid_extension"}

        try:
            upload_result = cloudinary.uploader.upload(
                file,
                public_id=f"user_avatars/{user_id}",
                overwrite=True,
                resource_type="image"
            )

            base_url = upload_result.get("secure_url")
            timestamp = int(time.time())
            final_url = f"{base_url}?v={timestamp}"
            self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"profile_pic": final_url}}
            )

            return {"ok": True, "filename": final_url}

        except Exception as e:
            print(f"Erro no upload Cloudinary: {e}")
            return {"ok": False, "error": "upload_failed"}

    def get_avatar_path(self, user_id: str):
        """
        Retorna a URL do avatar salvo no banco.

        Args:
            user_id (str): ID do usuário.

        Returns:
            str | None: URL do avatar ou None se não existir.
        """
        try:
            user = self.db.users.find_one({"_id": ObjectId(user_id)})
            return user.get("profile_pic") if user else None
        except:
            return None