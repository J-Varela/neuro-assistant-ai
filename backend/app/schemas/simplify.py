from pydantic import BaseModel
from typing import List

class SimplifyRequest(BaseModel):
    text: str
    support_mode: str

class SimplifyResponse(BaseModel):
    simplified_text: str
    key_points: List[str]
    action_items: List[str]