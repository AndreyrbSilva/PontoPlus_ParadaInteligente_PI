import os
import cloudinary
import cloudinary.uploader
from bson.objectid import ObjectId
from app.utils import allowed_file, sanitize_filename

class UploadService:
    """
    Serviço responsável por upload usando Cloudinary.
    """

    def __init__(self, mongo_client, upload_folder: str, allowed: set):
        self.db = mongo_client["PontoPlus"]
        self.allowed_extensions = allowed

    def save_avatar(self, user_id: str, file):
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

            secure_url = upload_result.get("secure_url")

            self.db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"profile_pic": secure_url}}
            )

            return {"ok": True, "filename": secure_url}

        except Exception as e:
            print(f"Erro no upload Cloudinary: {e}")
            return {"ok": False, "error": "upload_failed"}

    def get_avatar_path(self, user_id: str):
        user = self.db.users.find_one({"_id": ObjectId(user_id)})
        return user.get("profile_pic") if user else None