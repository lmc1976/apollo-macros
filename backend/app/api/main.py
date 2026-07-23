from fastapi import APIRouter

from app.api.routes import foods, items, login, meals, private, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(foods.router)
api_router.include_router(meals.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
