from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class ComplaintCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    customer_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    order_id: str = Field(default="", max_length=100)
    subject: str = Field(min_length=3, max_length=160)
    complaint_text: str = Field(min_length=15, max_length=5000)
    complaint_type: str | None = Field(default=None, max_length=120)
    location: str | None = Field(default=None, max_length=400)


class TextRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    text: str = Field(min_length=3, max_length=5000)


class StatusUpdate(BaseModel):
    status: Literal["Open", "In Progress", "Closed"]
