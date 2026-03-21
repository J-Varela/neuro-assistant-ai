from fastapi import APIRouter
from app.schemas.simplify import SimplifyRequest, SimplifyResponse

router = APIRouter(tags=["Simplify"])


@router.post("/simplify-text", response_model=SimplifyResponse)
def simplify_text(payload: SimplifyRequest):
    return SimplifyResponse(
        simplified_text="This is a simpler version of the original text.",
        key_points=[
            "Main idea one",
            "Main idea two"
        ],
        action_items=[
            "Read the first section",
            "Complete the first action"
        ]
    )