import os
from bson.objectid import ObjectId
from app.utils import allowed_file, sanitize_filename

class UploadService:
    """
    Serviço responsável por upload, validação e leitura de avatars.
    """

    def __init__(self, mongo_client, upload_folder: str, allowed: set):
        self.db = mongo_client["PontoPlus"]
        self.upload_folder = upload_folder
        self.allowed_extensions = allowed

        os.makedirs(upload_folder, exist_ok=True)

    def save_avatar(self, user_id: str, file):
        if not file or file.filename == "":
            return {"ok": False, "error": "no_file"}

        if not allowed_file(file.filename, self.allowed_extensions):
            return {"ok": False, "error": "invalid_extension"}

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = sanitize_filename(f"{user_id}.{ext}")
        path = os.path.join(self.upload_folder, filename)

        file.save(path)

        self.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"profile_pic": filename}}
        )

        return {"ok": True, "filename": filename}

    def get_avatar_path(self, user_id: str):
        user = self.db.users.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("profile_pic"):
            return None

        filename = user["profile_pic"]
        return os.path.join(self.upload_folder, filename)