from fastapi import APIRouter
from app.schemas.breakdown import BreakdownRequest, BreakdownResponse

router = APIRouter(tags=["Breakdown"])


@router.post("/breakdown-task", response_model=BreakdownResponse)
def breakdown_task(payload: BreakdownRequest):
    return BreakdownResponse(
        goal="Finish and submit the task in manageable steps",
        steps=[
            "Review what the task is asking",
            "Gather the materials you need",
            "Create a simple plan",
            "Complete the first small part",
            "Review your progress"
        ],
        next_step="Review what the task is asking",
        estimated_effort="30-60 minutes"
    )