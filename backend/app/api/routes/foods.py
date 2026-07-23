import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Food,
    FoodCreate,
    FoodEntry,
    FoodPublic,
    FoodsPublic,
    FoodUpdate,
    Message,
)

router = APIRouter(prefix="/foods", tags=["foods"])


@router.get("/", response_model=FoodsPublic)
def read_foods(
    session: SessionDep,
    _current_user: CurrentUser,
    q: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve foods from the shared catalog, optionally searching by name.
    """
    statement = select(Food)
    count_statement = select(func.count()).select_from(Food)
    if q:
        statement = statement.where(Food.name.ilike(f"%{q}%"))
        count_statement = count_statement.where(Food.name.ilike(f"%{q}%"))

    count = session.exec(count_statement).one()
    statement = statement.order_by(Food.name).offset(skip).limit(limit)
    foods = session.exec(statement).all()

    return FoodsPublic(data=foods, count=count)


@router.get("/{id}", response_model=FoodPublic)
def read_food(session: SessionDep, _current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get food by ID.
    """
    food = session.get(Food, id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    return food


@router.post("/", response_model=FoodPublic)
def create_food(
    *, session: SessionDep, _current_user: CurrentUser, food_in: FoodCreate
) -> Any:
    """
    Create new food in the shared catalog.
    """
    food = Food.model_validate(food_in)
    session.add(food)
    session.commit()
    session.refresh(food)
    return food


@router.put("/{id}", response_model=FoodPublic)
def update_food(
    *,
    session: SessionDep,
    _current_user: CurrentUser,
    id: uuid.UUID,
    food_in: FoodUpdate,
) -> Any:
    """
    Update a food.
    """
    food = session.get(Food, id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    update_dict = food_in.model_dump(exclude_unset=True)
    food.sqlmodel_update(update_dict)
    session.add(food)
    session.commit()
    session.refresh(food)
    return food


@router.delete("/{id}")
def delete_food(session: SessionDep, _current_user: CurrentUser, id: uuid.UUID) -> Message:
    """
    Delete a food, if it is not referenced by any meal.
    """
    food = session.get(Food, id)
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    in_use = session.exec(
        select(func.count()).select_from(FoodEntry).where(FoodEntry.food_id == id)
    ).one()
    if in_use:
        raise HTTPException(
            status_code=400,
            detail="Food is used by existing meal entries and cannot be deleted",
        )
    session.delete(food)
    session.commit()
    return Message(message="Food deleted successfully")
