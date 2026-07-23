import uuid

from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from tests.utils.food import create_random_food
from tests.utils.recipe import create_random_recipe


def test_create_recipe_with_ingredients(
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
        "name": "Arroz com frango",
        "ingredients": [{"food_id": str(food.id), "quantity_g": 200}],
    }
    response = client.post(
        f"{settings.API_V1_STR}/recipes/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == "Arroz com frango"
    assert len(content["ingredients"]) == 1
    ingredient = content["ingredients"][0]
    assert ingredient["food_name"] == "Test Rice"
    assert ingredient["quantity_g"] == 200
    assert ingredient["energy_kcal"] == 260  # 130 * 2
    assert ingredient["protein_g"] == 5.4
    assert content["total_energy_kcal"] == 260
    assert content["total_protein_g"] == 5.4
    assert content["total_carbohydrate_g"] == 56
    assert content["total_lipid_g"] == 0.6
    assert content["total_cost_brl"] == 0


def test_create_recipe_computes_cost(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    food = create_random_food(db, price_brl=10.0, price_reference_g=500)
    data = {
        "name": "Com preço",
        "ingredients": [{"food_id": str(food.id), "quantity_g": 250}],
    }
    response = client.post(
        f"{settings.API_V1_STR}/recipes/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["ingredients"][0]["cost_brl"] == 5.0
    assert content["total_cost_brl"] == 5.0


def test_create_recipe_unknown_food(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    unknown_id = uuid.uuid4()
    data = {
        "name": "Receita inválida",
        "ingredients": [{"food_id": str(unknown_id), "quantity_g": 100}],
    }
    response = client.post(
        f"{settings.API_V1_STR}/recipes/",
        headers=superuser_token_headers,
        json=data,
    )
    assert response.status_code == 404
    assert str(unknown_id) in response.json()["detail"]


def test_read_recipe(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    response = client.get(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert content["id"] == str(recipe.id)
    assert content["name"] == recipe.name


def test_read_recipe_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.get(
        f"{settings.API_V1_STR}/recipes/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe not found"


def test_read_recipe_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    response = client.get(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_read_recipes(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    create_random_recipe(db)
    create_random_recipe(db)
    response = client.get(
        f"{settings.API_V1_STR}/recipes/",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["data"]) >= 2


def test_update_recipe_fields(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    response = client.put(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=superuser_token_headers,
        json={"name": "Updated name"},
    )
    assert response.status_code == 200
    content = response.json()
    assert content["name"] == "Updated name"
    # existing ingredients are preserved when not provided in the update
    assert len(content["ingredients"]) == 1


def test_update_recipe_replaces_ingredients(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    new_food = create_random_food(db)
    response = client.put(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=superuser_token_headers,
        json={
            "ingredients": [
                {"food_id": str(new_food.id), "quantity_g": 50},
                {"food_id": str(new_food.id), "quantity_g": 75},
            ]
        },
    )
    assert response.status_code == 200
    content = response.json()
    assert len(content["ingredients"]) == 2


def test_update_recipe_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.put(
        f"{settings.API_V1_STR}/recipes/{uuid.uuid4()}",
        headers=superuser_token_headers,
        json={"name": "Updated name"},
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe not found"


def test_update_recipe_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    response = client.put(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=normal_user_token_headers,
        json={"name": "Updated name"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_delete_recipe(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    response = client.delete(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Recipe deleted successfully"


def test_delete_recipe_not_found(
    client: TestClient, superuser_token_headers: dict[str, str]
) -> None:
    response = client.delete(
        f"{settings.API_V1_STR}/recipes/{uuid.uuid4()}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe not found"


def test_delete_recipe_not_enough_permissions(
    client: TestClient, normal_user_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    response = client.delete(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=normal_user_token_headers,
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Not enough permissions"


def test_delete_recipe_in_use_by_daily_log(
    client: TestClient, superuser_token_headers: dict[str, str], db: Session
) -> None:
    recipe = create_random_recipe(db)
    response = client.post(
        f"{settings.API_V1_STR}/daily-logs/",
        headers=superuser_token_headers,
        json={
            "entry_type": "recipe",
            "recipe_id": str(recipe.id),
            "recipe_servings": 1,
        },
    )
    assert response.status_code == 200

    response = client.delete(
        f"{settings.API_V1_STR}/recipes/{recipe.id}",
        headers=superuser_token_headers,
    )
    assert response.status_code == 400
    assert "cannot be deleted" in response.json()["detail"]
