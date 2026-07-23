from sqlmodel import Session

from app import crud
from app.models import Recipe, RecipeCreate, RecipeIngredientCreate
from tests.utils.food import create_random_food
from tests.utils.user import create_random_user
from tests.utils.utils import random_lower_string


def create_random_recipe(db: Session) -> Recipe:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    food = create_random_food(db)
    recipe_in = RecipeCreate(
        name=random_lower_string(),
        ingredients=[RecipeIngredientCreate(food_id=food.id, quantity_g=150)],
    )
    return crud.create_recipe(session=db, recipe_in=recipe_in, owner_id=owner_id)
