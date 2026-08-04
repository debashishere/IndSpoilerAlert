from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_suggest_pricing():
    # Test suggest pricing for Dairy category
    response = client.post("/suggest-pricing", json={
        "days_remaining": 15,
        "quantity": 450,
        "original_price": 12.50,
        "category": "Dairy"
    })
    assert response.status_code == 200
    data = response.json()
    assert "recommended_discount" in data
    assert "recommended_price" in data
    assert "expected_sell_through" in data
    assert "expected_revenue" in data
    assert data["recommended_price"] < 12.50
    assert data["elasticity"] == -1.8

def test_recommend_buyers():
    # Test recommend buyers with a distance matrix
    response = client.post("/recommend-buyers", json={
        "product_name": "Dairy Creamer",
        "category": "Dairy",
        "supplier_id": "supp_789",
        "distance_matrix": { 
            "buyer_1": 25.5, 
            "buyer_2": 150.0 
        }
    })
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert len(data["matches"]) == 2
    # The closest buyer (buyer_1) should be ranked 1 due to better distance score
    assert data["matches"][0]["buyer_id"] == "buyer_1"
    assert data["matches"][0]["rank"] == 1

def test_normalize_product_name():
    # Test normalization of product name
    response = client.post("/normalize-product-name", json={
        "name": "Ktchp 24oz"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["original_name"] == "Ktchp 24oz"
    assert data["clean_name"] == "Ketchup"
    assert data["size"] == "24"
    assert data["unit"] == "oz"
    assert data["category"] == "Dry Goods"

    response_dairy = client.post("/normalize-product-name", json={
        "name": "Dairy Creamer 1L"
    })
    assert response_dairy.status_code == 200
    data_dairy = response_dairy.json()
    assert data_dairy["clean_name"] == "Dairy Creamer"
    assert data_dairy["size"] == "1"
    assert data_dairy["unit"] == "l"
    assert data_dairy["category"] == "Dairy"

