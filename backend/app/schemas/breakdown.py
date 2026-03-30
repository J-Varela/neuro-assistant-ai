from pydantic import BaseModel, Field
from typing import List, Literal

class BreakdownRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    support_mode: Literal["general", "adhd", "dyslexia", "autism"] = "general"

class BreakdownResponse(BaseModel):
    goal: str
    steps: List[str]
    next_step: str
    estimated_effort: str

