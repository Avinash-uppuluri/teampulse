import re
from email_validator import validate_email, EmailNotValidError

VALID_ROLES = {
    "ADMIN",
    "PROJECT_MANAGER",
    "TEAM_LEAD",
    "DEVELOPER",
    "QA_TESTER",
    "CLIENT",
}

# Roles a normal Admin action is allowed to create.
# (ADMIN accounts are intentionally excluded — created only via seed script.)
CREATABLE_ROLES = VALID_ROLES - {"ADMIN"}


def is_valid_email(email: str) -> bool:
    if not email:
        return False
    try:
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False


def is_valid_password(password: str):
    """
    Returns (is_valid, message).
    Rule: min 8 chars, at least 1 letter and 1 number.
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Za-z]", password):
        return False, "Password must contain at least one letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number."
    return True, ""


def is_valid_role(role: str, allow_admin=False) -> bool:
    if allow_admin:
        return role in VALID_ROLES
    return role in CREATABLE_ROLES


def sanitize_str(value: str) -> str:
    if value is None:
        return value
    return value.strip()
