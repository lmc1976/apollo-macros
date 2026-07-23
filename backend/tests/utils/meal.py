from sqlmodel import Session

from app import crud
from app.models import FoodEntryCreate, Meal, MealCreate
from tests.utils.food import create_random_food
from tests.utils.user import create_random_user
from tests.utils.utils import random_lower_string


def create_random_meal(db: Session) -> Meal:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    food = create_random_food(db)
    meal_in = MealCreate(
        label=random_lower_string(),
        food_entries=[FoodEntryCreate(food_id=food.id, quantity_g=150)],
    )
    return crud.create_meal(session=db, meal_in=meal_in, owner_id=owner_id)
