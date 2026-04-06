import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core import config

_ALGORITHM = "HS256"
_ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 30


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        config.SECRET_KEY,
        algorithm=_ALGORITHM,
    )


def decode_access_token(token: str) -> str:
    """Decode a JWT and return the subject (user_id). Raises jwt.PyJWTError on invalid token."""
    payload = jwt.decode(token, config.SECRET_KEY, algorithms=[_ALGORITHM])
    return payload["sub"]


def create_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token (URL-safe, 64-byte entropy)."""
    return secrets.token_urlsafe(64)


def create_password_reset_token() -> str:
    """Generate a cryptographically secure password reset token."""
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    """SHA-256 hash a token for safe storage in the database."""
    return hashlib.sha256(token.encode()).hexdigest()
