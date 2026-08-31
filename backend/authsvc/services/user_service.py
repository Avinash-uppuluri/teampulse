from authsvc.models.user import UserModel
from authsvc.services.auth_service import AuthService
from authsvc.utils.validators import (
    is_valid_email,
    is_valid_password,
    is_valid_role,
    sanitize_str,
)


class UserService:
    @staticmethod
    def create_user(name, email, password, role, department=None):
        name = sanitize_str(name)
        email = sanitize_str(email).lower() if email else email

        if not name:
            return None, "Name is required."
        if not is_valid_email(email):
            return None, "A valid email is required."
        if not is_valid_role(role, allow_admin=False):
            return None, "Invalid role. Admin accounts cannot be created here."

        valid_pw, pw_msg = is_valid_password(password)
        if not valid_pw:
            return None, pw_msg

        if UserModel.find_by_email(email):
            return None, "A user with this email already exists."

        password_hash = AuthService.hash_password(password)
        new_id = UserModel.create(name, email, password_hash, role, department)
        return UserModel.find_by_id(new_id), None

    @staticmethod
    def update_user(user_id, data: dict):
        allowed_fields = {"name", "department", "role"}
        updates = {}

        if "name" in data:
            name = sanitize_str(data["name"])
            if not name:
                return False, "Name cannot be empty."
            updates["name"] = name

        if "department" in data:
            updates["department"] = sanitize_str(data["department"])

        if "role" in data:
            if not is_valid_role(data["role"], allow_admin=False):
                return False, "Invalid role."
            updates["role"] = data["role"]

        # Ignore any unexpected/unsafe fields silently
        updates = {k: v for k, v in updates.items() if k in allowed_fields}

        if not updates:
            return False, "No valid fields provided to update."

        ok = UserModel.update(user_id, updates)
        if not ok:
            return False, "User not found or nothing changed."
        return True, None

    @staticmethod
    def set_status(user_id, status):
        if status not in ("ACTIVE", "INACTIVE"):
            return False, "Status must be ACTIVE or INACTIVE."
        ok = UserModel.update_status(user_id, status)
        if not ok:
            return False, "User not found."
        return True, None

    @staticmethod
    def reset_password(user_id, new_password):
        valid_pw, pw_msg = is_valid_password(new_password)
        if not valid_pw:
            return False, pw_msg
        password_hash = AuthService.hash_password(new_password)
        ok = UserModel.update_password(user_id, password_hash)
        if not ok:
            return False, "User not found."
        return True, None

    @staticmethod
    def delete_user(user_id, requesting_admin_id):
        if str(user_id) == str(requesting_admin_id):
            return False, "You cannot delete your own account."
        ok = UserModel.delete(user_id)
        if not ok:
            return False, "User not found."
        return True, None
