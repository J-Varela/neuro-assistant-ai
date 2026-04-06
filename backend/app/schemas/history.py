from typing import Any

from pydantic import BaseModel


class HistoryEntryOut(BaseModel):
    id: str
    type: str
    input: str
    output: dict[str, Any]
    supportMode: str
    createdAt: str
