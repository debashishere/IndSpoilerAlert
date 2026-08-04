import os
import shutil
import tempfile
import csv
import json
import threading
import time
from fastapi import FastAPI, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
from scipy.optimize import minimize
import boto3

# Docling imports
try:
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode
    from docling.document_converter import DocumentConverter, PdfFormatOption
    import pandas as pd
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False

# AWS clients
s3_endpoint = os.environ.get("S3_ENDPOINT", "http://localhost:4566")
sqs_endpoint = os.environ.get("SQS_ENDPOINT", "http://localhost:4566")
aws_region = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")

s3_client = boto3.client(
    "s3",
    endpoint_url=s3_endpoint,
    region_name=aws_region,
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
)

sqs_client = boto3.client(
    "sqs",
    endpoint_url=sqs_endpoint,
    region_name=aws_region,
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "test"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "test"),
)

app = FastAPI(title="Spoiler Alert Sidecar Service")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=status.HTTP_200_OK)
async def health():
    return {"status": "SideCar is healthy"}

class TableData(BaseModel):
    name: str
    headers: List[str]
    rows: List[List[str]]

class ParseResponse(BaseModel):
    tables: List[TableData]

# Initialize Docling converter if available
doc_converter = None
if DOCLING_AVAILABLE:
    try:
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_table_structure = True
        pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE
        pipeline_options.table_structure_options.do_cell_matching = False
        
        doc_converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        print("Docling initialized successfully.")
    except Exception as e:
        print(f"Error initializing Docling: {e}")

def parse_file_local(tmp_path: str, file_ext: str) -> List[TableData]:
    parsed_tables = []
    if file_ext == '.csv':
        # Parse CSV
        headers = []
        rows = []
        with open(tmp_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            try:
                headers = next(reader)
                for row in reader:
                    rows.append(row)
            except StopIteration:
                pass
        parsed_tables.append(TableData(
            name="Table_0",
            headers=headers,
            rows=rows
        ))
        
    elif file_ext == '.pdf':
        if not DOCLING_AVAILABLE or doc_converter is None:
            raise Exception("Docling library is not available or failed to initialize.")
            
        conv_result = doc_converter.convert(tmp_path)
        
        # Extract tables
        for idx, table in enumerate(conv_result.document.tables):
            df = table.export_to_dataframe()
            headers = []
            for col in df.columns:
                if pd.isna(col):
                    headers.append("")
                else:
                    headers.append(str(col))
                    
            rows = []
            for row_vals in df.values.tolist():
                cleaned_row = []
                for val in row_vals:
                    if pd.isna(val):
                        cleaned_row.append("")
                    else:
                        cleaned_row.append(str(val))
                rows.append(cleaned_row)
                
            parsed_tables.append(TableData(
                name=f"Table_{idx}",
                headers=headers,
                rows=rows
            ))
    else:
        raise Exception(f"Unsupported file format: {file_ext}")
        
    return parsed_tables

def sqs_worker_loop():
    print("SQS worker thread started.")
    backend_url = os.environ.get("BACKEND_URL")
    if not backend_url:
        if os.path.exists("/.dockerenv"):
            backend_url = "http://backend:5001"
        else:
            backend_url = "http://localhost:5001"

    queue_name = "spoiler-alert-ingestion-jobs"
    while True:
        try:
            try:
                response = sqs_client.get_queue_url(QueueName=queue_name)
                queue_url = response['QueueUrl']
            except Exception as e:
                time.sleep(2)
                continue

            res = sqs_client.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=5
            )
            messages = res.get('Messages', [])
            for message in messages:
                receipt_handle = message['ReceiptHandle']
                body = json.loads(message['Body'])
                ingestion_job_id = body.get('ingestionJobId')
                s3_bucket = body.get('s3Bucket')
                s3_key = body.get('s3Key')
                file_name = body.get('fileName')
                mimetype = body.get('mimetype')

                print(f"SQS worker processing job {ingestion_job_id}")

                # Update status to 'parsing'
                try:
                    import httpx
                    httpx.post(f"{backend_url}/api/ingest/callback", json={
                        "ingestionJobId": ingestion_job_id,
                        "status": "parsing"
                    }, timeout=5.0)
                except Exception as ex:
                    print(f"Failed to post parsing status: {ex}")

                # Download file from S3
                file_ext = os.path.splitext(file_name)[1].lower()
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
                    tmp_path = tmp_file.name

                try:
                    s3_client.download_file(s3_bucket, s3_key, tmp_path)
                    
                    # Parse local file
                    parsed_tables = parse_file_local(tmp_path, file_ext)
                    if not parsed_tables:
                        raise Exception("No tables extracted from the document.")
                    
                    table = parsed_tables[0]
                    # Convert TableData Pydantic model to dict/lists
                    raw_grid = [table.headers] + table.rows

                    # Post callback
                    import httpx
                    httpx.post(f"{backend_url}/api/ingest/callback", json={
                        "ingestionJobId": ingestion_job_id,
                        "status": "parsed",
                        "rawGrid": raw_grid
                    }, timeout=10.0)

                    # Delete from SQS
                    sqs_client.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
                except Exception as ex:
                    print(f"Error during async parsing of job {ingestion_job_id}: {ex}")
                    try:
                        import httpx
                        httpx.post(f"{backend_url}/api/ingest/callback", json={
                            "ingestionJobId": ingestion_job_id,
                            "status": "error",
                            "importErrors": [str(ex)]
                        }, timeout=5.0)
                    except Exception as callback_ex:
                        print(f"Failed to post error callback: {callback_ex}")
                    # Delete message to avoid poison queue loop
                    try:
                        sqs_client.delete_message(QueueUrl=queue_url, ReceiptHandle=receipt_handle)
                    except Exception:
                        pass
                finally:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
        except Exception as e:
            print(f"Error in SQS worker loop: {e}")
            time.sleep(2)

