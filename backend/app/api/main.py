from fastapi import APIRouter

from app.api.routes import (
    daily_logs,
    foods,
    items,
    login,
    private,
    recipes,
    users,
    utils,
)
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(foods.router)
api_router.include_router(recipes.router)
api_router.include_router(daily_logs.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
