from app.models import (
    DailyLog,
    DailyLogIngredientPublic,
    DailyLogPublic,
    EntryType,
    Food,
    Recipe,
    RecipeIngredient,
    RecipeIngredientPublic,
    RecipePublic,
)

_MACRO_FIELDS = ("energy_kcal", "protein_g", "carbohydrate_g", "lipid_g")


def _scale(value: float | None, factor: float) -> float | None:
    return value * factor if value is not None else None


def _food_cost(food: Food, quantity_g: float) -> float | None:
    if food.price_brl is not None and food.price_reference_g:
        return quantity_g / food.price_reference_g * food.price_brl
    return None


def _sum_macros_and_cost(
    items: list[RecipeIngredientPublic] | list[DailyLogIngredientPublic],
) -> tuple[dict[str, float], float]:
    totals = dict.fromkeys(_MACRO_FIELDS, 0.0)
    for item in items:
        for field in _MACRO_FIELDS:
            value = getattr(item, field)
            if value is not None:
                totals[field] += value
    total_cost = sum(item.cost_brl for item in items if item.cost_brl is not None)
    return totals, total_cost


def recipe_ingredient_to_public(ingredient: RecipeIngredient) -> RecipeIngredientPublic:
    food = ingredient.food
    factor = ingredient.quantity_g / 100

    return RecipeIngredientPublic(
        id=ingredient.id,
        recipe_id=ingredient.recipe_id,
        food_id=ingredient.food_id,
        food_name=food.name,
        quantity_g=ingredient.quantity_g,
        energy_kcal=_scale(food.energy_kcal, factor),
        protein_g=_scale(food.protein_g, factor),
        carbohydrate_g=_scale(food.carbohydrate_g, factor),
        lipid_g=_scale(food.lipid_g, factor),
        cost_brl=_food_cost(food, ingredient.quantity_g),
    )


def recipe_to_public(recipe: Recipe) -> RecipePublic:
    ingredients = [recipe_ingredient_to_public(i) for i in recipe.ingredients]
    totals, total_cost = _sum_macros_and_cost(ingredients)

    return RecipePublic(
        id=recipe.id,
        owner_id=recipe.owner_id,
        created_at=recipe.created_at,
        name=recipe.name,
        ingredients=ingredients,
        total_energy_kcal=totals["energy_kcal"],
        total_protein_g=totals["protein_g"],
        total_carbohydrate_g=totals["carbohydrate_g"],
        total_lipid_g=totals["lipid_g"],
        total_cost_brl=total_cost,
    )


def daily_log_to_public(entry: DailyLog) -> DailyLogPublic:
    if entry.entry_type == EntryType.FOOD:
        food = entry.food
        assert food is not None
        assert entry.quantity_g is not None
        factor = entry.quantity_g / 100

        return DailyLogPublic(
            id=entry.id,
            owner_id=entry.owner_id,
            entry_datetime=entry.entry_datetime,
            label=entry.label,
            entry_type=entry.entry_type,
            food_id=entry.food_id,
            quantity_g=entry.quantity_g,
            recipe_id=None,
            recipe_servings=None,
            food_name=food.name,
            recipe_name=None,
            energy_kcal=_scale(food.energy_kcal, factor) or 0.0,
            protein_g=_scale(food.protein_g, factor) or 0.0,
            carbohydrate_g=_scale(food.carbohydrate_g, factor) or 0.0,
            lipid_g=_scale(food.lipid_g, factor) or 0.0,
            cost_brl=_food_cost(food, entry.quantity_g) or 0.0,
            ingredients=None,
        )

    recipe = entry.recipe
    assert recipe is not None
    assert entry.recipe_servings is not None
    servings = entry.recipe_servings

    scaled_ingredients = [
        DailyLogIngredientPublic(
            food_id=ingredient.food_id,
            food_name=ingredient.food_name,
            quantity_g=ingredient.quantity_g * servings,
            energy_kcal=_scale(ingredient.energy_kcal, servings),
            protein_g=_scale(ingredient.protein_g, servings),
            carbohydrate_g=_scale(ingredient.carbohydrate_g, servings),
            lipid_g=_scale(ingredient.lipid_g, servings),
            cost_brl=_scale(ingredient.cost_brl, servings),
        )
        for ingredient in (recipe_ingredient_to_public(i) for i in recipe.ingredients)
    ]
    totals, total_cost = _sum_macros_and_cost(scaled_ingredients)

    return DailyLogPublic(
        id=entry.id,
        owner_id=entry.owner_id,
        entry_datetime=entry.entry_datetime,
        label=entry.label,
        entry_type=entry.entry_type,
        food_id=None,
        quantity_g=None,
        recipe_id=entry.recipe_id,
        recipe_servings=servings,
        food_name=None,
        recipe_name=recipe.name,
        energy_kcal=totals["energy_kcal"],
        protein_g=totals["protein_g"],
        carbohydrate_g=totals["carbohydrate_g"],
        lipid_g=totals["lipid_g"],
        cost_brl=total_cost,
        ingredients=scaled_ingredients,
    )
