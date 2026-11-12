from dataclasses import dataclass

import google.auth.transport.requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.oauth2 import id_token

from .config import Settings, get_settings

_bearer = HTTPBearer(auto_error=False)
_request = google.auth.transport.requests.Request()


@dataclass
class CurrentUser:
    uid: str
    email: str | None
    name: str
    picture: str | None


def _unauthorized(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    if creds is None or not creds.credentials:
        raise _unauthorized()

    token = creds.credentials

    if settings.auth_dev_bypass and token == "dev":
        return CurrentUser(uid="dev-user", email="dev@example.com", name="Dev User", picture=None)

    if not settings.firebase_project_id:
        raise _unauthorized("Server is missing FIREBASE_PROJECT_ID")

    try:
        claims = id_token.verify_firebase_token(
            token, _request, audience=settings.firebase_project_id
        )
    except Exception as exc:  # invalid signature, expired, wrong audience...
        raise _unauthorized("Invalid token") from exc

    if not claims or claims.get("iss") != f"https://securetoken.google.com/{settings.firebase_project_id}":
        raise _unauthorized("Invalid token issuer")

    email = claims.get("email")
    name = claims.get("name") or (email.split("@")[0] if email else "Traveler")
    return CurrentUser(uid=claims["sub"], email=email, name=name, picture=claims.get("picture"))
