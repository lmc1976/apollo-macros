import uuid
from datetime import datetime, timezone

from pydantic import EmailStr
from sqlalchemy import DateTime
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
    meals: list["Meal"] = Relationship(back_populates="owner", cascade_delete=True)


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


# A single food, with its quantity, within a Meal
class FoodEntryBase(SQLModel):
    food_id: uuid.UUID
    quantity_g: float = Field(gt=0)


# Properties to receive on food entry creation, nested under a meal
class FoodEntryCreate(FoodEntryBase):
    pass


# Database model, database table inferred from class name
class FoodEntry(FoodEntryBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    meal_id: uuid.UUID = Field(
        foreign_key="meal.id", nullable=False, ondelete="CASCADE"
    )
    food_id: uuid.UUID = Field(foreign_key="food.id", nullable=False)
    meal: "Meal" = Relationship(back_populates="food_entries")
    food: Food = Relationship()


# Properties to return via API, id is always required. Nutritional values and
# cost are computed dynamically from the linked Food and quantity_g, they are
# not stored.
class FoodEntryPublic(SQLModel):
    id: uuid.UUID
    meal_id: uuid.UUID
    food_id: uuid.UUID
    food_name: str
    quantity_g: float
    energy_kcal: float | None = None
    protein_g: float | None = None
    carbohydrate_g: float | None = None
    lipid_g: float | None = None
    cost_brl: float | None = None


# Shared properties
class MealBase(SQLModel):
    label: str = Field(min_length=1, max_length=255)
    meal_datetime: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    is_recipe: bool = False


# Properties to receive on meal creation
class MealCreate(MealBase):
    food_entries: list[FoodEntryCreate] = []


# Properties to receive on meal update. When food_entries is provided, it
# fully replaces the meal's existing entries.
class MealUpdate(MealBase):
    label: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore
    meal_datetime: datetime | None = Field(default=None)  # type: ignore
    is_recipe: bool | None = Field(default=None)  # type: ignore
    food_entries: list[FoodEntryCreate] | None = None


# Database model, database table inferred from class name
class Meal(MealBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="meals")
    food_entries: list[FoodEntry] = Relationship(
        back_populates="meal", cascade_delete=True
    )


# Properties to return via API, id is always required. Totals are computed
# dynamically as the sum of the meal's food entries.
class MealPublic(MealBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None
    food_entries: list[FoodEntryPublic]
    total_energy_kcal: float
    total_protein_g: float
    total_carbohydrate_g: float
    total_lipid_g: float
    total_cost_brl: float


class MealsPublic(SQLModel):
    data: list[MealPublic]
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
