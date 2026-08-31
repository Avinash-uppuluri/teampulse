import bcrypt
from flask_jwt_extended import create_access_token
from authsvc.models.user import UserModel


class AuthService:
    @staticmethod
    def hash_password(plain_password: str) -> str:
        return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode(
            "utf-8"
        )

    @staticmethod
    def verify_password(plain_password: str, password_hash: str) -> bool:
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), password_hash.encode("utf-8")
            )
        except (ValueError, TypeError):
            return False

    @staticmethod
    def authenticate(email: str, password: str):
        """
        Returns (user_dict_without_hash, error_message).
        On failure user_dict is None.
        """
        user = UserModel.find_by_email(email)
        if not user:
            return None, "Invalid email or password."

        if user["status"] != "ACTIVE":
            return None, "This account has been deactivated. Contact your admin."

        if not AuthService.verify_password(password, user["password_hash"]):
            return None, "Invalid email or password."

        UserModel.update_last_login(user["id"])

        # strip password_hash before returning to caller
        safe_user = {k: v for k, v in user.items() if k != "password_hash"}
        return safe_user, None

    @staticmethod
    def issue_token(user: dict) -> str:
        """
        Encodes the identity + role/name/email as JWT claims so Parts 2,3,4
        can read req.user role/id straight from the token without an extra
        DB round trip.
        """
        additional_claims = {
            "role": user["role"],
            "name": user["name"],
            "email": user["email"],
        }
        return create_access_token(
            identity=str(user["id"]), additional_claims=additional_claims
        )