def start_sqs_worker():
    thread = threading.Thread(target=sqs_worker_loop, daemon=True)
    thread.start()

@app.on_event("startup")
def on_startup():
    start_sqs_worker()

@app.post("/parse-document", response_model=ParseResponse)
async def parse_document(file: UploadFile = File(...)):
    filename = file.filename or "temp_file"
    file_ext = os.path.splitext(filename)[1].lower()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        shutil.copyfileobj(file.file, tmp_file)
        tmp_path = tmp_file.name
        
    try:
        parsed_tables = parse_file_local(tmp_path, file_ext)
        return ParseResponse(tables=parsed_tables)
    except Exception as e:
        print(f"Error during parsing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse document: {str(e)}")
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# Pricing Simulator Endpoint
class PricingRequest(BaseModel):
    days_remaining: int
    quantity: int
    original_price: float
    category: str

class PricingResponse(BaseModel):
    recommended_discount: float
    recommended_price: float
    expected_sell_through: float
    expected_revenue: float
    elasticity: float

@app.post("/suggest-pricing", response_model=PricingResponse)
async def suggest_pricing(req: PricingRequest):
    # Elasticity depends on category
    elasticities = {
        "Dairy": -1.8,
        "Produce": -2.2,
        "Meat": -2.0,
        "Dry Goods": -1.2,
        "Beverages": -1.5
    }
    elasticity = elasticities.get(req.category, -1.5)
    
    # Optimization solver using scipy.optimize.minimize
    # We want to find the discount d that maximizes expected revenue:
    # Expected Revenue = Quantity * Price * Sell-through(d, days_remaining, elasticity)
    # where Price = OriginalPrice * (1 - d)
    
    # We define the objective function to minimize (negative expected revenue)
    def objective_func(d_val):
        d = d_val[0]
        price = req.original_price * (1.0 - d)
        
        # Logistic model for sell-through probability:
        # Base discount where sell-through is 50% shifts as expiration approaches:
        d_half = 0.8 - 0.7 * (req.days_remaining / 30.0)
        d_half = max(0.1, min(0.8, d_half))
        
        # Steepness of logistic curve depends on the category elasticity:
        k = 4.0 * abs(elasticity)
        sell_through = 1.0 / (1.0 + np.exp(-k * (d - d_half)))
        
        # Quantity adjustments: higher volume slightly reduces sell-through for a given discount
        if req.quantity > 500:
            sell_through *= 0.90
        elif req.quantity > 100:
            sell_through *= 0.95
            
        sell_through = min(0.99, max(0.01, sell_through))
        revenue = req.quantity * price * sell_through
        return -revenue

    # Run optimizer with initial guess of 30% discount and bounds [5%, 95%]
    res = minimize(objective_func, x0=[0.3], bounds=[(0.05, 0.95)], method='L-BFGS-B')
    recommended_discount = float(res.x[0])
    recommended_price = req.original_price * (1.0 - recommended_discount)
    
    # Calculate expected sell-through rate at the optimized discount
    d_half = 0.8 - 0.7 * (req.days_remaining / 30.0)
    d_half = max(0.1, min(0.8, d_half))
    k = 4.0 * abs(elasticity)
    expected_sell_through = 1.0 / (1.0 + np.exp(-k * (recommended_discount - d_half)))
    if req.quantity > 500:
        expected_sell_through *= 0.90
    elif req.quantity > 100:
        expected_sell_through *= 0.95
    expected_sell_through = min(0.99, max(0.01, expected_sell_through))
    
    expected_revenue = req.quantity * recommended_price * expected_sell_through

    return PricingResponse(
        recommended_discount=round(recommended_discount, 4),
        recommended_price=round(recommended_price, 2),
        expected_sell_through=round(expected_sell_through, 4),
        expected_revenue=round(expected_revenue, 2),
        elasticity=elasticity
    )


