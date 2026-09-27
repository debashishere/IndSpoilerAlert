import io
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

def test_parse_document_image_ocr():
    # Test OCR parsing on an image document (.png)
    import io
    from PIL import Image, ImageDraw, ImageFont

    img = Image.new('RGB', (400, 100), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Item,Quantity,Price", fill=(0, 0, 0))
    d.text((10, 40), "Milk,10,2.50", fill=(0, 0, 0))
    
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)

    response = client.post("/parse-document", files={"file": ("invoice.png", buf, "image/png")})
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data
    assert len(data["tables"]) > 0
    table = data["tables"][0]
    assert len(table["headers"]) > 0 or len(table["rows"]) > 0

def test_parse_document_pdf_ocr_fallback(monkeypatch):
    # Test PDF parsing fallback to OCR when Docling is unavailable or fails
    import main
    monkeypatch.setattr(main, "DOCLING_AVAILABLE", False)
    monkeypatch.setattr(main, "doc_converter", None)

    # Simple 1-page PDF or mock file
    pdf_bytes = b"%PDF-1.4 header test document"
    buf = io.BytesIO(pdf_bytes)

    response = client.post("/parse-document", files={"file": ("scanned_invoice.pdf", buf, "application/pdf")})
    assert response.status_code == 200
    data = response.json()
    assert "tables" in data


