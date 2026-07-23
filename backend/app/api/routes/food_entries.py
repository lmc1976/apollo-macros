import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    FoodEntriesPublic,
    FoodEntry,
    FoodEntryCreate,
    FoodEntryPublic,
    FoodEntryUpdate,
    Message,
)

router = APIRouter(prefix="/food-entries", tags=["food-entries"])


@router.get("/", response_model=FoodEntriesPublic)
def read_food_entries(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve food entries.
    """

    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(FoodEntry)
        count = session.exec(count_statement).one()
        statement = (
            select(FoodEntry)
            .order_by(FoodEntry.entry_datetime.desc())
            .offset(skip)
            .limit(limit)
        )
        food_entries = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(FoodEntry)
            .where(FoodEntry.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(FoodEntry)
            .where(FoodEntry.owner_id == current_user.id)
            .order_by(FoodEntry.entry_datetime.desc())
            .offset(skip)
            .limit(limit)
        )
        food_entries = session.exec(statement).all()

    return FoodEntriesPublic(data=food_entries, count=count)


@router.get("/{id}", response_model=FoodEntryPublic)
def read_food_entry(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get food entry by ID.
    """
    food_entry = session.get(FoodEntry, id)
    if not food_entry:
        raise HTTPException(status_code=404, detail="Food entry not found")
    if not current_user.is_superuser and (food_entry.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return food_entry


@router.post("/", response_model=FoodEntryPublic)
def create_food_entry(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    food_entry_in: FoodEntryCreate,
) -> Any:
    """
    Create new food entry.
    """
    food_entry = FoodEntry.model_validate(
        food_entry_in, update={"owner_id": current_user.id}
    )
    session.add(food_entry)
    session.commit()
    session.refresh(food_entry)
    return food_entry


@router.put("/{id}", response_model=FoodEntryPublic)
def update_food_entry(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    food_entry_in: FoodEntryUpdate,
) -> Any:
    """
    Update a food entry.
    """
    food_entry = session.get(FoodEntry, id)
    if not food_entry:
        raise HTTPException(status_code=404, detail="Food entry not found")
    if not current_user.is_superuser and (food_entry.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    update_dict = food_entry_in.model_dump(exclude_unset=True)
    food_entry.sqlmodel_update(update_dict)
    session.add(food_entry)
    session.commit()
    session.refresh(food_entry)
    return food_entry


@router.delete("/{id}")
def delete_food_entry(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a food entry.
    """
    food_entry = session.get(FoodEntry, id)
    if not food_entry:
        raise HTTPException(status_code=404, detail="Food entry not found")
    if not current_user.is_superuser and (food_entry.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(food_entry)
    session.commit()
    return Message(message="Food entry deleted successfully")
