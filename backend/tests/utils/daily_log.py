from sqlmodel import Session

from app import crud
from app.models import DailyLog, DailyLogCreate, EntryType
from tests.utils.food import create_random_food
from tests.utils.user import create_random_user


def create_random_daily_log_for_food(db: Session) -> DailyLog:
    user = create_random_user(db)
    owner_id = user.id
    assert owner_id is not None
    food = create_random_food(db)
    daily_log_in = DailyLogCreate(
        entry_type=EntryType.FOOD, food_id=food.id, quantity_g=150
    )
    return crud.create_daily_log(session=db, daily_log_in=daily_log_in, owner_id=owner_id)
