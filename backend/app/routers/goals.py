from fastapi import APIRouter

from app.models import GoalSettings, GoalsResponse, UpdateGoalSettingsRequest
from app.services.goals import RealGoalService

router = APIRouter(prefix="/api/goals", tags=["goals"])

goal_service = RealGoalService()


@router.get("", response_model=GoalsResponse)
def get_goals() -> GoalsResponse:
    return goal_service.get_goals()


@router.put("/settings", response_model=GoalSettings)
def update_goal_settings(body: UpdateGoalSettingsRequest) -> GoalSettings:
    return goal_service.update_settings(body)
