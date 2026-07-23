import random

from sqlmodel import Session

from app import crud
from app.models import Food, FoodCreate
from tests.utils.utils import random_lower_string


def create_random_food(db: Session, **overrides: object) -> Food:
    data: dict[str, object] = {
        "name": random_lower_string(),
        "food_group": "Test group",
        "source": "manual",
        "energy_kcal": round(random.uniform(50, 900), 2),
        "protein_g": round(random.uniform(0, 30), 2),
        "carbohydrate_g": round(random.uniform(0, 80), 2),
        "lipid_g": round(random.uniform(0, 40), 2),
    }
    data.update(overrides)
    food_in = FoodCreate(**data)
    return crud.create_food(session=db, food_in=food_in)