# Buyer Matching Endpoint
class BuyerMatchDetail(BaseModel):
    buyer_id: str
    score: float
    rank: int
    reasons: List[str]
    distance: float

class BuyerRecommendRequest(BaseModel):
    product_name: str
    category: str
    supplier_id: str
    distance_matrix: Dict[str, float]  # buyerId -> distance
    product_allergens: List[str] = []
    buyer_exclusions: Dict[str, List[str]] = {}

class BuyerRecommendResponse(BaseModel):
    matches: List[BuyerMatchDetail]

@app.post("/recommend-buyers", response_model=BuyerRecommendResponse)
async def recommend_buyers(req: BuyerRecommendRequest):
    # Recommend buyers based on category, preferences, and distance
    matches = []
    
    # Mock database profiles or logic
    # In a full app, we would query MongoDB, but sidecar only gets this request input.
    # The caller provides a distance matrix for available buyers.
    
    for idx, (buyer_id, dist) in enumerate(req.distance_matrix.items()):
        # Check allergen conflict
        exclusions = req.buyer_exclusions.get(buyer_id, [])
        if any(allergen in req.product_allergens for allergen in exclusions):
            print(f"Excluding buyer {buyer_id} due to allergen conflict.")
            continue

        # Base score on distance
        # under 50 miles -> high score
        # category preference matches -> we can simulate category preference matching
        # Let's say even buyer_ids prefer Dairy, odd prefer Produce, etc.
        cat_match = (idx % 2 == 0) # Dairy match mock
        
        score = 0.50
        reasons = []

        
        if dist <= 50:
            score += 0.30
            reasons.append("Under 50 miles")
        elif dist <= 100:
            score += 0.15
            reasons.append("Under 100 miles")
        else:
            reasons.append("Over 100 miles")
            
        if cat_match:
            score += 0.15
            reasons.append(f"Prefers category: {req.category}")
        else:
            reasons.append("Category acceptable")
            
        score = min(0.99, max(0.10, score))
        
        matches.append(BuyerMatchDetail(
            buyer_id=buyer_id,
            score=round(score, 2),
            rank=0, # Will set after sorting
            reasons=reasons,
            distance=dist
        ))
        
    # Sort matches by score descending, then by distance ascending
    matches.sort(key=lambda x: (-x.score, x.distance))
    
    # Update ranks
    for rank, match in enumerate(matches, 1):
        match.rank = rank
        
    # Return top 5 matches
    return BuyerRecommendResponse(matches=matches[:5])

# Product Name Normalization Endpoints
class NameNormalizationRequest(BaseModel):
    name: str

class NameNormalizationResponse(BaseModel):
    original_name: str
    clean_name: str
    size: str
    unit: str
    category: str

