import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.food_entry import create_random_food_entry


def test_create_food_entry(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {
        "food_name": "Banana",
        "quantity_g": 120,
        "calories": 105,
        "protein_g": 1.3,
        "carbs_g": 27,
        "fat_g": 0.4,
    }
    response = client.post(
        f"{settings.API_V1_STR}/food-entries/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["food_name"] == data["food_name"]
    assert content["quantity_g"] == data["quantity_g"]
    assert content["calories"] == data["calories"]
    assert content["protein_g"] == data["protein_g"]
    assert content["carbs_g"] == data["carbs_g"]
    assert content["fat_g"] == data["fat_g"]
    assert "id" in content
    assert "owner_id" in content
    assert "entry_datetime" in content


def test_read_food_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food_entry = create_random_food_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/food-entries/{food_entry.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["food_name"] == food_entry.food_name
    assert content["quantity_g"] == food_entry.quantity_g
    assert content["calories"] == food_entry.calories
    assert content["protein_g"] == food_entry.protein_g
    assert content["carbs_g"] == food_entry.carbs_g
    assert content["fat_g"] == food_entry.fat_g
    assert content["id"] == str(food_entry.id)
    assert content["owner_id"] == str(food_entry.owner_id)


def test_read_food_entry_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/food-entries/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Food entry not found"


def test_read_food_entry_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    food_entry = create_random_food_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/food-entries/{food_entry.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_read_food_entries(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_food_entry(db)
    create_random_food_entry(db)
    response = client.get(
        f"{settings.API_V1_STR}/food-entries/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_food_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food_entry = create_random_food_entry(db)
    data = {"food_name": "Updated food", "calories": 250}
    response = client.put(
        f"{settings.API_V1_STR}/food-entries/{food_entry.id}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["food_name"] == data["food_name"]
    assert content["calories"] == data["calories"]
    assert content["id"] == str(food_entry.id)
    assert content["owner_id"] == str(food_entry.owner_id)


def test_update_food_entry_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    data = {"food_name": "Updated food", "calories": 250}
    response = client.put(
        f"{settings.API_V1_STR}/food-entries/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Food entry not found"


def test_update_food_entry_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    food_entry = create_random_food_entry(db)
    data = {"food_name": "Updated food", "calories": 250}
    response = client.put(
        f"{settings.API_V1_STR}/food-entries/{food_entry.id}",
        headers=normal_user_token_headers,
        json=data,
    )
    assert response.status_code == 403
    content = response.json()
    assert content["detail"] == "Not enough permissions"


def test_delete_food_entry(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food_entry = create_random_food_entry(db)
    response = client.delete(
        f"{settings.API_V1_STR}/food-entries/{food_entry.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["message"] == "Food entry deleted successfully"


def test_delete_food_entry_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/food-entries/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    content = response.json()
    assert content["detail"] == "Food entry not found"


def test_delete_food_entry_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    food_entry = create_random_food_entry(db)
    response = client.delete(
        f"{settings.API_V1_STR}/food-entries/{food_entry.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    content = response.json()
    assert content["detail"] == "Not enough permissions"
