import base64
import hashlib
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from app.core.config import settings


def _build_fernet_key() -> bytes:
    """
    Derive a Fernet key from the app secret.
    Uses SHA256 to produce a 32-byte key then base64-url encodes for Fernet.
    """
    secret = settings.SECRET_KEY or "ariel-default-secret"
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_value(value: str) -> str:
    """Encrypt a string value using Fernet symmetric encryption."""
    fernet = Fernet(_build_fernet_key())
    token = fernet.encrypt(value.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_value(value: str) -> Optional[str]:
    """Decrypt a Fernet token. Returns None if token is invalid."""
    fernet = Fernet(_build_fernet_key())
    try:
        decrypted = fernet.decrypt(value.encode("utf-8"))
        return decrypted.decode("utf-8")
    except (InvalidToken, ValueError):
        return None