@app.post("/normalize-product-name", response_model=NameNormalizationResponse)
async def normalize_name(req: NameNormalizationRequest):
    import re
    import os
    import httpx
    
    # Try Gemini API if API key is present
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt = (
                f"Analyze the following product description from a CPG invoice or inventory list: '{req.name}'. "
                "Extract the following details as JSON:\n"
                "1. 'clean_name': The product name without size/volume/packaging indicators (e.g. 'Ktchp 24oz' becomes 'Tomato Ketchup', 'Dairy Creamer 1L' becomes 'Dairy Creamer'). Expand abbreviations (e.g. 'Ktchp' -> 'Ketchup', 'Mayo' -> 'Mayonnaise').\n"
                "2. 'size': The numeric quantity of the size (e.g. '24', '1.5', '500'). If not present, empty string.\n"
                "3. 'unit': The unit of the size (e.g. 'oz', 'L', 'ml', 'g', 'lb'). If not present, empty string.\n"
                "4. 'category': Must be one of 'Dairy', 'Produce', 'Meat', 'Dry Goods', 'Beverages'. Guess based on the name.\n"
            )
            
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseSchema": {
                        "type": "OBJECT",
                        "properties": {
                            "clean_name": {"type": "STRING"},
                            "size": {"type": "STRING"},
                            "unit": {"type": "STRING"},
                            "category": {"type": "STRING", "enum": ["Dairy", "Produce", "Meat", "Dry Goods", "Beverages"]}
                        },
                        "required": ["clean_name", "size", "unit", "category"]
                    }
                }
            }
            
            with httpx.Client(timeout=5.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    res_json = res.json()
                    text = res_json['candidates'][0]['content']['parts'][0]['text']
                    import json
                    parsed = json.loads(text.strip())
                    return NameNormalizationResponse(
                        original_name=req.name,
                        clean_name=parsed.get("clean_name", req.name),
                        size=parsed.get("size", ""),
                        unit=parsed.get("unit", ""),
                        category=parsed.get("category", "Dry Goods")
                    )
        except Exception as e:
            print(f"Error calling Gemini API: {e}. Falling back to rule-based parser.")
            
    # Fallback/Default rule-based parsing:
    name = req.name
    size_pattern = r'(\d+(?:\.\d+)?)\s*(oz|ozs|ounces?|g|grams?|kg|kgs?|kilograms?|l|liters?|litres?|ml|mls?|milliliters?|lb|lbs?|pounds?|pcs|packs?|pk|bags?|ct)\b'
    match = re.search(size_pattern, name, re.IGNORECASE)
    
    size = ""
    unit = ""
    clean_name = name
    
    if match:
        size = match.group(1)
        unit = match.group(2).lower()
        clean_name = re.sub(size_pattern, '', name, flags=re.IGNORECASE).strip()
        clean_name = re.sub(r'\s+[-–,]\s*$', '', clean_name)
        clean_name = re.sub(r'^\s*[-–,]\s+', '', clean_name)
        clean_name = re.sub(r'\s+', ' ', clean_name).strip()
        
    abbreviations = {
        r'\bktchp\b': 'Ketchup',
        r'\bmayo\b': 'Mayonnaise',
        r'\bchoc\b': 'Chocolate',
        r'\bbf\b': 'Beef',
        r'\bchk\b': 'Chicken',
        r'\borg\b': 'Organic',
        r'\bveg\b': 'Vegetable',
        r'\bpnt\b': 'Peanut',
        r'\bbtl\b': 'Bottle',
        r'\bspl\b': 'Special',
        r'\bshrt\b': 'Short',
        r'\bwhl\b': 'Whole',
        r'\bscr\b': 'Sour',
        r'\bcrm\b': 'Cream',
        r'\byg\b': 'Yogurt',
        r'\bpep\b': 'Pepper'
    }
    
    for abbr, full in abbreviations.items():
        clean_name = re.sub(abbr, full, clean_name, flags=re.IGNORECASE)
        
    category = "Dry Goods"
    clean_name_lower = clean_name.lower()
    
    categories_map = {
        "Dairy": ["creamer", "milk", "cheese", "dairy", "butter", "yogurt", "cream", "sour cream", "margarine"],
        "Produce": ["apple", "banana", "lettuce", "tomato", "produce", "salad", "carrot", "berry", "fruit", "berries", "spinach", "potato", "onion", "avocado", "lemon", "lime"],
        "Meat": ["beef", "chicken", "pork", "meat", "turkey", "steak", "sausage", "ham", "bacon", "lamb"],
        "Beverages": ["water", "soda", "juice", "beverage", "drink", "cola", "tea", "coffee", "cider", "energy drink"],
    }
    
    for cat, keywords in categories_map.items():
        if any(keyword in clean_name_lower for keyword in keywords):
            category = cat
            break
            
    return NameNormalizationResponse(
        original_name=req.name,
        clean_name=clean_name,
        size=size,
        unit=unit,
        category=category
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="info")


