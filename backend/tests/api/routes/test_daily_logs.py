import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.daily_log import create_random_daily_log_for_food
from tests.utils.food import create_random_food
from tests.utils.recipe import create_random_recipe


def test_create_daily_log_for_food(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(
        db, name="Test Banana", energy_kcal=98, protein_g=1.3, price_brl=6.0, price_reference_g=1000
    )
    data = {
        "entry_type": "food",
        "food_id": str(food.id),
        "quantity_g": 200,
        "label": "Lanche",
    }
    response = client.post(
        f"{settings.API_V1_STR}/daily-logs/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["entry_type"] == "food"
    assert content["food_name"] == "Test Banana"
    assert content["recipe_name"] is None
    assert content["energy_kcal"] == 196  # 98 * 2
    assert content["protein_g"] == 2.6
    assert round(content["cost_brl"], 2) == 1.2
    assert content["ingredients"] is None


def test_create_daily_log_for_recipe_shows_scaled_ingredients(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(
        db, name="Egg", energy_kcal=155, protein_g=13, lipid_g=11
    )
    recipe_response = client.post(
        f"{settings.API_V1_STR}/recipes/",
        headers=superuser_token_headers,
        json={
            "name": "Omelete",
            "ingredients": [{"food_id": str(food.id), "quantity_g": 100}],
        },
    )
    recipe_id = recipe_response.json()["id"]

    data = {
        "entry_type": "recipe",
        "recipe_id": recipe_id,
        "recipe_servings": 0.5,
        "label": "Café da manhã",
    }
    response = client.post(
        f"{settings.API_V1_STR}/daily-logs/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["entry_type"] == "recipe"
    assert content["recipe_name"] == "Omelete"
    assert content["food_name"] is None
    assert content["energy_kcal"] == 77.5  # 155 * 0.5
    assert content["protein_g"] == 6.5
    assert content["lipid_g"] == 5.5
    assert len(content["ingredients"]) == 1
    ingredient = content["ingredients"][0]
    assert ingredient["food_name"] == "Egg"
    assert ingredient["quantity_g"] == 50  # 100 * 0.5
    assert ingredient["energy_kcal"] == 77.5
    assert ingredient["protein_g"] == 6.5


def test_create_daily_log_rejects_both_food_and_recipe(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(db)
    recipe = create_random_recipe(db)
    response = client.post(
        f"{settings.API_V1_STR}/daily-logs/",
        headers=superuser_token_headers,
        json={
            "entry_type": "food",
            "food_id": str(food.id),
            "quantity_g": 100,
            "recipe_id": str(recipe.id),
            "recipe_servings": 1,
        },
    )
    assert response.status_code == 422


def test_create_daily_log_rejects_missing_reference(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/daily-logs/",
        headers=superuser_token_headers,
        json={"entry_type": "food"},
    )
    assert response.status_code == 422


def test_create_daily_log_unknown_food(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    unknown_id = uuid.uuid4()
    response = client.post(
        f"{settings.API_V1_STR}/daily-logs/",
        headers=superuser_token_headers,
        json={"entry_type": "food", "food_id": str(unknown_id), "quantity_g": 100},
    )
    assert response.status_code == 404


def test_read_daily_log(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    entry = create_random_daily_log_for_food(db)
    response = client.get(
        f"{settings.API_V1_STR}/daily-logs/{entry.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["id"] == str(entry.id)


def test_read_daily_log_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/daily-logs/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Daily log entry not found"


def test_read_daily_log_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    entry = create_random_daily_log_for_food(db)
    response = client.get(
        f"{settings.API_V1_STR}/daily-logs/{entry.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_read_daily_logs(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_daily_log_for_food(db)
    create_random_daily_log_for_food(db)
    response = client.get(
        f"{settings.API_V1_STR}/daily-logs/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 2


def test_update_daily_log_quantity(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    entry = create_random_daily_log_for_food(db)
    response = client.put(
        f"{settings.API_V1_STR}/daily-logs/{entry.id}",
        headers=superuser_token_headers,
        json={"quantity_g": 300},
    )
    assert response.status_code == 200
    assert response.json()["quantity_g"] == 300


def test_update_daily_log_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.put(
        f"{settings.API_V1_STR}/daily-logs/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json={"quantity_g": 300},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Daily log entry not found"


def test_update_daily_log_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    entry = create_random_daily_log_for_food(db)
    response = client.put(
        f"{settings.API_V1_STR}/daily-logs/{entry.id}",
        headers=normal_user_token_headers,
        json={"quantity_g": 300},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_delete_daily_log(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    entry = create_random_daily_log_for_food(db)
    response = client.delete(
        f"{settings.API_V1_STR}/daily-logs/{entry.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Daily log entry deleted successfully"


def test_delete_daily_log_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/daily-logs/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Daily log entry not found"


def test_delete_daily_log_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    entry = create_random_daily_log_for_food(db)
    response = client.delete(
        f"{settings.API_V1_STR}/daily-logs/{entry.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"
