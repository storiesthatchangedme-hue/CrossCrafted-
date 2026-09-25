from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Header, Query, Depends, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import requests
import secrets
import asyncio
import resend
import subprocess
import tempfile
import shutil
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from models import *
import uuid

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "cross-crafted"
storage_key = None

def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        raise

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ── Email Service (Resend) ──
RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

async def send_email(to: str, subject: str, html: str):
    if not RESEND_API_KEY:
        logger.warning(f"Email not sent (no RESEND_API_KEY): to={to}, subject={subject}")
        return
    try:
        params = {"from": SENDER_EMAIL, "to": [to], "subject": subject, "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}: {result.get('id', 'ok')}")
    except Exception as e:
        logger.error(f"Email send failed to {to}: {e}")

async def send_password_reset_email(to: str, reset_link: str):
    html = f"""
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0F172A;border-radius:16px;">
      <h1 style="color:#A855F7;font-size:24px;margin:0 0 8px;">Cross Crafted</h1>
      <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">Reset Your Password</h2>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      <a href="{reset_link}" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#A855F7;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
        Reset Password
      </a>
      <p style="color:#64748B;font-size:12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
    """
    await send_email(to, "Reset your Cross Crafted password", html)

async def send_approval_email(to: str, name: str):
    html = f"""
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0F172A;border-radius:16px;">
      <h1 style="color:#A855F7;font-size:24px;margin:0 0 8px;">Cross Crafted</h1>
      <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">Welcome to the Community!</h2>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;">
        Hi {name}, your account has been <span style="color:#10B981;font-weight:600;">approved</span>! You now have full access to Cross Crafted.
      </p>
      <a href="{os.environ.get('FRONTEND_URL', '')}/login" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#A855F7;color:#fff;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
        Sign In Now
      </a>
      <p style="color:#64748B;font-size:12px;">Connect with believers, share your testimony, and grow your faith.</p>
    </div>
    """
    await send_email(to, "Your Cross Crafted account is approved!", html)

async def send_rejection_email(to: str, name: str):
    html = f"""
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0F172A;border-radius:16px;">
      <h1 style="color:#A855F7;font-size:24px;margin:0 0 8px;">Cross Crafted</h1>
      <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">Account Update</h2>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;">
        Hi {name}, we're sorry but your account application was not approved at this time. If you believe this was a mistake, please contact us.
      </p>
    </div>
    """
    await send_email(to, "Cross Crafted account update", html)

async def send_new_signup_admin_alert(user_name: str, user_email: str):
    admin_email = os.environ.get("ADMIN_EMAIL", "bookingjosh@gmail.com")
    frontend_url = os.environ.get("FRONTEND_URL", "")
    html = f"""
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0F172A;border-radius:16px;">
      <h1 style="color:#A855F7;font-size:24px;margin:0 0 8px;">Cross Crafted Admin</h1>
      <h2 style="color:#fff;font-size:18px;margin:0 0 16px;">New User Signup</h2>
      <p style="color:#94A3B8;font-size:14px;line-height:1.6;">
        <strong style="color:#fff;">{user_name}</strong> ({user_email}) just signed up and is awaiting approval.
      </p>
      <a href="{frontend_url}/app/admin/approvals" style="display:inline-block;margin:24px 0;padding:12px 32px;background:#F59E0B;color:#0F172A;text-decoration:none;border-radius:12px;font-weight:600;font-size:14px;">
        Review Now
      </a>
    </div>
    """
    await send_email(admin_email, f"New signup: {user_name} needs approval", html)

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=15), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

EMERGENT_AUTH_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

async def get_current_user(request: Request) -> dict:
    # Try session_token first (Google OAuth)
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            session_token = auth_header[7:]

    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token})
        if session:
            expires_at = session.get("expires_at", datetime.min)
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"_id": ObjectId(session["user_id"])})
                if user:
                    user["_id"] = str(user["_id"])
                    user.pop("password_hash", None)
                    return user

    # Try JWT access_token (email/password auth)
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Google OAuth ──
# Frontend redirects directly to https://auth.emergentagent.com/?redirect=...
# After auth, user lands at {redirect_url}#session_id={session_id}
# Frontend extracts session_id and calls this endpoint

@api_router.post("/auth/google/callback")
async def google_callback(body: dict, response: Response):
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

    # Exchange session_id for user data via Emergent Auth
    try:
        resp = requests.get(
            EMERGENT_AUTH_SESSION_URL,
            headers={"X-Session-ID": session_id},
            timeout=15
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        logger.error(f"Google session exchange failed: {e}")
        raise HTTPException(status_code=400, detail="Failed to verify Google session")

    email = data.get("email", "").lower()
    name = data.get("name", "")
    picture = data.get("picture", "")

    if not email:
        raise HTTPException(status_code=400, detail="No email from Google")

    # Find or create user
    existing_user = await db.users.find_one({"email": email})
    needs_onboarding = False

    if existing_user:
        user_id = str(existing_user["_id"])
        if not existing_user.get("profile_image") and picture:
            await db.users.update_one({"_id": existing_user["_id"]}, {"$set": {"profile_image": picture}})
        needs_onboarding = existing_user.get("status") == "needs_onboarding"
    else:
        # New user via Google → needs onboarding
        user_doc = {
            "email": email,
            "username": "",
            "password_hash": "",
            "name": name,
            "bio": "",
            "profile_image": picture,
            "role": "user",
            "status": "needs_onboarding",
            "state": "",
            "city": "",
            "languages": [],
            "phone": "",
            "church_name": "",
            "faith_belief": "",
            "faith_journey": "",
            "church_member": "",
            "auth_provider": "google",
            "followers": [],
            "following": [],
            "created_at": datetime.now(timezone.utc)
        }
        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        needs_onboarding = True

    # Create session
    session_token = secrets.token_urlsafe(48)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })

    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    user["needs_onboarding"] = needs_onboarding

    return user

@api_router.post("/auth/onboarding")
async def complete_onboarding(body: OnboardingRequest, user: dict = Depends(get_current_user)):
    username = body.username.lower().strip()
    # Check username uniqueness
    existing = await db.users.find_one({"username": username, "_id": {"$ne": ObjectId(user["_id"])}})
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    valid_roles = ["user", "church", "creator", "senior_pastor", "pastor", "youth_pastor", "worship_leader"]
    role = body.role if body.role in valid_roles else "user"

    await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": {
        "name": body.name,
        "username": username,
        "phone": body.phone or "",
        "role": role,
        "city": body.city or "",
        "state": body.state or "",
        "bio": body.bio or "",
        "church_name": body.church_name or "",
        "languages": body.languages or [],
        "faith_belief": body.faith_belief or "",
        "faith_journey": body.faith_journey or "",
        "church_member": body.church_member or "",
        "status": "pending_approval",
    }})

    updated = await db.users.find_one({"_id": ObjectId(user["_id"])})
    updated["_id"] = str(updated["_id"])
    updated.pop("password_hash", None)

    # Notify admin of new signup (onboarding complete)
    await send_new_signup_admin_alert(body.name, user.get("email", ""))

    return updated

@api_router.post("/auth/register")
async def register(request: RegisterRequest, response: Response):
    email = request.email.lower()
    username = request.username.lower()
    
    # Check if email or username already exists
    existing = await db.users.find_one({"$or": [{"email": email}, {"username": username}]})
    if existing:
        if existing.get("email") == email:
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # Validate role
    valid_roles = ["user", "church", "creator", "admin", "senior_pastor", "pastor", "youth_pastor", "worship_leader"]
    role = request.role if request.role in valid_roles else "user"
    
    hashed = hash_password(request.password)
    user_doc = {
        "email": email,
        "username": username,
        "password_hash": hashed,
        "name": request.name,
        "bio": "",
        "profile_image": "",
        "role": role,
        "status": "pending_approval",
        "auth_provider": "email",
        "state": request.state or "",
        "city": request.city or "",
        "languages": request.languages or [],
        "faith_belief": request.faith_belief or "",
        "faith_journey": request.faith_journey or "",
        "church_member": request.church_member or "",
        "followers": [],
        "following": [],
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user_doc["_id"] = user_id
    user_doc.pop("password_hash")

    # Notify admin of new signup
    await send_new_signup_admin_alert(request.name, email)

    return user_doc

@api_router.post("/auth/login")
async def login(request: LoginRequest, response: Response, req: Request):
    email = request.email.lower()
    identifier = f"{req.client.host}:{email}"
    
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        locked = attempt["locked_until"]
        if locked.tzinfo is None:
            locked = locked.replace(tzinfo=timezone.utc)
        if locked > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(request.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc)}},
            upsert=True
        )
        current_attempt = await db.login_attempts.find_one({"identifier": identifier})
        if current_attempt and current_attempt.get("count", 0) >= 5:
            await db.login_attempts.update_one(
                {"identifier": identifier},
                {"$set": {"locked_until": datetime.now(timezone.utc) + timedelta(minutes=15)}}
            )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    user["_id"] = user_id
    user.pop("password_hash")
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=900, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    email = request.email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If the email exists, a reset link has been sent"}
    
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": str(user["_id"]),
        "used": False,
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "created_at": datetime.now(timezone.utc)
    })
    
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    logger.info(f"Password reset link: {reset_link}")
    await send_password_reset_email(email, reset_link)
    return {"message": "If the email exists, a reset link has been sent"}

