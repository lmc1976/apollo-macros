from app.models import FoodEntry, FoodEntryPublic, Meal, MealPublic

_MACRO_FIELDS = ("energy_kcal", "protein_g", "carbohydrate_g", "lipid_g")


def _scale(value: float | None, factor: float) -> float | None:
    return value * factor if value is not None else None


def food_entry_to_public(entry: FoodEntry) -> FoodEntryPublic:
    food = entry.food
    factor = entry.quantity_g / 100

    cost_brl = None
    if food.price_brl is not None and food.price_reference_g:
        cost_brl = entry.quantity_g / food.price_reference_g * food.price_brl

    return FoodEntryPublic(
        id=entry.id,
        meal_id=entry.meal_id,
        food_id=entry.food_id,
        food_name=food.name,
        quantity_g=entry.quantity_g,
        energy_kcal=_scale(food.energy_kcal, factor),
        protein_g=_scale(food.protein_g, factor),
        carbohydrate_g=_scale(food.carbohydrate_g, factor),
        lipid_g=_scale(food.lipid_g, factor),
        cost_brl=cost_brl,
    )


def meal_to_public(meal: Meal) -> MealPublic:
    entries = [food_entry_to_public(entry) for entry in meal.food_entries]

    totals = dict.fromkeys(_MACRO_FIELDS, 0.0)
    for entry in entries:
        for field in _MACRO_FIELDS:
            value = getattr(entry, field)
            if value is not None:
                totals[field] += value

    total_cost_brl = sum(entry.cost_brl for entry in entries if entry.cost_brl is not None)

    return MealPublic(
        id=meal.id,
        owner_id=meal.owner_id,
        created_at=meal.created_at,
        label=meal.label,
        meal_datetime=meal.meal_datetime,
        is_recipe=meal.is_recipe,
        food_entries=entries,
        total_energy_kcal=totals["energy_kcal"],
        total_protein_g=totals["protein_g"],
        total_carbohydrate_g=totals["carbohydrate_g"],
        total_lipid_g=totals["lipid_g"],
        total_cost_brl=total_cost_brl,
    )
