import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    DailyLog,
    Food,
    Message,
    Recipe,
    RecipeCreate,
    RecipeIngredientCreate,
    RecipePublic,
    RecipesPublic,
    RecipeUpdate,
)
from app.nutrition import recipe_to_public

router = APIRouter(prefix="/recipes", tags=["recipes"])


def _ensure_foods_exist(
    session: SessionDep, ingredients_in: list[RecipeIngredientCreate]
) -> None:
    food_ids = {ingredient.food_id for ingredient in ingredients_in}
    if not food_ids:
        return
    found_ids = set(session.exec(select(Food.id).where(Food.id.in_(food_ids))).all())
    missing_ids = food_ids - found_ids
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail=f"Food(s) not found: {', '.join(str(id) for id in missing_ids)}",
        )


@router.get("/", response_model=RecipesPublic)
def read_recipes(
    session: SessionDep,
    current_user: CurrentUser,
    q: str | None = None,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve recipes, optionally searching by name.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Recipe)
        statement = select(Recipe)
    else:
        count_statement = (
            select(func.count())
            .select_from(Recipe)
            .where(Recipe.owner_id == current_user.id)
        )
        statement = select(Recipe).where(Recipe.owner_id == current_user.id)

    if q:
        count_statement = count_statement.where(Recipe.name.ilike(f"%{q}%"))
        statement = statement.where(Recipe.name.ilike(f"%{q}%"))

    count = session.exec(count_statement).one()
    statement = statement.order_by(Recipe.name).offset(skip).limit(limit)
    recipes = session.exec(statement).all()

    return RecipesPublic(data=[recipe_to_public(recipe) for recipe in recipes], count=count)


@router.get("/{id}", response_model=RecipePublic)
def read_recipe(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get recipe by ID, with computed macro and cost totals for one serving.
    """
    recipe = session.get(Recipe, id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return recipe_to_public(recipe)


@router.post("/", response_model=RecipePublic)
def create_recipe(
    *, session: SessionDep, current_user: CurrentUser, recipe_in: RecipeCreate
) -> Any:
    """
    Create a new recipe, with its ingredients.
    """
    _ensure_foods_exist(session, recipe_in.ingredients)
    recipe = crud.create_recipe(
        session=session, recipe_in=recipe_in, owner_id=current_user.id
    )
    return recipe_to_public(recipe)


@router.put("/{id}", response_model=RecipePublic)
def update_recipe(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    recipe_in: RecipeUpdate,
) -> Any:
    """
    Update a recipe. If ingredients is provided, it replaces all existing ones.
    """
    recipe = session.get(Recipe, id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")

    update_dict = recipe_in.model_dump(exclude_unset=True, exclude={"ingredients"})
    recipe.sqlmodel_update(update_dict)
    session.add(recipe)

    if recipe_in.ingredients is not None:
        _ensure_foods_exist(session, recipe_in.ingredients)
        crud.replace_recipe_ingredients(
            session=session, recipe=recipe, ingredients_in=recipe_in.ingredients
        )

    session.commit()
    session.refresh(recipe)
    return recipe_to_public(recipe)


@router.delete("/{id}")
def delete_recipe(session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Message:
    """
    Delete a recipe and its ingredients, if it is not referenced by any
    daily log entry.
    """
    recipe = session.get(Recipe, id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    if not current_user.is_superuser and (recipe.owner_id != current_user.id):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    in_use = session.exec(
        select(func.count()).select_from(DailyLog).where(DailyLog.recipe_id == id)
    ).one()
    if in_use:
        raise HTTPException(
            status_code=400,
            detail="Recipe is used by existing daily log entries and cannot be deleted",
        )
    session.delete(recipe)
    session.commit()
    return Message(message="Recipe deleted successfully")
