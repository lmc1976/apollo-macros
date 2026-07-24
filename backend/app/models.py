import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import EmailStr, model_validator
from sqlalchemy import DateTime, String
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    recipes: list["Recipe"] = Relationship(back_populates="owner", cascade_delete=True)
    daily_logs: list["DailyLog"] = Relationship(
        back_populates="owner", cascade_delete=True
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Shared properties
# Food is a reference/catalog entity (nutritional values per 100g), not owned
# by a user. It will eventually be bulk-imported from TACO/TBCA tables.
class FoodBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    food_group: str | None = Field(default=None, max_length=255)
    source: str | None = Field(default=None, max_length=255)

    energy_kcal: float | None = Field(default=None, ge=0)
    protein_g: float | None = Field(default=None, ge=0)
    carbohydrate_g: float | None = Field(default=None, ge=0)
    lipid_g: float | None = Field(default=None, ge=0)

    saturated_fat_g: float | None = Field(default=None, ge=0)
    monounsaturated_fat_g: float | None = Field(default=None, ge=0)
    polyunsaturated_fat_g: float | None = Field(default=None, ge=0)

    cholesterol_mg: float | None = Field(default=None, ge=0)
    fiber_g: float | None = Field(default=None, ge=0)

    sodium_mg: float | None = Field(default=None, ge=0)
    calcium_mg: float | None = Field(default=None, ge=0)
    magnesium_mg: float | None = Field(default=None, ge=0)
    phosphorus_mg: float | None = Field(default=None, ge=0)
    iron_mg: float | None = Field(default=None, ge=0)
    potassium_mg: float | None = Field(default=None, ge=0)
    copper_mg: float | None = Field(default=None, ge=0)
    zinc_mg: float | None = Field(default=None, ge=0)
    manganese_mg: float | None = Field(default=None, ge=0)

    retinol_mcg: float | None = Field(default=None, ge=0)
    thiamine_mg: float | None = Field(default=None, ge=0)
    riboflavin_mg: float | None = Field(default=None, ge=0)
    pyridoxine_mg: float | None = Field(default=None, ge=0)
    niacin_mg: float | None = Field(default=None, ge=0)
    vitamin_c_mg: float | None = Field(default=None, ge=0)

    # Optional price reference, e.g. the price of a 500g package, used to
    # derive a cost per 100g (and per food entry) later on.
    price_brl: float | None = Field(default=None, gt=0)
    price_reference_g: float | None = Field(default=None, gt=0)


# Properties to receive on food creation
class FoodCreate(FoodBase):
    pass


# Properties to receive on food update
class FoodUpdate(FoodBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Food(FoodBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# Properties to return via API, id is always required
class FoodPublic(FoodBase):
    id: uuid.UUID
    created_at: datetime | None = None


class FoodsPublic(SQLModel):
    data: list[FoodPublic]
    count: int


# A single food, with its quantity, within a Recipe
class RecipeIngredientBase(SQLModel):
    food_id: uuid.UUID
    quantity_g: float = Field(gt=0)


# Properties to receive on ingredient creation, nested under a recipe
class RecipeIngredientCreate(RecipeIngredientBase):
    pass


# Database model, database table inferred from class name
class RecipeIngredient(RecipeIngredientBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    recipe_id: uuid.UUID = Field(
        foreign_key="recipe.id", nullable=False, ondelete="CASCADE"
    )
    food_id: uuid.UUID = Field(foreign_key="food.id", nullable=False)
    recipe: "Recipe" = Relationship(back_populates="ingredients")
    food: Food = Relationship()


# Properties to return via API, id is always required. Nutritional values and
# cost are computed dynamically from the linked Food and quantity_g, they are
# not stored.
class RecipeIngredientPublic(SQLModel):
    id: uuid.UUID
    recipe_id: uuid.UUID
    food_id: uuid.UUID
    food_name: str
    quantity_g: float
    energy_kcal: float | None = None
    protein_g: float | None = None
    carbohydrate_g: float | None = None
    lipid_g: float | None = None
    cost_brl: float | None = None


# Shared properties
# A Recipe is a reusable template (no date/time) representing a fixed
# combination of foods, e.g. "Omelete" = Egg + Salt + Cheese. yield_servings
# is how many servings the whole recipe (as entered) makes; a DailyLog entry
# logging this recipe records how many of those servings were consumed.
class RecipeBase(SQLModel):
    name: str = Field(min_length=1, max_length=255)
    yield_servings: float = Field(default=1.0, gt=0)


# Properties to receive on recipe creation
class RecipeCreate(RecipeBase):
    ingredients: list[RecipeIngredientCreate] = []


# Properties to receive on recipe update. When ingredients is provided, it
# fully replaces the recipe's existing ingredients.
class RecipeUpdate(RecipeBase):
    name: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    yield_servings: float | None = Field(default=None, gt=0)  # type: ignore
    ingredients: list[RecipeIngredientCreate] | None = None


# Database model, database table inferred from class name
class Recipe(RecipeBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="recipes")
    ingredients: list[RecipeIngredient] = Relationship(
        back_populates="recipe", cascade_delete=True
    )


# Properties to return via API, id is always required. Totals are computed
# dynamically as the sum of the recipe's ingredients (for a single serving).
class RecipePublic(RecipeBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None
    ingredients: list[RecipeIngredientPublic]
    total_energy_kcal: float
    total_protein_g: float
    total_carbohydrate_g: float
    total_lipid_g: float
    total_cost_brl: float


class RecipesPublic(SQLModel):
    data: list[RecipePublic]
    count: int


class EntryType(str, Enum):
    FOOD = "food"
    RECIPE = "recipe"


# Shared properties
# A DailyLog is the actual record of what was eaten at a specific date/time.
# It references either a Food directly (food_id + quantity_g) or a whole
# Recipe (recipe_id + recipe_servings), never both.
class DailyLogBase(SQLModel):
    entry_datetime: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    label: str | None = Field(default=None, max_length=255)
    entry_type: EntryType = Field(sa_type=String(length=20))  # type: ignore
    food_id: uuid.UUID | None = Field(default=None)
    quantity_g: float | None = Field(default=None, gt=0)
    recipe_id: uuid.UUID | None = Field(default=None)
    recipe_servings: float | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def _check_entry_shape(self) -> "DailyLogBase":
        if self.entry_type == EntryType.FOOD:
            if self.food_id is None or self.quantity_g is None:
                raise ValueError(
                    "food_id and quantity_g are required when entry_type is 'food'"
                )
            if self.recipe_id is not None or self.recipe_servings is not None:
                raise ValueError(
                    "recipe_id/recipe_servings must not be set when entry_type is 'food'"
                )
        else:
            if self.recipe_id is None or self.recipe_servings is None:
                raise ValueError(
                    "recipe_id and recipe_servings are required when entry_type is 'recipe'"
                )
            if self.food_id is not None or self.quantity_g is not None:
                raise ValueError(
                    "food_id/quantity_g must not be set when entry_type is 'recipe'"
                )
        return self


# Properties to receive on daily log creation
class DailyLogCreate(DailyLogBase):
    pass


# Properties to receive on daily log update. The full, merged entry is
# re-validated by the route, since a partial patch alone cannot be checked
# against the food/recipe shape rules above.
class DailyLogUpdate(SQLModel):
    entry_datetime: datetime | None = Field(default=None)
    label: str | None = Field(default=None, max_length=255)
    entry_type: EntryType | None = Field(default=None)
    food_id: uuid.UUID | None = Field(default=None)
    quantity_g: float | None = Field(default=None, gt=0)
    recipe_id: uuid.UUID | None = Field(default=None)
    recipe_servings: float | None = Field(default=None, gt=0)


# Database model, database table inferred from class name
class DailyLog(DailyLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    food_id: uuid.UUID | None = Field(default=None, foreign_key="food.id")
    recipe_id: uuid.UUID | None = Field(default=None, foreign_key="recipe.id")
    owner: User | None = Relationship(back_populates="daily_logs")
    food: Food | None = Relationship()
    recipe: Recipe | None = Relationship()


# Properties to return via API, id is always required. Nutritional values and
# cost are computed dynamically: from Food + quantity_g when entry_type is
# "food", or from the Recipe's ingredients scaled by recipe_servings when
# entry_type is "recipe".
class DailyLogIngredientPublic(SQLModel):
    food_id: uuid.UUID
    food_name: str
    quantity_g: float
    energy_kcal: float | None = None
    protein_g: float | None = None
    carbohydrate_g: float | None = None
    lipid_g: float | None = None
    cost_brl: float | None = None


class DailyLogPublic(SQLModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    entry_datetime: datetime
    label: str | None = None
    entry_type: EntryType
    food_id: uuid.UUID | None = None
    quantity_g: float | None = None
    recipe_id: uuid.UUID | None = None
    recipe_servings: float | None = None
    food_name: str | None = None
    recipe_name: str | None = None
    energy_kcal: float
    protein_g: float
    carbohydrate_g: float
    lipid_g: float
    cost_brl: float
    ingredients: list[DailyLogIngredientPublic] | None = None


class DailyLogsPublic(SQLModel):
    data: list[DailyLogPublic]
    count: int


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)
