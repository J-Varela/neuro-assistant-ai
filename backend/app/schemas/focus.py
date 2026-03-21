from pydantic import BaseModel

class FocusRequest(BaseModel):
    step_text: str
    duration_minutes: int

class FocusResponse(BaseModel):
    step_text: str
    duration_minutes: int
    supportive_prompt: str