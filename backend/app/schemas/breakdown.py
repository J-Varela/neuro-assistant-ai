from pydantic import BaseModel
from typing import List

class BreakdownRequest(BaseModel):
    text: str
    support_mode: str

class BreakdownResponse(BaseModel):
    goal: str
    steps: List[str]
    next_step: str
    estimated_effort: str