@api_router.post("/auth/reset-password")
async def reset_password(request: ResetPasswordRequest):
    reset_token = await db.password_reset_tokens.find_one({"token": request.token, "used": False})
    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    if reset_token["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    hashed = hash_password(request.new_password)
    await db.users.update_one(
        {"_id": ObjectId(reset_token["user_id"])},
        {"$set": {"password_hash": hashed}}
    )
    await db.password_reset_tokens.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    return {"message": "Password reset successful"}

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    user_id = user["_id"]
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/uploads/{user_id}/{file_id}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")

    is_video = file.content_type and file.content_type.startswith("video")
    thumbnail_url = ""

    # Generate thumbnail for videos
    if is_video:
        try:
            thumbnail_url = await generate_video_thumbnail(data, user_id, file_id)
        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")

    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result["size"],
        "user_id": user_id,
        "is_video": is_video,
        "thumbnail_url": thumbnail_url,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    })
    return {"path": result["path"], "url": f"/api/files/{result['path']}", "thumbnail_url": thumbnail_url, "is_video": is_video}

# Chunked upload: init
@api_router.post("/upload/init")
async def upload_init(body: dict, user: dict = Depends(get_current_user)):
    filename = body.get("filename", "file.bin")
    content_type = body.get("content_type", "application/octet-stream")
    total_size = body.get("total_size", 0)
    total_chunks = body.get("total_chunks", 1)
    upload_id = str(uuid.uuid4())

    await db.chunked_uploads.insert_one({
        "upload_id": upload_id,
        "user_id": user["_id"],
        "filename": filename,
        "content_type": content_type,
        "total_size": total_size,
        "total_chunks": total_chunks,
        "received_chunks": [],
        "status": "in_progress",
        "created_at": datetime.now(timezone.utc)
    })
    return {"upload_id": upload_id}

# Chunked upload: send chunk
@api_router.post("/upload/chunk/{upload_id}")
async def upload_chunk(upload_id: str, chunk_index: int = Form(...), file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    record = await db.chunked_uploads.find_one({"upload_id": upload_id, "user_id": user["_id"]})
    if not record:
        raise HTTPException(status_code=404, detail="Upload not found")
    if record["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Upload already completed")

    chunk_data = await file.read()
    chunk_path = f"{APP_NAME}/chunks/{upload_id}/{chunk_index}"
    put_object(chunk_path, chunk_data, "application/octet-stream")

    await db.chunked_uploads.update_one(
        {"upload_id": upload_id},
        {"$addToSet": {"received_chunks": chunk_index}}
    )

    updated = await db.chunked_uploads.find_one({"upload_id": upload_id})
    received = len(updated["received_chunks"])
    return {"received": received, "total": record["total_chunks"], "complete": received >= record["total_chunks"]}

# Chunked upload: finalize
@api_router.post("/upload/finalize/{upload_id}")
async def upload_finalize(upload_id: str, user: dict = Depends(get_current_user)):
    record = await db.chunked_uploads.find_one({"upload_id": upload_id, "user_id": user["_id"]})
    if not record:
        raise HTTPException(status_code=404, detail="Upload not found")

    if len(record["received_chunks"]) < record["total_chunks"]:
        raise HTTPException(status_code=400, detail=f"Missing chunks: received {len(record['received_chunks'])}/{record['total_chunks']}")

    # Reassemble chunks
    sorted_indices = sorted(record["received_chunks"])
    assembled = bytearray()
    for idx in sorted_indices:
        chunk_path = f"{APP_NAME}/chunks/{upload_id}/{idx}"
        try:
            chunk_data, _ = get_object(chunk_path)
            assembled.extend(chunk_data)
        except Exception as e:
            logger.error(f"Failed to get chunk {idx}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to reassemble chunk {idx}")

    ext = record["filename"].split(".")[-1].lower() if "." in record["filename"] else "bin"
    file_id = str(uuid.uuid4())
    final_path = f"{APP_NAME}/uploads/{record['user_id']}/{file_id}.{ext}"
    result = put_object(final_path, bytes(assembled), record["content_type"])

    is_video = record["content_type"].startswith("video")
    thumbnail_url = ""

    if is_video:
        try:
            thumbnail_url = await generate_video_thumbnail(bytes(assembled), record["user_id"], file_id)
        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")

    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": record["filename"],
        "content_type": record["content_type"],
        "size": result["size"],
        "user_id": record["user_id"],
        "is_video": is_video,
        "thumbnail_url": thumbnail_url,
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc)
    })

    await db.chunked_uploads.update_one({"upload_id": upload_id}, {"$set": {"status": "completed"}})

    return {"path": result["path"], "url": f"/api/files/{result['path']}", "thumbnail_url": thumbnail_url, "is_video": is_video}

async def generate_video_thumbnail(video_data: bytes, user_id: str, file_id: str) -> str:
    """Extract a frame from video at 1s using ffmpeg and upload as thumbnail."""
    with tempfile.TemporaryDirectory() as tmpdir:
        video_path = os.path.join(tmpdir, "input.mp4")
        thumb_path = os.path.join(tmpdir, "thumb.jpg")
        with open(video_path, "wb") as f:
            f.write(video_data)

        proc = await asyncio.to_thread(
            subprocess.run,
            ["ffmpeg", "-i", video_path, "-ss", "00:00:01", "-vframes", "1", "-vf", "scale=640:-1", "-q:v", "4", thumb_path, "-y"],
            capture_output=True, timeout=30
        )

        if proc.returncode != 0 or not os.path.exists(thumb_path):
            # Try frame at 0s if 1s fails (short video)
            proc = await asyncio.to_thread(
                subprocess.run,
                ["ffmpeg", "-i", video_path, "-vframes", "1", "-vf", "scale=640:-1", "-q:v", "4", thumb_path, "-y"],
                capture_output=True, timeout=30
            )

        if os.path.exists(thumb_path):
            with open(thumb_path, "rb") as f:
                thumb_data = f.read()
            thumb_storage_path = f"{APP_NAME}/thumbnails/{user_id}/{file_id}.jpg"
            put_object(thumb_storage_path, thumb_data, "image/jpeg")
            return f"/api/files/{thumb_storage_path}"

    return ""

@api_router.get("/files/{path:path}")
async def download_file(path: str, request: Request, authorization: str = Header(None), auth: str = Query(None)):
    auth_header = authorization or (f"Bearer {auth}" if auth else None)

    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        # Also check thumbnails (no auth record needed)
        if "/thumbnails/" in path:
            try:
                data, content_type = get_object(path)
                return Response(content=data, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})
            except Exception:
                raise HTTPException(status_code=404, detail="File not found")
        raise HTTPException(status_code=404, detail="File not found")

    content_type = record.get("content_type", "application/octet-stream")
    data, _ = get_object(path)
    total_size = len(data)

    # Support Range requests for video streaming
    range_header = request.headers.get("range")
    if range_header and content_type.startswith("video"):
        try:
            range_spec = range_header.replace("bytes=", "")
            parts = range_spec.split("-")
            start = int(parts[0]) if parts[0] else 0
            end = int(parts[1]) if parts[1] else total_size - 1
            end = min(end, total_size - 1)
            chunk = data[start:end + 1]
            return Response(
                content=chunk,
                status_code=206,
                media_type=content_type,
                headers={
                    "Content-Range": f"bytes {start}-{end}/{total_size}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(len(chunk)),
                    "Cache-Control": "public, max-age=3600",
                }
            )
        except Exception:
            pass

    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Accept-Ranges": "bytes",
            "Content-Length": str(total_size),
            "Cache-Control": "public, max-age=3600" if content_type.startswith(("image", "video")) else "no-cache",
        }
    )

# Helper: batch-enrich posts with user verification status and role
async def enrich_posts_verified(posts):
    user_ids = list({p["user_id"] for p in posts if p.get("user_id")})
    if not user_ids:
        return
    users = await db.users.find({"_id": {"$in": [ObjectId(uid) for uid in user_ids]}}, {"_id": 1, "is_verified": 1, "role": 1}).to_list(len(user_ids))
    user_map = {str(u["_id"]): u for u in users}
    for p in posts:
        u = user_map.get(p.get("user_id", ""), {})
        p["user_is_verified"] = u.get("is_verified", False)
        p["user_role"] = u.get("role", "user")

