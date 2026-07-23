import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Food,
    FoodEntryCreate,
    Meal,
    MealCreate,
    MealPublic,
    MealsPublic,
    MealUpdate,
    Message,
)
from app.nutrition import meal_to_public

router = APIRouter(prefix="/meals", tags=["meals"])


def _ensure_foods_exist(session: SessionDep, food_entries_in: list[FoodEntryCreate]) -> None:
    food_ids = {entry.food_id for entry in food_entries_in}
    if not food_ids:
        return
    found_ids = set(
        session.exec(select(Food.id).where(Food.id.in_(food_ids))).all()
    )
    missing_ids = food_ids - found_ids
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Food(s) not found: {', '.join(str(id) for id in missing_ids)}",
        )


@router.get("/", response_model=MealsPublic)
def read_meals(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve meals, with computed macro and cost totals.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Meal)
        count = session.exec(count_statement).one()
        statement = (
            select(Meal).order_by(Meal.meal_datetime.desc()).offset(skip).limit(limit)
        )
        meals = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .select_from(Meal)
            .where(Meal.owner_id == current_user.id)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Meal)
            .where(Meal.owner_id == current_user.id)
            .order_by(Meal.meal_datetime.desc())
            .offset(skip)
            .limit(limit)
        )
        meals = session.exec(statement).all()

    return MealsPublic(data=[meal_to_public(meal) for meal in meals], count=count)


@router.get("/{id}", response_model=MealPublic)
def read_meal(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get meal by ID, with computed macro and cost totals.
    """
    meal = session.get(Meal, id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    if not current_user.is_superuser and (meal.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return meal_to_public(meal)


@router.post("/", response_model=MealPublic)
def create_meal(
    *, session: SessionDep, current_user: CurrentUser, meal_in: MealCreate
) -> Any:
    """
    Create a new meal, with its food entries.
    """
    _ensure_foods_exist(session, meal_in.food_entries)
    meal = crud.create_meal(session=session, meal_in=meal_in, owner_id=current_user.id)
    return meal_to_public(meal)


@router.put("/{id}", response_model=MealPublic)
def update_meal(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    meal_in: MealUpdate,
) -> Any:
    """
    Update a meal. If food_entries is provided, it replaces all existing entries.
    """
    meal = session.get(Meal, id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    if not current_user.is_superuser and (meal.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_dict = meal_in.model_dump(exclude_unset=True, exclude={"food_entries"})
    meal.sqlmodel_update(update_dict)
    session.add(meal)

    if meal_in.food_entries is not None:
        _ensure_foods_exist(session, meal_in.food_entries)
        crud.replace_meal_food_entries(
            session=session, meal=meal, food_entries_in=meal_in.food_entries
        )

    session.commit()
    session.refresh(meal)
    return meal_to_public(meal)


@router.delete("/{id}")
def delete_meal(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Message:
    """
    Delete a meal and its food entries.
    """
    meal = session.get(Meal, id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    if not current_user.is_superuser and (meal.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    session.delete(meal)
    session.commit()
    return Message(message="Meal deleted successfully")
