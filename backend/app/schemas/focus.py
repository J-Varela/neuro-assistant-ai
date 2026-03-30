from pydantic import BaseModel, Field
from typing import Literal

class FocusRequest(BaseModel):
    step_text: str = Field(min_length=1, max_length=500)
    duration_minutes: int = Field(default=25, ge=1, le=120)
    support_mode: Literal["general", "adhd", "dyslexia", "autism"] = "general"

class FocusResponse(BaseModel):
    step_text: str
    duration_minutes: int
    supportive_prompt: str