@api_router.post("/posts")
async def create_post(post: PostCreate, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["_id"],
        "user_name": user["name"],
        "user_username": user.get("username", ""),
        "user_image": user.get("profile_image", ""),
        "content_text": post.content_text,
        "image_url": post.image_url or "",
        "video_url": post.video_url or "",
        "thumbnail_url": post.thumbnail_url or "",
        "likes": [],
        "comments": [],
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.posts.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/posts")
async def get_posts(skip: int = 0, limit: int = 20):
    posts = await db.posts.find({}, {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
    await enrich_posts_verified(posts)
    return posts

@api_router.get("/posts/trending")
async def get_trending_posts(limit: int = 10):
    """Posts ranked by engagement (likes + comments). Returns top N."""
    pipeline = [
        {"$addFields": {
            "engagement": {"$add": [{"$size": {"$ifNull": ["$likes", []]}}, {"$size": {"$ifNull": ["$comments", []]}}]}
        }},
        {"$sort": {"engagement": -1, "created_at": -1}},
        {"$limit": limit},
        {"$project": {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1, "engagement": 1}}
    ]
    posts = await db.posts.aggregate(pipeline).to_list(limit)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
        p["is_trending"] = True
    await enrich_posts_verified(posts)
    return posts

@api_router.get("/posts/suggested")
async def get_suggested_posts(request: Request, limit: int = 6):
    """Random media-first posts the user hasn't seen recently. For discovery."""
    pipeline = [
        {"$addFields": {"has_media": {"$or": [
            {"$gt": [{"$strLenCP": {"$ifNull": ["$image_url", ""]}}, 0]},
            {"$gt": [{"$strLenCP": {"$ifNull": ["$video_url", ""]}}, 0]}
        ]}}},
        {"$sort": {"has_media": -1}},
        {"$sample": {"size": limit}},
        {"$project": {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1}}
    ]
    posts = await db.posts.aggregate(pipeline).to_list(limit)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
    await enrich_posts_verified(posts)
    return posts

@api_router.get("/feed/unified")
async def get_unified_feed(request: Request, skip: int = 0, limit: int = 12):
    """Unified feed: posts + injected events, churches, products."""
    # Get current user for personalization
    current_user = None
    token = request.cookies.get("token")
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            current_user = await db.users.find_one({"_id": ObjectId(payload["user_id"])})
        except Exception:
            pass

    user_id = str(current_user["_id"]) if current_user else None

    # Fetch posts
    posts = await db.posts.find(
        {}, {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    items = []
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
        p["item_type"] = "post"
        items.append(p)
    await enrich_posts_verified(items)

    # Inject events (2 upcoming, randomized position)
    events = await db.events.find({}).sort("date", 1).limit(3).to_list(3)
    for ev in events:
        ev["_id"] = str(ev["_id"])
        if "_id" in ev:
            pass
        ev["item_type"] = "event"
        ev["attendees_count"] = await db.event_registrations.count_documents({"event_id": ev["_id"]})
        if user_id:
            ev["is_registered"] = await db.event_registrations.count_documents({"event_id": ev["_id"], "user_id": user_id}) > 0
        else:
            ev["is_registered"] = False

    # Inject churches (2 random)
    churches_pipeline = [{"$sample": {"size": 2}}, {"$project": {"_id": 1, "name": 1, "location": 1, "cover_image": 1, "followers": 1, "service_times": 1, "description": 1, "status": 1}}]
    churches = await db.churches.aggregate(churches_pipeline).to_list(2)
    for ch in churches:
        ch["_id"] = str(ch["_id"])
        ch["item_type"] = "church"
        ch["followers_count"] = len(ch.get("followers", []))
        ch.pop("followers", None)

    # Inject products (1 random)
    products = await db.products.aggregate([{"$sample": {"size": 1}}]).to_list(1)
    for pr in products:
        pr["_id"] = str(pr["_id"])
        pr["item_type"] = "product"

    # Merge into feed: insert events/churches/products at specific positions
    feed = list(items)
    injections = []
    if len(events) > 0 and skip == 0:
        injections.append((3, events[0]))
    if len(churches) > 0 and skip == 0:
        injections.append((6, churches[0]))
    if len(events) > 1 and skip == 0:
        injections.append((9, events[1]))
    if len(products) > 0 and skip == 0:
        injections.append((12, products[0]))
    if len(churches) > 1:
        injections.append((15, churches[1]))
    if len(events) > 2:
        injections.append((18, events[2]))

    # Insert at positions (reverse order to maintain indices)
    for pos, item in sorted(injections, key=lambda x: x[0], reverse=True):
        if pos <= len(feed):
            feed.insert(pos, item)

    return {"items": feed, "has_more": len(items) == limit}

@api_router.get("/posts/{post_id}")
async def get_post(post_id: str):
    post = await db.posts.find_one({"_id": ObjectId(post_id)}, {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post["_id"] = str(post["_id"])
    post["likes_count"] = len(post.get("likes", []))
    post["comments_count"] = len(post.get("comments", []))
    return post

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, user: dict = Depends(get_current_user)):
    result = await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$addToSet": {"likes": user["_id"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    if result.modified_count > 0:
        post = await db.posts.find_one({"_id": ObjectId(post_id)}, {"user_id": 1, "content_text": 1})
        if post and post.get("user_id") != user["_id"]:
            snippet = (post.get("content_text", "") or "")[:40]
            await create_notification(post["user_id"], user["_id"], user.get("name", ""), user.get("profile_image", ""), "like", f'{user.get("name","")} liked your post{": " + snippet if snippet else ""}', post_id)
    return {"message": "Liked"}

@api_router.delete("/posts/{post_id}/like")
async def unlike_post(post_id: str, user: dict = Depends(get_current_user)):
    result = await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$pull": {"likes": user["_id"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Unliked"}

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["user_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.posts.delete_one({"_id": ObjectId(post_id)})
    return {"message": "Post deleted"}

# Comments endpoints
@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, content: dict, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "user_name": user["name"],
        "user_username": user.get("username", ""),
        "text": content.get("text", "") or content.get("content", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$push": {"comments": comment}}
    )
    # Notify post author
    if post.get("user_id") != user["_id"]:
        snippet = (comment["text"] or "")[:40]
        await create_notification(post["user_id"], user["_id"], user.get("name", ""), user.get("profile_image", ""), "comment", f'{user.get("name","")} commented: "{snippet}"', post_id)
    return comment

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    post = await db.posts.find_one({"_id": ObjectId(post_id)}, {"comments": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post.get("comments", [])

@api_router.delete("/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Find the comment and check ownership
    comment = next((c for c in post.get("comments", []) if c["id"] == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if comment["user_id"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$pull": {"comments": {"id": comment_id}}}
    )
    return {"message": "Comment deleted"}

@api_router.post("/churches")
async def create_church(church: ChurchCreate, user: dict = Depends(get_current_user)):
    doc = {
        "name": church.name,
        "description": church.description,
        "location": church.location,
        "service_times": church.service_times or "",
        "cover_image": church.cover_image or "",
        "state": church.state or "",
        "city": church.city or "",
        "languages": church.languages or [],
        "followers": [],
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.churches.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/churches")
async def get_churches(skip: int = 0, limit: int = 20, state: str = "", language: str = "", search: str = ""):
    query = {}
    if state:
        query["state"] = state
    if language:
        query["languages"] = language
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"state": {"$regex": search, "$options": "i"}},
        ]
    churches = await db.churches.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for c in churches:
        c["_id"] = str(c["_id"])
        c["followers_count"] = len(c.get("followers", []))
    return churches

@api_router.get("/churches/{church_id}")
async def get_church(church_id: str, request: Request):
    church = await db.churches.find_one({"_id": ObjectId(church_id)})
    if not church:
        raise HTTPException(status_code=404, detail="Church not found")
    church["_id"] = str(church["_id"])
    church["followers_count"] = len(church.get("followers", []))

    # Check if current user is following
    try:
        current = await get_current_user(request)
        church["is_following"] = current["_id"] in church.get("followers", [])
        church["is_owner"] = current["_id"] == church.get("created_by")
    except Exception:
        church["is_following"] = False
        church["is_owner"] = False

    # Get owner info
    owner = await db.users.find_one({"_id": ObjectId(church["created_by"])}, {"_id": 1, "name": 1, "username": 1, "profile_image": 1})
    if owner:
        church["owner_name"] = owner.get("name", "")
        church["owner_username"] = owner.get("username", "")

    # Get posts and events counts
    posts_count = await db.posts.count_documents({"user_id": church["created_by"]})
    church["posts_count"] = posts_count
    events_count = await db.events.count_documents({"church_id": church["_id"]})
    if events_count == 0:
        events_count = await db.events.count_documents({"created_by": church["created_by"]})
    church["events_count"] = events_count

    church.pop("followers", None)
    return church

@api_router.put("/churches/{church_id}")
async def update_church(church_id: str, church: ChurchUpdate, user: dict = Depends(get_current_user)):
    existing = await db.churches.find_one({"_id": ObjectId(church_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Church not found")
    if existing["created_by"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {k: v for k, v in church.model_dump().items() if v is not None}
    if update_data:
        await db.churches.update_one({"_id": ObjectId(church_id)}, {"$set": update_data})
    updated = await db.churches.find_one({"_id": ObjectId(church_id)}, {"_id": 1, "name": 1, "description": 1, "location": 1, "service_times": 1, "cover_image": 1, "created_by": 1})
    updated["_id"] = str(updated["_id"])
    return updated

@api_router.get("/churches/{church_id}/posts")
async def get_church_posts(church_id: str, skip: int = 0, limit: int = 20):
    church = await db.churches.find_one({"_id": ObjectId(church_id)}, {"created_by": 1})
    if not church:
        raise HTTPException(status_code=404, detail="Church not found")

    posts = await db.posts.find(
        {"user_id": church["created_by"]},
        {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
    return posts

@api_router.get("/churches/{church_id}/events")
async def get_church_events(church_id: str, request: Request, skip: int = 0, limit: int = 20):
    church = await db.churches.find_one({"_id": ObjectId(church_id)}, {"created_by": 1})
    if not church:
        raise HTTPException(status_code=404, detail="Church not found")

    current_user_id = None
    try:
        current = await get_current_user(request)
        current_user_id = current["_id"]
    except Exception:
        pass

    # Events linked by church_id or created_by the church owner
    events = await db.events.find(
        {"$or": [{"church_id": church_id}, {"created_by": church["created_by"]}]},
        {"_id": 1, "title": 1, "description": 1, "date": 1, "location": 1, "price": 1, "cover_image": 1, "created_by": 1, "church_id": 1, "created_at": 1}
    ).sort("date", 1).skip(skip).limit(limit).to_list(limit)
    for e in events:
        e["_id"] = str(e["_id"])
        registrations_count = await db.event_registrations.count_documents({"event_id": e["_id"]})
        e["attendees_count"] = registrations_count
        if current_user_id:
            reg = await db.event_registrations.find_one({"event_id": e["_id"], "user_id": current_user_id})
            e["is_registered"] = reg is not None
        else:
            e["is_registered"] = False
    return events

@api_router.post("/churches/{church_id}/follow")
async def follow_church(church_id: str, user: dict = Depends(get_current_user)):
    result = await db.churches.update_one(
        {"_id": ObjectId(church_id)},
        {"$addToSet": {"followers": user["_id"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Church not found")
    return {"message": "Followed"}

@api_router.delete("/churches/{church_id}/follow")
async def unfollow_church(church_id: str, user: dict = Depends(get_current_user)):
    result = await db.churches.update_one(
        {"_id": ObjectId(church_id)},
        {"$pull": {"followers": user["_id"]}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Church not found")
    return {"message": "Unfollowed"}

@api_router.get("/users/me/church")
async def get_my_church(user: dict = Depends(get_current_user)):
    church = await db.churches.find_one({"created_by": user["_id"]}, {"_id": 1, "name": 1, "description": 1, "location": 1, "service_times": 1, "cover_image": 1, "followers": 1, "created_by": 1, "created_at": 1})
    if not church:
        return {"church": None}
    church["_id"] = str(church["_id"])
    church["followers_count"] = len(church.get("followers", []))
    church.pop("followers", None)
    return church

@api_router.post("/events")
async def create_event(event: EventCreate, user: dict = Depends(get_current_user)):
    doc = {
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "location": event.location,
        "price": event.price or 0.0,
        "cover_image": event.cover_image or "",
        "church_id": event.church_id or "",
        "state": event.state or "",
        "city": event.city or "",
        "languages": event.languages or [],
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc)
    }
    # If church_id provided, store the church name for display
    if event.church_id:
        church = await db.churches.find_one({"_id": ObjectId(event.church_id)}, {"name": 1})
        if church:
            doc["church_name"] = church["name"]
    result = await db.events.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/events")
async def get_events(request: Request, skip: int = 0, limit: int = 20, state: str = "", language: str = "", search: str = ""):
    query = {}
    if state:
        query["state"] = state
    if language:
        query["languages"] = language
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"state": {"$regex": search, "$options": "i"}},
        ]
    events = await db.events.find(query).sort("date", 1).skip(skip).limit(limit).to_list(limit)

    # Try to get current user for registration status
    current_user_id = None
    try:
        current = await get_current_user(request)
        current_user_id = current["_id"]
    except Exception:
        pass

    result = []
    for e in events:
        e["_id"] = str(e["_id"])
        registrations_count = await db.event_registrations.count_documents({"event_id": e["_id"]})
        e["attendees_count"] = registrations_count

        # Check if current user is registered
        if current_user_id:
            reg = await db.event_registrations.find_one({"event_id": e["_id"], "user_id": current_user_id})
            e["is_registered"] = reg is not None
        else:
            e["is_registered"] = False

        # Get church name if church_id exists
        if e.get("church_id"):
            church = await db.churches.find_one({"_id": ObjectId(e["church_id"])}, {"name": 1})
            if church:
                e["church_name"] = church.get("name", "")

        # Get creator info
        if e.get("created_by"):
            creator = await db.users.find_one({"_id": ObjectId(e["created_by"])}, {"name": 1, "username": 1})
            if creator:
                e["creator_name"] = creator.get("name", "")

        e.pop("_id_obj", None)
        result.append(e)
    return result

@api_router.get("/events/{event_id}")
async def get_event(event_id: str, request: Request):
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event["_id"] = str(event["_id"])
    registrations_count = await db.event_registrations.count_documents({"event_id": event["_id"]})
    event["attendees_count"] = registrations_count

    # Check if current user is registered and is creator
    try:
        current = await get_current_user(request)
        reg = await db.event_registrations.find_one({"event_id": event["_id"], "user_id": current["_id"]})
        event["is_registered"] = reg is not None
        event["is_creator"] = current["_id"] == event.get("created_by")
    except Exception:
        event["is_registered"] = False
        event["is_creator"] = False

    # Get church info
    if event.get("church_id"):
        church = await db.churches.find_one({"_id": ObjectId(event["church_id"])}, {"_id": 1, "name": 1, "location": 1})
        if church:
            event["church_name"] = church.get("name", "")
            event["church_obj_id"] = str(church["_id"])

    # Get creator info
    if event.get("created_by"):
        creator = await db.users.find_one({"_id": ObjectId(event["created_by"])}, {"name": 1, "username": 1, "profile_image": 1})
        if creator:
            event["creator_name"] = creator.get("name", "")
            event["creator_username"] = creator.get("username", "")

    # Get attendee previews (first 10 names)
    regs = await db.event_registrations.find({"event_id": event["_id"]}).sort("registered_at", -1).limit(10).to_list(10)
    attendee_ids = [ObjectId(r["user_id"]) for r in regs]
    attendees = await db.users.find({"_id": {"$in": attendee_ids}}, {"_id": 1, "name": 1, "username": 1, "profile_image": 1}).to_list(10)
    event["attendee_previews"] = [{"_id": str(a["_id"]), "name": a.get("name", ""), "username": a.get("username", ""), "profile_image": a.get("profile_image", "")} for a in attendees]

    event.pop("password_hash", None)
    return event

@api_router.post("/events/{event_id}/register")
async def register_for_event(event_id: str, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if already registered
    existing = await db.event_registrations.find_one({"event_id": event_id, "user_id": user["_id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already registered")
    
    registration = {
        "user_id": user["_id"],
        "event_id": event_id,
        "registered_at": datetime.now(timezone.utc)
    }
    await db.event_registrations.insert_one(registration)
    return {"message": "Registration successful"}

@api_router.delete("/events/{event_id}/register")
async def unregister_from_event(event_id: str, user: dict = Depends(get_current_user)):
    result = await db.event_registrations.delete_one({"event_id": event_id, "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"message": "Unregistered"}

@api_router.get("/events/{event_id}/attendees")
async def get_event_attendees(event_id: str, skip: int = 0, limit: int = 50):
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    registrations = await db.event_registrations.find({"event_id": event_id}).sort("registered_at", -1).skip(skip).limit(limit).to_list(limit)
    user_ids = [ObjectId(r["user_id"]) for r in registrations]
    users = await db.users.find({"_id": {"$in": user_ids}}, {"_id": 1, "name": 1, "username": 1, "profile_image": 1}).to_list(limit)

    result = []
    for u in users:
        u["_id"] = str(u["_id"])
        result.append(u)
    return result

@api_router.get("/events/{event_id}/registrations")
async def get_event_registrations(event_id: str, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"_id": ObjectId(event_id)})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Only creator can see registrations
    if str(event.get("created_by")) != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    registrations = await db.event_registrations.find({"event_id": event_id}).to_list(100)
    user_ids = [ObjectId(r["user_id"]) for r in registrations]
    users = await db.users.find({"_id": {"$in": user_ids}}, {"_id": 1, "name": 1, "email": 1, "username": 1}).to_list(100)
    
    result = []
    for reg in registrations:
        user_data = next((u for u in users if str(u["_id"]) == reg["user_id"]), None)
        if user_data:
            user_data["_id"] = str(user_data["_id"])
            result.append({**reg, "user": user_data})
    return result

# Products endpoints
@api_router.post("/products")
async def create_product(product: ProductCreate, user: dict = Depends(get_current_user)):
    doc = {
        "title": product.title,
        "description": product.description,
        "price": product.price,
        "image": product.image or "",
        "created_by": user["_id"],
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.products.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@api_router.get("/products")
async def get_products(request: Request, skip: int = 0, limit: int = 20, search: str = ""):
    query = {}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    products = await db.products.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in products:
        p["_id"] = str(p["_id"])
        creator = await db.users.find_one({"_id": ObjectId(p["created_by"])}, {"_id": 1, "name": 1, "username": 1, "profile_image": 1})
        if creator:
            p["seller_id"] = str(creator["_id"])
            p["seller_name"] = creator.get("name", "")
            p["seller_username"] = creator.get("username", "")
            p["seller_image"] = creator.get("profile_image", "")
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str, request: Request):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["_id"] = str(product["_id"])

    # Get seller info
    creator = await db.users.find_one({"_id": ObjectId(product["created_by"])}, {"_id": 1, "name": 1, "username": 1, "profile_image": 1, "bio": 1, "email": 1})
    if creator:
        product["seller_id"] = str(creator["_id"])
        product["seller_name"] = creator.get("name", "")
        product["seller_username"] = creator.get("username", "")
        product["seller_image"] = creator.get("profile_image", "")
        product["seller_bio"] = creator.get("bio", "")
        product["seller_email"] = creator.get("email", "")

    # Check ownership/admin
    try:
        current = await get_current_user(request)
        product["is_owner"] = current["_id"] == product["created_by"]
        product["is_admin"] = current.get("role") == "admin"
    except Exception:
        product["is_owner"] = False
        product["is_admin"] = False

    return product

@api_router.get("/users/{user_id}/products")
async def get_user_products(user_id: str, skip: int = 0, limit: int = 20):
    products = await db.products.find({"created_by": user_id}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in products:
        p["_id"] = str(p["_id"])
    return products

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"_id": ObjectId(product_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    if existing["created_by"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
    return {"message": "Product updated"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"_id": ObjectId(product_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    if existing["created_by"] != user["_id"] and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted"}

@api_router.get("/users/{user_id}")
async def get_user_profile(user_id: str, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"_id": 1, "email": 1, "name": 1, "username": 1, "bio": 1, "profile_image": 1, "role": 1, "is_verified": 1, "followers": 1, "following": 1, "created_at": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user["followers_count"] = len(user.get("followers", []))
    user["following_count"] = len(user.get("following", []))
    user["is_following"] = current_user["_id"] in user.get("followers", [])
    
    # Get user's posts count
    posts_count = await db.posts.count_documents({"user_id": user_id})
    user["posts_count"] = posts_count
    
    return user

@api_router.get("/users/{user_id}/posts")
async def get_user_posts(user_id: str, skip: int = 0, limit: int = 20):
    posts = await db.posts.find({"user_id": user_id}, {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
    await enrich_posts_verified(posts)
    return posts

# Saved posts endpoints
@api_router.post("/posts/{post_id}/save")
async def save_post(post_id: str, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$addToSet": {"saved_posts": post_id}}
    )
    return {"message": "Post saved"}

@api_router.delete("/posts/{post_id}/save")
async def unsave_post(post_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$pull": {"saved_posts": post_id}}
    )
    return {"message": "Post unsaved"}

@api_router.get("/users/{user_id}/saved")
async def get_saved_posts(user_id: str, user: dict = Depends(get_current_user), skip: int = 0, limit: int = 20):
    if user_id != user["_id"]:
        raise HTTPException(status_code=403, detail="Can only view your own saved posts")
    
    user_data = await db.users.find_one({"_id": ObjectId(user_id)}, {"saved_posts": 1})
    saved_post_ids = user_data.get("saved_posts", [])
    
    if not saved_post_ids:
        return []
    
    # Convert to ObjectIds
    saved_post_ids_obj = [ObjectId(pid) for pid in saved_post_ids if ObjectId.is_valid(pid)]
    posts = await db.posts.find({"_id": {"$in": saved_post_ids_obj}}, {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
    await enrich_posts_verified(posts)
    return posts

@api_router.get("/users/{user_id}/events")
async def get_user_events(user_id: str, skip: int = 0, limit: int = 20):
    # Get events user created
    created_events = await db.events.find({"created_by": user_id}, {"_id": 1, "title": 1, "description": 1, "date": 1, "location": 1, "price": 1, "cover_image": 1, "created_by": 1, "created_at": 1}).sort("date", 1).skip(skip).limit(limit).to_list(limit)
    
    # Get events user is attending
    registrations = await db.event_registrations.find({"user_id": user_id}).to_list(100)
    event_ids = [ObjectId(r["event_id"]) for r in registrations if ObjectId.is_valid(r["event_id"])]
    attending_events = await db.events.find({"_id": {"$in": event_ids}}, {"_id": 1, "title": 1, "description": 1, "date": 1, "location": 1, "price": 1, "cover_image": 1, "created_by": 1, "created_at": 1}).sort("date", 1).to_list(100)
    
    for e in created_events:
        e["_id"] = str(e["_id"])
        e["type"] = "created"
        registrations_count = await db.event_registrations.count_documents({"event_id": e["_id"]})
        e["attendees_count"] = registrations_count
    
    for e in attending_events:
        e["_id"] = str(e["_id"])
        e["type"] = "attending"
        registrations_count = await db.event_registrations.count_documents({"event_id": e["_id"]})
        e["attendees_count"] = registrations_count
    
    return {
        "created": created_events,
        "attending": attending_events
    }

@api_router.get("/explore")
async def get_explore_content(skip: int = 0, limit: int = 20, state: str = "", language: str = "", search: str = ""):
    base_query = {}
    church_query = {}
    event_query = {}
    if state:
        church_query["state"] = state
        event_query["state"] = state
    if language:
        church_query["languages"] = language
        event_query["languages"] = language
    if search:
        base_query["$or"] = [
            {"content_text": {"$regex": search, "$options": "i"}},
            {"user_name": {"$regex": search, "$options": "i"}},
        ]
        church_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"city": {"$regex": search, "$options": "i"}},
            {"state": {"$regex": search, "$options": "i"}},
        ]
        event_query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"state": {"$regex": search, "$options": "i"}},
        ]

    posts = await db.posts.find(base_query, {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "created_at": 1}).sort("created_at", -1).limit(5).to_list(5)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["type"] = "post"
        p["likes_count"] = len(p.get("likes", []))
    
    churches = await db.churches.find(church_query).sort("created_at", -1).limit(5).to_list(5)
    for c in churches:
        c["_id"] = str(c["_id"])
        c["type"] = "church"
        c["followers_count"] = len(c.get("followers", []))
    
    events = await db.events.find(event_query).sort("date", 1).limit(5).to_list(5)
    for e in events:
        e["_id"] = str(e["_id"])
        e["type"] = "event"
        e["attendees_count"] = len(e.get("attendees", []))
    
    # Trending users (most followers)
    users = await db.users.find({}, {"_id": 1, "name": 1, "bio": 1, "profile_image": 1, "role": 1, "followers": 1}).to_list(100)
    users_sorted = sorted(users, key=lambda x: len(x.get("followers", [])), reverse=True)[:5]
    for u in users_sorted:
        u["_id"] = str(u["_id"])
        u["type"] = "user"
        u["followers_count"] = len(u.get("followers", []))
        u.pop("followers", None)
    
    # Get products
    products = await db.products.find({}, {"_id": 1, "title": 1, "description": 1, "price": 1, "image": 1, "created_by": 1}).sort("created_at", -1).limit(5).to_list(5)
    for prod in products:
        prod["_id"] = str(prod["_id"])
        prod["type"] = "product"
    
    return {
        "posts": posts,
        "churches": churches,
        "events": events,
        "products": products,
        "trending_users": users_sorted
    }

@api_router.get("/search")
async def unified_search(q: str = "", limit: int = 8):
    """Unified search across posts, churches, events, and users."""
    if not q or len(q.strip()) < 2:
        return {"posts": [], "churches": [], "events": [], "users": [], "counts": {"posts": 0, "churches": 0, "events": 0, "users": 0}}

    regex = {"$regex": q, "$options": "i"}

    # Search all collections in parallel-ish
    post_query = {"$or": [{"content_text": regex}, {"user_name": regex}]}
    posts = await db.posts.find(post_query, {"_id": 1, "user_id": 1, "user_name": 1, "user_username": 1, "user_image": 1, "content_text": 1, "image_url": 1, "video_url": 1, "thumbnail_url": 1, "likes": 1, "comments": 1, "created_at": 1}).sort("created_at", -1).limit(limit).to_list(limit)
    posts_total = await db.posts.count_documents(post_query)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
    await enrich_posts_verified(posts)

    church_query = {"$or": [{"name": regex}, {"city": regex}, {"state": regex}, {"description": regex}]}
    churches = await db.churches.find(church_query).sort("created_at", -1).limit(limit).to_list(limit)
    churches_total = await db.churches.count_documents(church_query)
    for c in churches:
        c["_id"] = str(c["_id"])
        c["followers_count"] = len(c.get("followers", []))
        c.pop("followers", None)

    event_query = {"$or": [{"title": regex}, {"location": regex}, {"description": regex}, {"state": regex}]}
    events = await db.events.find(event_query).sort("date", -1).limit(limit).to_list(limit)
    events_total = await db.events.count_documents(event_query)
    for e in events:
        e["_id"] = str(e["_id"])
        e["attendees_count"] = await db.event_registrations.count_documents({"event_id": e["_id"]})

    user_query = {"$or": [{"name": regex}, {"username": regex}, {"bio": regex}], "status": "active"}
    users = await db.users.find(user_query, {"_id": 1, "name": 1, "username": 1, "bio": 1, "profile_image": 1, "role": 1, "is_verified": 1, "followers": 1}).sort("created_at", -1).limit(limit).to_list(limit)
    users_total = await db.users.count_documents(user_query)
    for u in users:
        u["_id"] = str(u["_id"])
        u["followers_count"] = len(u.get("followers", []))
        u.pop("followers", None)

    return {
        "posts": posts,
        "churches": churches,
        "events": events,
        "users": users,
        "counts": {"posts": posts_total, "churches": churches_total, "events": events_total, "users": users_total}
    }

@api_router.put("/users/me")
async def update_profile(update: UserUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$set": update_data}
        )
    updated_user = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"_id": 1, "email": 1, "name": 1, "bio": 1, "profile_image": 1, "state": 1, "city": 1, "languages": 1, "followers": 1, "following": 1, "role": 1})
    updated_user["_id"] = str(updated_user["_id"])
    updated_user.pop("password_hash", None)
    return updated_user

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, user: dict = Depends(get_current_user)):
    if user["_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$addToSet": {"following": user_id}}
    )
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"followers": user["_id"]}}
    )
    await create_notification(user_id, user["_id"], user.get("name", ""), user.get("profile_image", ""), "follow", f'{user.get("name","")} started following you', user["_id"])
    return {"message": "Followed"}

@api_router.delete("/users/{user_id}/follow")
async def unfollow_user(user_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$pull": {"following": user_id}}
    )
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"followers": user["_id"]}}
    )
    return {"message": "Unfollowed"}

@api_router.get("/users/{user_id}/followers")
async def get_followers(user_id: str, user: dict = Depends(get_current_user)):
    target = await db.users.find_one({"_id": ObjectId(user_id)}, {"followers": 1})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    follower_ids = target.get("followers", [])
    if not follower_ids:
        return {"users": []}
    users = await db.users.find({"_id": {"$in": [ObjectId(fid) for fid in follower_ids]}}, {"_id": 1, "name": 1, "username": 1, "bio": 1, "profile_image": 1, "role": 1, "is_verified": 1, "followers": 1}).to_list(200)
    my_following = set((await db.users.find_one({"_id": ObjectId(user["_id"])}, {"following": 1}) or {}).get("following", []))
    result = []
    for u in users:
        u["_id"] = str(u["_id"])
        u["followers_count"] = len(u.get("followers", []))
        u["is_following"] = u["_id"] in my_following
        u.pop("followers", None)
        result.append(u)
    return {"users": result}

@api_router.get("/users/{user_id}/following-list")
async def get_following_list(user_id: str, user: dict = Depends(get_current_user)):
    target = await db.users.find_one({"_id": ObjectId(user_id)}, {"following": 1})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    following_ids = target.get("following", [])
    if not following_ids:
        return {"users": []}
    users = await db.users.find({"_id": {"$in": [ObjectId(fid) for fid in following_ids]}}, {"_id": 1, "name": 1, "username": 1, "bio": 1, "profile_image": 1, "role": 1, "is_verified": 1, "followers": 1}).to_list(200)
    my_following = set((await db.users.find_one({"_id": ObjectId(user["_id"])}, {"following": 1}) or {}).get("following", []))
    result = []
    for u in users:
        u["_id"] = str(u["_id"])
        u["followers_count"] = len(u.get("followers", []))
        u["is_following"] = u["_id"] in my_following
        u.pop("followers", None)
        result.append(u)
    return {"users": result}

# ============ RECENT SEARCHES ============
@api_router.post("/search/recent")
async def save_recent_search(body: dict, user: dict = Depends(get_current_user)):
    query = body.get("query", "").strip()
    if not query or len(query) < 2:
        return {"message": "Ignored"}
    await db.recent_searches.update_one(
        {"user_id": user["_id"]},
        {"$pull": {"queries": {"text": query}}}
    )
    await db.recent_searches.update_one(
        {"user_id": user["_id"]},
        {"$push": {"queries": {"$each": [{"text": query, "ts": datetime.now(timezone.utc).isoformat()}], "$position": 0, "$slice": 8}}},
        upsert=True
    )
    return {"message": "Saved"}

@api_router.get("/search/recent")
async def get_recent_searches(user: dict = Depends(get_current_user)):
    doc = await db.recent_searches.find_one({"user_id": user["_id"]}, {"_id": 0, "queries": 1})
    return {"queries": (doc or {}).get("queries", [])}

@api_router.delete("/search/recent")
async def clear_recent_searches(user: dict = Depends(get_current_user)):
    await db.recent_searches.delete_one({"user_id": user["_id"]})
    return {"message": "Cleared"}

# ============ NOTIFICATIONS ============
async def create_notification(recipient_id: str, sender_id: str, sender_name: str, sender_image: str, notif_type: str, message: str, ref_id: str = ""):
    if recipient_id == sender_id:
        return
    notif = {
        "recipient_id": recipient_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "sender_image": sender_image or "",
        "type": notif_type,
        "message": message,
        "ref_id": ref_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notif)

@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user), skip: int = 0, limit: int = 30):
    notifs = await db.notifications.find({"recipient_id": user["_id"]}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for n in notifs:
        n["_id"] = str(n["_id"])
    unread = await db.notifications.count_documents({"recipient_id": user["_id"], "read": False})
    return {"notifications": notifs, "unread_count": unread}

@api_router.get("/notifications/unread-count")
async def get_unread_count(user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"recipient_id": user["_id"], "read": False})
    return {"unread_count": count}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"recipient_id": user["_id"], "read": False}, {"$set": {"read": True}})
    return {"message": "All marked read"}

@api_router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"_id": ObjectId(notif_id), "recipient_id": user["_id"]}, {"$set": {"read": True}})
    return {"message": "Marked read"}

# ============ MESSAGING (DMs) ============
@api_router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    convos = await db.conversations.find({"participants": user["_id"]}).sort("updated_at", -1).to_list(50)
    result = []
    for c in convos:
        other_id = [p for p in c["participants"] if p != user["_id"]]
        other_id = other_id[0] if other_id else None
        other_user = None
        if other_id:
            other_user = await db.users.find_one({"_id": ObjectId(other_id)}, {"_id": 1, "name": 1, "username": 1, "profile_image": 1, "is_verified": 1})
            if other_user:
                other_user["_id"] = str(other_user["_id"])
        unread = await db.messages.count_documents({"conversation_id": str(c["_id"]), "sender_id": {"$ne": user["_id"]}, "read": False})
        result.append({
            "_id": str(c["_id"]),
            "other_user": other_user,
            "last_message": c.get("last_message", ""),
            "last_message_at": c.get("updated_at", ""),
            "unread_count": unread
        })
    return {"conversations": result}

@api_router.post("/conversations")
async def create_or_get_conversation(body: dict, user: dict = Depends(get_current_user)):
    other_id = body.get("user_id")
    if not other_id or other_id == user["_id"]:
        raise HTTPException(status_code=400, detail="Invalid user")
    participants = sorted([user["_id"], other_id])
    existing = await db.conversations.find_one({"participants": {"$all": participants, "$size": 2}})
    if existing:
        return {"conversation_id": str(existing["_id"])}
    result = await db.conversations.insert_one({
        "participants": participants,
        "last_message": "",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"conversation_id": str(result.inserted_id)}

@api_router.get("/conversations/{convo_id}/messages")
async def get_messages(convo_id: str, user: dict = Depends(get_current_user), skip: int = 0, limit: int = 50):
    convo = await db.conversations.find_one({"_id": ObjectId(convo_id)})
    if not convo or user["_id"] not in convo.get("participants", []):
        raise HTTPException(status_code=403, detail="Not authorized")
    # Mark messages as read
    await db.messages.update_many({"conversation_id": convo_id, "sender_id": {"$ne": user["_id"]}, "read": False}, {"$set": {"read": True}})
    msgs = await db.messages.find({"conversation_id": convo_id}).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    for m in msgs:
        m["_id"] = str(m["_id"])
    return {"messages": msgs}

@api_router.post("/conversations/{convo_id}/messages")
async def send_message(convo_id: str, body: dict, user: dict = Depends(get_current_user)):
    text = body.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")
    convo = await db.conversations.find_one({"_id": ObjectId(convo_id)})
    if not convo or user["_id"] not in convo.get("participants", []):
        raise HTTPException(status_code=403, detail="Not authorized")
    msg = {
        "conversation_id": convo_id,
        "sender_id": user["_id"],
        "sender_name": user.get("name", ""),
        "text": text,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.messages.insert_one(msg)
    await db.conversations.update_one({"_id": ObjectId(convo_id)}, {"$set": {"last_message": text[:100], "updated_at": msg["created_at"]}})
    # Notify the other user
    other_id = [p for p in convo["participants"] if p != user["_id"]]
    if other_id:
        await create_notification(other_id[0], user["_id"], user.get("name", ""), user.get("profile_image", ""), "message", f"{user.get('name','')} sent you a message", convo_id)
    msg["_id"] = str(result.inserted_id)
    return msg

@api_router.get("/messages/unread-count")
async def get_messages_unread_count(user: dict = Depends(get_current_user)):
    # Get all conversation IDs for user
    convos = await db.conversations.find({"participants": user["_id"]}, {"_id": 1}).to_list(100)
    convo_ids = [str(c["_id"]) for c in convos]
    if not convo_ids:
        return {"unread_count": 0}
    count = await db.messages.count_documents({"conversation_id": {"$in": convo_ids}, "sender_id": {"$ne": user["_id"]}, "read": False})
    return {"unread_count": count}

# ============ ADMIN ENDPOINTS ============

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_active_user(user: dict = Depends(get_current_user)):
    status = user.get("status", "active")
    if status == "needs_onboarding":
        raise HTTPException(status_code=403, detail="Please complete onboarding first")
    if status == "pending_approval":
        raise HTTPException(status_code=403, detail="Your account is under review")
    if status == "rejected":
        raise HTTPException(status_code=403, detail="Your account has been rejected")
    return user

async def log_admin_action(admin_id: str, admin_name: str, action_type: str, target_type: str, target_id: str, description: str):
    await db.admin_logs.insert_one({
        "admin_id": admin_id,
        "admin_name": admin_name,
        "action_type": action_type,
        "target_type": target_type,
        "target_id": target_id,
        "description": description,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    users_count = await db.users.count_documents({})
    posts_count = await db.posts.count_documents({})
    churches_count = await db.churches.count_documents({})
    events_count = await db.events.count_documents({})
    products_count = await db.products.count_documents({})
    registrations_count = await db.event_registrations.count_documents({})

    # Counts by role
    role_counts = {}
    for role in ["user", "church", "creator", "admin"]:
        role_counts[role] = await db.users.count_documents({"role": role})

    # Pending approval count
    pending_users_count = await db.users.count_documents({"status": "pending_approval"})

    # Church status counts
    churches_pending = await db.churches.count_documents({"status": "pending"})
    churches_approved = await db.churches.count_documents({"status": {"$ne": "rejected"}})
    churches_rejected = await db.churches.count_documents({"status": "rejected"})

    # Recent activity
    recent_users = await db.users.find({}, {"_id": 1, "name": 1, "email": 1, "created_at": 1}).sort("created_at", -1).limit(5).to_list(5)
    for u in recent_users:
        u["_id"] = str(u["_id"])

    return {
        "users": users_count,
        "posts": posts_count,
        "churches": churches_count,
        "events": events_count,
        "products": products_count,
        "registrations": registrations_count,
        "role_counts": role_counts,
        "pending_users": pending_users_count,
        "churches_pending": churches_pending,
        "churches_approved": churches_approved,
        "churches_rejected": churches_rejected,
        "recent_users": recent_users,
    }

@api_router.get("/admin/users")
async def admin_get_users(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, search: str = ""):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}},
        ]
    users = await db.users.find(query, {"_id": 1, "name": 1, "username": 1, "email": 1, "role": 1, "status": 1, "profile_image": 1, "bio": 1, "state": 1, "city": 1, "languages": 1, "faith_belief": 1, "faith_journey": 1, "church_member": 1, "church_name": 1, "phone": 1, "auth_provider": 1, "is_verified": 1, "created_at": 1}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    for u in users:
        u["_id"] = str(u["_id"])
        u["posts_count"] = await db.posts.count_documents({"user_id": u["_id"]})
    return {"users": users, "total": total}

@api_router.put("/admin/users/{user_id}/role")
async def admin_change_role(user_id: str, role_data: dict, admin: dict = Depends(require_admin)):
    new_role = role_data.get("role")
    if new_role not in ["user", "church", "creator", "admin", "senior_pastor", "pastor", "youth_pastor", "worship_leader"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    if user_id == admin["_id"]:
        raise HTTPException(status_code=400, detail="Cannot change own role")
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": new_role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    target_user = await db.users.find_one({"_id": ObjectId(user_id)}, {"name": 1})
    await log_admin_action(admin["_id"], admin.get("name", "Admin"), "ROLE_CHANGE", "user", user_id, f"Changed {target_user.get('name', 'user')} role to {new_role}")
    return {"message": f"Role updated to {new_role}"}

@api_router.put("/admin/users/{user_id}/status")
async def admin_change_status(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    new_status = body.get("status")
    if new_status not in ["active", "pending_approval", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"status": new_status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    target = await db.users.find_one({"_id": ObjectId(user_id)}, {"name": 1, "email": 1})
    action = "USER_APPROVED" if new_status == "active" else "USER_REJECTED" if new_status == "rejected" else "USER_STATUS_CHANGE"
    await log_admin_action(admin["_id"], admin.get("name", "Admin"), action, "user", user_id, f"{new_status.replace('_', ' ').title()} user: {target.get('name', '') if target else ''}")
    # Notify user of approval/rejection
    if new_status == "active":
        await create_notification(user_id, admin["_id"], "Cross Crafted", "", "admin", "Your account has been approved! Welcome to the community.", "")
    elif new_status == "rejected":
        await create_notification(user_id, admin["_id"], "Cross Crafted", "", "admin", "Your account registration was not approved.", "")
    return {"message": f"User status set to {new_status}"}

@api_router.put("/admin/users/{user_id}/verify")
async def admin_toggle_verify(user_id: str, body: dict, admin: dict = Depends(require_admin)):
    is_verified = bool(body.get("is_verified", False))
    result = await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_verified": is_verified}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    target = await db.users.find_one({"_id": ObjectId(user_id)}, {"name": 1})
    action_label = "VERIFY_USER" if is_verified else "UNVERIFY_USER"
    await log_admin_action(admin["_id"], admin.get("name", "Admin"), action_label, "user", user_id, f"{'Verified' if is_verified else 'Unverified'} user: {target.get('name', '') if target else ''}")
    return {"message": f"User {'verified' if is_verified else 'unverified'}"}

@api_router.get("/admin/pending-users")
async def admin_pending_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({"status": "pending_approval"}).sort("created_at", -1).to_list(100)
    for u in users:
        u["_id"] = str(u["_id"])
        u.pop("password_hash", None)
    return users

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin: dict = Depends(require_admin)):
    if user_id == admin["_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    target = await db.users.find_one({"_id": ObjectId(user_id)}, {"name": 1})
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    # Clean up user data
    await db.posts.delete_many({"user_id": user_id})
    await db.event_registrations.delete_many({"user_id": user_id})
    await db.products.delete_many({"created_by": user_id})
    await log_admin_action(admin["_id"], admin.get("name", "Admin"), "DELETE_USER", "user", user_id, f"Deleted user {target.get('name', 'unknown') if target else 'unknown'}")
    return {"message": "User and related data deleted"}

@api_router.get("/admin/posts")
async def admin_get_posts(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, search: str = ""):
    query = {}
    if search:
        query["content_text"] = {"$regex": search, "$options": "i"}
    posts = await db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.posts.count_documents(query)
    for p in posts:
        p["_id"] = str(p["_id"])
        p["likes_count"] = len(p.get("likes", []))
        p["comments_count"] = len(p.get("comments", []))
        creator = await db.users.find_one({"_id": ObjectId(p["user_id"])}, {"name": 1, "username": 1})
        if creator:
            p["author_name"] = creator.get("name", "")
            p["author_username"] = creator.get("username", "")
    return {"posts": posts, "total": total}

@api_router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, user: dict = Depends(require_admin)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)}, {"content_text": 1})
    result = await db.posts.delete_one({"_id": ObjectId(post_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    snippet = (post.get("content_text", "")[:40] + "...") if post else "post"
    await log_admin_action(user["_id"], user.get("name", "Admin"), "DELETE_POST", "post", post_id, f"Deleted post: {snippet}")
    return {"message": "Post deleted"}

# ── Admin Comments Management ──
@api_router.get("/admin/comments")
async def admin_get_comments(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, search: str = ""):
    """Get all comments across all posts with post context."""
    pipeline = [
        {"$unwind": {"path": "$comments", "includeArrayIndex": "comment_idx"}},
        {"$project": {
            "_id": 0,
            "post_id": {"$toString": "$_id"},
            "post_text": {"$substrCP": [{"$ifNull": ["$content_text", ""]}, 0, 80]},
            "post_author": "$user_name",
            "comment_id": {"$ifNull": ["$comments.id", {"$concat": ["legacy_", {"$toString": "$comment_idx"}]}]},
            "comment_text": {"$ifNull": ["$comments.text", {"$ifNull": ["$comments.content", ""]}]},
            "comment_user_name": "$comments.user_name",
            "comment_user_id": "$comments.user_id",
            "comment_created_at": "$comments.created_at",
        }},
        {"$sort": {"comment_created_at": -1}},
    ]
    if search:
        pipeline.append({"$match": {"$or": [
            {"comment_text": {"$regex": search, "$options": "i"}},
            {"comment_user_name": {"$regex": search, "$options": "i"}},
        ]}})
    total_pipeline = pipeline + [{"$count": "total"}]
    total_result = await db.posts.aggregate(total_pipeline).to_list(1)
    total = total_result[0]["total"] if total_result else 0

    pipeline += [{"$skip": skip}, {"$limit": limit}]
    comments = await db.posts.aggregate(pipeline).to_list(limit)
    return {"comments": comments, "total": total}

@api_router.delete("/admin/comments/{post_id}/{comment_id}")
async def admin_delete_comment(post_id: str, comment_id: str, user: dict = Depends(require_admin)):
    post = await db.posts.find_one({"_id": ObjectId(post_id)}, {"comments": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    comment = next((c for c in post.get("comments", []) if c.get("id") == comment_id), None)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    await db.posts.update_one({"_id": ObjectId(post_id)}, {"$pull": {"comments": {"id": comment_id}}})
    snippet = (comment.get("text", "") or comment.get("content", ""))[:40]
    await log_admin_action(user["_id"], user.get("name", "Admin"), "DELETE_COMMENT", "comment", comment_id, f"Deleted comment by {comment.get('user_name', '?')}: {snippet}")
    return {"message": "Comment deleted"}

@api_router.get("/admin/churches")
async def admin_get_churches(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, search: str = "", status: str = ""):
    query = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if status and status in ["pending", "approved", "rejected", "verified"]:
        if status == "pending":
            query["$or"] = [{"status": "pending"}, {"status": {"$exists": False}}]
        else:
            query["status"] = status
    churches = await db.churches.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.churches.count_documents(query)
    for c in churches:
        c["_id"] = str(c["_id"])
        c["followers_count"] = len(c.get("followers", []))
        c.pop("followers", None)
        creator = await db.users.find_one({"_id": ObjectId(c["created_by"])}, {"name": 1, "username": 1})
        if creator:
            c["creator_name"] = creator.get("name", "")
    return {"churches": churches, "total": total}

@api_router.put("/admin/churches/{church_id}/status")
async def admin_church_status(church_id: str, status_data: dict, user: dict = Depends(require_admin)):
    new_status = status_data.get("status")
    if new_status not in ["approved", "rejected", "pending", "verified"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.churches.update_one({"_id": ObjectId(church_id)}, {"$set": {"status": new_status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Church not found")
    church = await db.churches.find_one({"_id": ObjectId(church_id)}, {"name": 1})
    await log_admin_action(user["_id"], user.get("name", "Admin"), f"CHURCH_{new_status.upper()}", "church", church_id, f"{new_status.capitalize()} church: {church.get('name', '') if church else ''}")
    return {"message": f"Church status set to {new_status}"}

@api_router.delete("/admin/churches/{church_id}")
async def admin_delete_church(church_id: str, user: dict = Depends(require_admin)):
    result = await db.churches.delete_one({"_id": ObjectId(church_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Church not found")
    return {"message": "Church deleted"}

@api_router.get("/admin/events")
async def admin_get_events(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, search: str = ""):
    query = {}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    events = await db.events.find(query).sort("date", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.events.count_documents(query)
    for e in events:
        e["_id"] = str(e["_id"])
        reg_count = await db.event_registrations.count_documents({"event_id": e["_id"]})
        e["attendees_count"] = reg_count
        creator = await db.users.find_one({"_id": ObjectId(e["created_by"])}, {"name": 1})
        if creator:
            e["creator_name"] = creator.get("name", "")
    return {"events": events, "total": total}

@api_router.delete("/admin/events/{event_id}")
async def admin_delete_event(event_id: str, user: dict = Depends(require_admin)):
    event = await db.events.find_one({"_id": ObjectId(event_id)}, {"title": 1})
    result = await db.events.delete_one({"_id": ObjectId(event_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    await db.event_registrations.delete_many({"event_id": event_id})
    await log_admin_action(user["_id"], user.get("name", "Admin"), "DELETE_EVENT", "event", event_id, f"Deleted event: {event.get('title', '') if event else ''}")
    return {"message": "Event and registrations deleted"}

@api_router.get("/admin/products")
async def admin_get_products(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, search: str = ""):
    query = {}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
    products = await db.products.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.products.count_documents(query)
    for p in products:
        p["_id"] = str(p["_id"])
        creator = await db.users.find_one({"_id": ObjectId(p["created_by"])}, {"name": 1, "username": 1})
        if creator:
            p["seller_name"] = creator.get("name", "")
    return {"products": products, "total": total}

@api_router.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, user: dict = Depends(require_admin)):
    product = await db.products.find_one({"_id": ObjectId(product_id)}, {"title": 1})
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    await log_admin_action(user["_id"], user.get("name", "Admin"), "DELETE_PRODUCT", "product", product_id, f"Deleted product: {product.get('title', '') if product else ''}")
    return {"message": "Product deleted"}

@api_router.get("/admin/logs")
async def admin_get_logs(user: dict = Depends(require_admin), skip: int = 0, limit: int = 50, action_type: str = "", date_from: str = "", date_to: str = ""):
    query = {}
    if action_type:
        query["action_type"] = action_type
    if date_from:
        query["timestamp"] = query.get("timestamp", {})
        query["timestamp"]["$gte"] = date_from
    if date_to:
        query["timestamp"] = query.get("timestamp", {})
        query["timestamp"]["$lte"] = date_to + "T23:59:59"
    logs = await db.admin_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.admin_logs.count_documents(query)
    return {"logs": logs, "total": total}

app.include_router(api_router)

# ── CORS ── Allow configurable origins (comma-separated in env)
cors_origins_raw = os.environ.get("CORS_ORIGINS", "*")
if cors_origins_raw == "*":
    cors_origins = ["*"]
else:
    cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──
@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# ── Static file serving for production ──
BUILD_DIR = Path(__file__).parent.parent / "frontend" / "build"

if BUILD_DIR.exists():
    # Serve static assets (JS, CSS, images) — must mount BEFORE catch-all
    static_dir = BUILD_DIR / "static"
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    # SPA catch-all: any non-API, non-health route serves index.html
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        # Serve actual files if they exist in build dir (favicon, manifest, robots.txt, etc.)
        file_path = BUILD_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        # Everything else gets index.html for client-side routing
        return FileResponse(str(BUILD_DIR / "index.html"))
    logger.info(f"Production mode: serving frontend build from {BUILD_DIR}")

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "bookingjosh@gmail.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    admin_phone = os.environ.get("ADMIN_PHONE", "+919052681374")
    admin_username = "admin"
    
    # Migrate: set status="active" for users without a status field
    await db.users.update_many(
        {"status": {"$exists": False}},
        {"$set": {"status": "active"}}
    )

    # First, update all users without usernames
    users_without_username = await db.users.find({"username": {"$exists": False}}).to_list(1000)
    for user in users_without_username:
        # Generate username from name or email
        if user.get("name"):
            base_username = user["name"].lower().replace(" ", "_")
        else:
            base_username = user["email"].split("@")[0]
        
        # Make sure it's unique
        username = base_username
        counter = 1
        while await db.users.find_one({"username": username}):
            username = f"{base_username}{counter}"
            counter += 1
        
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"username": username}}
        )
        logger.info(f"Added username '{username}' to user {user['email']}")
    
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "username": admin_username,
            "password_hash": hashed,
            "name": "Admin",
            "bio": "Platform Administrator",
            "profile_image": "",
            "phone": admin_phone,
            "role": "admin",
            "status": "active",
            "auth_provider": "email",
            "state": "",
            "city": "",
            "languages": [],
            "faith_belief": "",
            "faith_journey": "",
            "church_member": "",
            "followers": [],
            "following": [],
            "created_at": datetime.now(timezone.utc)
        })
        logger.info(f"Admin user created: {admin_email}")
    else:
        # Always ensure admin has correct password, role, status, phone
        update_fields = {"role": "admin", "status": "active", "phone": admin_phone}
        if not verify_password(admin_password, existing.get("password_hash", "")):
            update_fields["password_hash"] = hash_password(admin_password)
        if not existing.get("username"):
            update_fields["username"] = admin_username
        await db.users.update_one(
            {"email": admin_email},
            {"$set": update_fields}
        )
        logger.info(f"Admin ensured: {admin_email}")

    # Also ensure the old admin@crosscrafted.com stays as admin if it exists
    old_admin = await db.users.find_one({"email": "admin@crosscrafted.com"})
    if old_admin and old_admin["email"] != admin_email:
        await db.users.update_one(
            {"email": "admin@crosscrafted.com"},
            {"$set": {"role": "admin", "status": "active"}}
        )

    # Write test credentials file only in dev (when /app/memory exists)
    memory_dir = Path("/app/memory")
    if memory_dir.exists():
        os.makedirs(str(memory_dir), exist_ok=True)
        with open(str(memory_dir / "test_credentials.md"), "w") as f:
            f.write("# Test Credentials\n\n")
            f.write("## Admin Account\n")
            f.write(f"Email: {admin_email}\n")
            f.write(f"Username: {admin_username}\n")
            f.write(f"Password: {admin_password}\n")
            f.write(f"Role: admin\n\n")
            f.write("## Database Collections\n")
            f.write("- users (id, name, username, email, profile_image, bio, role)\n")
            f.write("- posts (id, user_id, content_text, image_url, video_url, created_at)\n")
            f.write("- churches (id, name, description, location, service_times)\n")
            f.write("- events (id, title, description, date, location, price, created_by)\n")
            f.write("- follows (id, follower_id, following_id)\n")
            f.write("- event_registrations (id, user_id, event_id)\n")
            f.write("- products (id, title, description, price, image, created_by)\n")

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # First seed admin and migrate existing users
    await seed_admin()

    # Patch comments missing 'id' field
    try:
        posts_with_comments = await db.posts.find({"comments": {"$elemMatch": {"id": {"$exists": False}}}}).to_list(1000)
        for post in posts_with_comments:
            updated = False
            for comment in post.get("comments", []):
                if "id" not in comment:
                    comment["id"] = str(uuid.uuid4())
                    updated = True
            if updated:
                await db.posts.update_one({"_id": post["_id"]}, {"$set": {"comments": post["comments"]}})
        if posts_with_comments:
            logger.info(f"Patched comment IDs in {len(posts_with_comments)} posts")
    except Exception as e:
        logger.error(f"Comment ID migration failed: {e}")
    
    # Then create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.posts.create_index("user_id")
    await db.posts.create_index("created_at")
    await db.churches.create_index("created_by")
    await db.events.create_index("created_by")
    await db.events.create_index("date")
    await db.event_registrations.create_index([("event_id", 1), ("user_id", 1)], unique=True)
    await db.products.create_index("created_by")
    await db.follows.create_index([("follower_id", 1), ("following_id", 1)], unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.user_sessions.create_index("session_token")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
