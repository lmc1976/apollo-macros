import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.food import create_random_food
from tests.utils.meal import create_random_meal


def test_create_meal_with_food_entries(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(
        db,
        name="Test Rice",
        energy_kcal=130,
        protein_g=2.7,
        carbohydrate_g=28,
        lipid_g=0.3,
    )
    data = {
        "label": "Almoço",
        "is_recipe": False,
        "food_entries": [{"food_id": str(food.id), "quantity_g": 200}],
    }
    response = client.post(
        f"{settings.API_V1_STR}/meals/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["label"] == "Almoço"
    assert len(content["food_entries"]) == 1
    entry = content["food_entries"][0]
    assert entry["food_name"] == "Test Rice"
    assert entry["quantity_g"] == 200
    assert entry["energy_kcal"] == 260  # 130 * 2
    assert entry["protein_g"] == 5.4
    assert content["total_energy_kcal"] == 260
    assert content["total_protein_g"] == 5.4
    assert content["total_carbohydrate_g"] == 56
    assert content["total_lipid_g"] == 0.6
    assert content["total_cost_brl"] == 0


def test_create_meal_computes_cost(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(db, price_brl=10.0, price_reference_g=500)
    data = {
        "label": "Com preço",
        "food_entries": [{"food_id": str(food.id), "quantity_g": 250}],
    }
    response = client.post(
        f"{settings.API_V1_STR}/meals/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["food_entries"][0]["cost_brl"] == 5.0
    assert content["total_cost_brl"] == 5.0


def test_create_meal_unknown_food(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    unknown_id = uuid.uuid4()
    data = {
        "label": "Refeição inválida",
        "food_entries": [{"food_id": str(unknown_id), "quantity_g": 100}],
    }
    response = client.post(
        f"{settings.API_V1_STR}/meals/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert str(unknown_id) in response.json()["detail"]


def test_read_meal(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    response = client.get(
        f"{settings.API_V1_STR}/meals/{meal.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(meal.id)
    assert content["label"] == meal.label


def test_read_meal_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/meals/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Meal not found"


def test_read_meal_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    response = client.get(
        f"{settings.API_V1_STR}/meals/{meal.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_read_meals(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_meal(db)
    create_random_meal(db)
    response = client.get(
        f"{settings.API_V1_STR}/meals/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_meal_fields(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    response = client.put(
        f"{settings.API_V1_STR}/meals/{meal.id}",
        headers=superuser_token_headers,
        json={"label": "Updated label", "is_recipe": True},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["label"] == "Updated label"
    assert content["is_recipe"] is True
    # existing food entries are preserved when not provided in the update
    assert len(content["food_entries"]) == 1


def test_update_meal_replaces_food_entries(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    new_food = create_random_food(db)
    response = client.put(
        f"{settings.API_V1_STR}/meals/{meal.id}",
        headers=superuser_token_headers,
        json={
            "food_entries": [
                {"food_id": str(new_food.id), "quantity_g": 50},
                {"food_id": str(new_food.id), "quantity_g": 75},
            ]
        },
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["food_entries"]) == 2


def test_update_meal_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.put(
        f"{settings.API_V1_STR}/meals/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json={"label": "Updated label"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Meal not found"


def test_update_meal_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    response = client.put(
        f"{settings.API_V1_STR}/meals/{meal.id}",
        headers=normal_user_token_headers,
        json={"label": "Updated label"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_delete_meal(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    response = client.delete(
        f"{settings.API_V1_STR}/meals/{meal.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Meal deleted successfully"


def test_delete_meal_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/meals/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Meal not found"


def test_delete_meal_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    meal = create_random_meal(db)
    response = client.delete(
        f"{settings.API_V1_STR}/meals/{meal.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"
