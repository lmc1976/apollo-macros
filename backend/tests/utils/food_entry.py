import random

from sqlmodel import Session

from app import crud
from app.models import FoodEntry, FoodEntryCreate
from tests.utils.user import create_random_user
from tests.utils.utils import random_lower_string


def create_random_food_entry(db: Session) -> FoodEntry:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    food_entry_in = FoodEntryCreate(
        food_name=random_lower_string(),
        quantity_g=round(random.uniform(1, 500), 2),
        calories=round(random.uniform(0, 900), 2),
        protein_g=round(random.uniform(0, 100), 2),
        carbs_g=round(random.uniform(0, 100), 2),
        fat_g=round(random.uniform(0, 100), 2),
    )
    return crud.create_food_entry(
        session=db, food_entry_in=food_entry_in, owner_id=owner_id
    )
