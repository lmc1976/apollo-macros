from sqlmodel import Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import Food, FoodCreate, User, UserCreate

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


# Placeholder catalog while the real TACO/TBCA bulk import isn't wired up.
SEED_FOODS: list[FoodCreate] = [
    FoodCreate(
        name="Arroz branco cozido",
        food_group="Cereais e derivados",
        source="TACO",
        energy_kcal=128,
        protein_g=2.5,
        carbohydrate_g=28.1,
        lipid_g=0.2,
        fiber_g=1.6,
    ),
    FoodCreate(
        name="Feijão carioca cozido",
        food_group="Leguminosas e derivados",
        source="TACO",
        energy_kcal=76,
        protein_g=4.8,
        carbohydrate_g=13.6,
        lipid_g=0.5,
        fiber_g=8.5,
    ),
    FoodCreate(
        name="Peito de frango grelhado",
        food_group="Carnes e derivados",
        source="TACO",
        energy_kcal=159,
        protein_g=32.0,
        carbohydrate_g=0.0,
        lipid_g=2.5,
    ),
    FoodCreate(
        name="Banana prata",
        food_group="Frutas e derivados",
        source="TACO",
        energy_kcal=98,
        protein_g=1.3,
        carbohydrate_g=26.0,
        lipid_g=0.1,
        fiber_g=2.0,
        price_brl=6.0,
        price_reference_g=1000,
    ),
    FoodCreate(
        name="Whey protein (concentrado)",
        food_group="Suplementos",
        source="manual",
        energy_kcal=400,
        protein_g=80.0,
        carbohydrate_g=8.0,
        lipid_g=5.0,
        price_brl=120.0,
        price_reference_g=900,
    ),
]


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = crud.create_user(session=session, user_create=user_in)

    for food_in in SEED_FOODS:
        existing_food = session.exec(
            select(Food).where(Food.name == food_in.name)
        ).first()
        if not existing_food:
            crud.create_food(session=session, food_in=food_in)
