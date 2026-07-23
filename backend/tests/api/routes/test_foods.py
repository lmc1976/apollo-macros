import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.food import create_random_food
from tests.utils.meal import create_random_meal
from tests.utils.utils import random_lower_string


def test_create_food(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "name": "Banana",
        "food_group": "Frutas",
        "source": "TACO",
        "energy_kcal": 89,
        "protein_g": 1.1,
        "carbohydrate_g": 22.8,
        "lipid_g": 0.3,
    }
    response = client.post(
        f"{settings.API_V1_STR}/foods/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["food_group"] == data["food_group"]
    assert content["energy_kcal"] == data["energy_kcal"]
    assert "id" in content


def test_create_food_only_name_required(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.post(
        f"{settings.API_V1_STR}/foods/",
        headers=superuser_token_headers,
        json={"name": "Minimal food"},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == "Minimal food"
    assert content["energy_kcal"] is None


def test_read_food(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(db)
    response = client.get(
        f"{settings.API_V1_STR}/foods/{food.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == food.name
    assert content["id"] == str(food.id)


def test_read_food_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/foods/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Food not found"


def test_read_foods_search_by_name(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    unique_name = f"searchable-{random_lower_string()}"
    create_random_food(db, name=unique_name)
    response = client.get(
        f"{settings.API_V1_STR}/foods/",
        headers=superuser_token_headers,
        params={"q": unique_name},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["count"] == 1
    assert content["data"][0]["name"] == unique_name


def test_update_food(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(db)
    data = {"name": "Updated food", "energy_kcal": 250}
    response = client.put(
        f"{settings.API_V1_STR}/foods/{food.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == data["name"]
    assert content["energy_kcal"] == data["energy_kcal"]


def test_update_food_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.put(
        f"{settings.API_V1_STR}/foods/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json={"name": "Updated food"},
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Food not found"


def test_delete_food(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(db)
    response = client.delete(
        f"{settings.API_V1_STR}/foods/{food.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Food deleted successfully"


def test_delete_food_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/foods/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Food not found"


def test_delete_food_in_use(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    food_id = meal.food_entries[0].food_id
    response = client.delete(
        f"{settings.API_V1_STR}/foods/{food_id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    content = response.json()
    assert "cannot be deleted" in content["detail"]
