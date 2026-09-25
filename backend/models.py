from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# Request Models
class OnboardingRequest(BaseModel):
    name: str
    username: str
    phone: Optional[str] = None
    role: Optional[str] = "user"
    city: Optional[str] = None
    state: Optional[str] = None
    bio: Optional[str] = None
    church_name: Optional[str] = None
    languages: Optional[List[str]] = None
    faith_belief: Optional[str] = None
    faith_journey: Optional[str] = None
    church_member: Optional[str] = None

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    username: str
    role: Optional[str] = "user"
    state: Optional[str] = None
    city: Optional[str] = None
    languages: Optional[List[str]] = None
    faith_belief: Optional[str] = None
    faith_journey: Optional[str] = None
    church_member: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    languages: Optional[List[str]] = None

# Posts (formerly Testimonies)
class PostCreate(BaseModel):
    content_text: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

# Churches
class ChurchCreate(BaseModel):
    name: str
    description: str
    location: str
    service_times: Optional[str] = None
    cover_image: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    languages: Optional[List[str]] = None

class ChurchUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    service_times: Optional[str] = None
    cover_image: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    languages: Optional[List[str]] = None

# Events
class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    location: str
    price: Optional[float] = 0.0
    cover_image: Optional[str] = None
    church_id: Optional[str] = None
    created_by: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    languages: Optional[List[str]] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    price: Optional[float] = None
    cover_image: Optional[str] = None

# Products
class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    image: Optional[str] = None

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
