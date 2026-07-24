import uuid
from datetime import date as date_type
from datetime import datetime, time, timedelta, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import ValidationError
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    DailyLog,
    DailyLogCreate,
    DailyLogPublic,
    DailyLogsPublic,
    DailyLogUpdate,
    EntryType,
    Food,
    Message,
    Recipe,
)
from app.nutrition import daily_log_to_public

router = APIRouter(prefix="/daily-logs", tags=["daily-logs"])


def _ensure_reference_exists(session: SessionDep, daily_log_in: DailyLogCreate) -> None:
    if daily_log_in.entry_type == EntryType.FOOD:
        if not session.get(Food, daily_log_in.food_id):
            raise HTTPException(
                status_code=404, detail=f"Food not found: {daily_log_in.food_id}"
            )
    else:
        if not session.get(Recipe, daily_log_in.recipe_id):
            raise HTTPException(
                status_code=404, detail=f"Recipe not found: {daily_log_in.recipe_id}"
            )


@router.get("/", response_model=DailyLogsPublic)
def read_daily_logs(
    session: SessionDep,
    current_user: CurrentUser,
    date: date_type | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve daily log entries, with computed macro and cost totals.
    Optionally restrict to a single UTC day via `date`.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(DailyLog)
        statement = select(DailyLog)
    else:
        count_statement = (
            select(func.count())
            .select_from(DailyLog)
            .where(DailyLog.owner_id == current_user.id)
        )
        statement = select(DailyLog).where(DailyLog.owner_id == current_user.id)

    if date is not None:
        day_start = datetime.combine(date, time.min, tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        count_statement = count_statement.where(
            DailyLog.entry_datetime >= day_start, DailyLog.entry_datetime < day_end
        )
        statement = statement.where(
            DailyLog.entry_datetime >= day_start, DailyLog.entry_datetime < day_end
        )

    count = session.exec(count_statement).one()
    statement = (
        statement.order_by(DailyLog.entry_datetime.desc()).offset(skip).limit(limit)
    )
    entries = session.exec(statement).all()

    return DailyLogsPublic(
        data=[daily_log_to_public(entry) for entry in entries], count=count
    )


@router.get("/dates", response_model=list[date_type])
def read_daily_log_dates(
    session: SessionDep, current_user: CurrentUser, year: int, month: int
) -> Any:
    """
    Retrieve the distinct dates (UTC) within a given year/month that have at
    least one daily log entry, for calendar day-marking.
    """
    month_start = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        month_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        month_end = datetime(year, month + 1, 1, tzinfo=timezone.utc)

    statement = select(DailyLog.entry_datetime).where(
        DailyLog.entry_datetime >= month_start, DailyLog.entry_datetime < month_end
    )
    if not current_user.is_superuser:
        statement = statement.where(DailyLog.owner_id == current_user.id)

    entry_datetimes = session.exec(statement).all()
    return sorted({dt.date() for dt in entry_datetimes})


@router.get("/{id}", response_model=DailyLogPublic)
def read_daily_log(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get a daily log entry by ID, with computed macro and cost totals.
    """
    entry = session.get(DailyLog, id)
    if not entry:
        raise HTTPException(status_code=404, detail="Daily log entry not found")
    if not current_user.is_superuser and (entry.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return daily_log_to_public(entry)


@router.post("/", response_model=DailyLogPublic)
def create_daily_log(
    *, session: SessionDep, current_user: CurrentUser, daily_log_in: DailyLogCreate
) -> Any:
    """
    Create a new daily log entry, referencing either a Food or a Recipe.
    """
    _ensure_reference_exists(session, daily_log_in)
    entry = crud.create_daily_log(
        session=session, daily_log_in=daily_log_in, owner_id=current_user.id
    )
    return daily_log_to_public(entry)


@router.put("/{id}", response_model=DailyLogPublic)
def update_daily_log(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    daily_log_in: DailyLogUpdate,
) -> Any:
    """
    Update a daily log entry. The merged result must still satisfy the
    food-xor-recipe shape rules.
    """
    entry = session.get(DailyLog, id)
    if not entry:
        raise HTTPException(status_code=404, detail="Daily log entry not found")
    if not current_user.is_superuser and (entry.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_dict = daily_log_in.model_dump(exclude_unset=True)
    merged = {
        "entry_datetime": entry.entry_datetime,
        "label": entry.label,
        "entry_type": entry.entry_type,
        "food_id": entry.food_id,
        "quantity_g": entry.quantity_g,
        "recipe_id": entry.recipe_id,
        "recipe_servings": entry.recipe_servings,
        **update_dict,
    }
    try:
        validated = DailyLogCreate(**merged)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e

    _ensure_reference_exists(session, validated)
    entry.sqlmodel_update(validated.model_dump())
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return daily_log_to_public(entry)


@router.delete("/{id}")
def delete_daily_log(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a daily log entry.
    """
    entry = session.get(DailyLog, id)
    if not entry:
        raise HTTPException(status_code=404, detail="Daily log entry not found")
    if not current_user.is_superuser and (entry.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(entry)
    session.commit()
    return Message(message="Daily log entry deleted successfully")
