#!/usr/bin/env python3
from __future__ import annotations

import base64
import getpass
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
USERS_FILE = DATA_DIR / "users.json"
DATA_DIR.mkdir(exist_ok=True)


def b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def hash_password(password: str, iterations: int = 260000) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${b64e(salt)}${b64e(digest)}"


def load_users() -> dict:
    if USERS_FILE.exists():
        return json.loads(USERS_FILE.read_text(encoding="utf-8"))
    return {"schema": "pruefturbo.users.v1", "created_on": datetime.now(timezone.utc).isoformat(), "users": {}}


def main() -> None:
    username = input("Email/username: ").strip().lower()
    if not username:
        raise SystemExit("Username is required.")
    password = getpass.getpass("New password: ")
    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        raise SystemExit("Passwords do not match.")
    if len(password) < 12:
        raise SystemExit("Password must be at least 12 characters.")
    role = input("Role [admin/user/viewer] (default: admin): ").strip().lower() or "admin"
    if role not in {"admin", "user", "viewer"}:
        raise SystemExit("Invalid role. Use admin, user, or viewer.")
    payload = load_users()
    now = datetime.now(timezone.utc).isoformat()
    payload.setdefault("users", {})[username] = {
        "display_name": username,
        "password_hash": hash_password(password),
        "role": role,
        "active": True,
        "created_on": payload.get("users", {}).get(username, {}).get("created_on", now),
        "updated_on": now,
    }
    USERS_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    try:
        USERS_FILE.chmod(0o600)
    except Exception:
        pass
    print(f"User saved: {username}")
    print(f"File: {USERS_FILE}")


if __name__ == "__main__":
    main()
