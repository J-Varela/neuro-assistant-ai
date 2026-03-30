from pydantic import BaseModel, Field
from typing import List, Literal

class SimplifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    support_mode: Literal["general", "adhd", "dyslexia", "autism"] = "general"

class SimplifyResponse(BaseModel):
    simplified_text: str
    key_points: List[str]
    action_items: List[str]