from bson.objectid import ObjectId

class UserModel:
    """
    Camada de abstração mínima para o documento do usuário.
    """

    def __init__(self, db):
        self.collection = db["users"]

    def find_by_id(self, user_id: str):
        return self.collection.find_one({"_id": ObjectId(user_id)})

    def find_by_email(self, email: str):
        return self.collection.find_one({"email": email})

    def update(self, user_id: str, data: dict):
        return self.collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": data}
        )

    def insert(self, data: dict):
        result = self.collection.insert_one(data)
        return str(result.inserted_id)