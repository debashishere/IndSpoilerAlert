#!/usr/bin/env python3
"""
SpoilerAlert Multi-Pipeline Doc Scanner - Test Image Generator
==============================================================
Generates realistic, high-resolution test image files (.png, .jpg, .jpeg)
specifically designed to test the features documented in:
.scratch/multi-pipeline-doc-scanner/issues/
  - 01: Multi-Pipeline Ingress Target Selection and Telemetry
  - 02: Multi-Pipeline OCR Upload Dispatch and Image Ingress
  - 03: Scanned Documents Roster Target Lineage and Re-staging
  - 04: In-Situ Import Commit Handshake and Pipeline Navigation

Pipeline Targets Covered:
  1. Inventory Data (Blue badges / inventory canonical schema)
  2. Sales Data     (Emerald badges / sales canonical schema)
  3. Buyer Data     (Purple badges / buyer canonical schema)

Formats Covered:
  - PNG  (.png)
  - JPG  (.jpg)
  - JPEG (.jpeg)
"""

import os
import sys
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scanned_documents")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_fonts():
    """Load system truetype fonts or fallback to default."""
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNSMono.ttf",
        "/System/Library/Fonts/Menlo.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    font_path = None
    for p in font_paths:
        if os.path.exists(p):
            font_path = p
            break

    if font_path:
        try:
            return {
                "title": ImageFont.truetype(font_path, 26),
                "subtitle": ImageFont.truetype(font_path, 15),
                "badge": ImageFont.truetype(font_path, 13),
                "header": ImageFont.truetype(font_path, 14),
                "body": ImageFont.truetype(font_path, 13),
                "bold": ImageFont.truetype(font_path, 14),
                "small": ImageFont.truetype(font_path, 11),
                "mono": ImageFont.truetype("/System/Library/Fonts/Menlo.ttc" if os.path.exists("/System/Library/Fonts/Menlo.ttc") else font_path, 12),
            }
        except Exception:
            pass

    default = ImageFont.load_default()
    return {k: default for k in ["title", "subtitle", "badge", "header", "body", "bold", "small", "mono"]}

FONTS = get_fonts()

TARGET_COLORS = {
    "inventory": {
        "primary": (30, 64, 175),       # Blue 800
        "accent": (59, 130, 246),       # Blue 500
        "light": (239, 246, 255),       # Blue 50
        "border": (191, 219, 254),      # Blue 200
        "tag": "INVENTORY DATA TARGET",
        "tag_badge_bg": (219, 234, 254),
        "tag_badge_text": (29, 78, 216),
    },
    "sales": {
        "primary": (6, 95, 70),         # Emerald 800
        "accent": (16, 185, 129),       # Emerald 500
        "light": (236, 253, 245),       # Emerald 50
        "border": (167, 243, 208),      # Emerald 200
        "tag": "SALES DATA TARGET",
        "tag_badge_bg": (209, 250, 229),
        "tag_badge_text": (4, 120, 87),
    },
    "buyers": {
        "primary": (88, 28, 135),       # Purple 800
        "accent": (139, 92, 246),       # Purple 500
        "light": (245, 243, 255),       # Purple 50
        "border": (221, 214, 254),      # Purple 200
        "tag": "BUYER DATA TARGET",
        "tag_badge_bg": (237, 233, 254),
        "tag_badge_text": (109, 40, 217),
    },
}

def draw_badge(draw, x, y, text, bg_color, text_color, font=FONTS["badge"]):
    padding_x = 10
    padding_y = 4
    bbox = font.getbbox(text) if hasattr(font, 'getbbox') else (0, 0, len(text)*8, 14)
    w = bbox[2] - bbox[0] + padding_x * 2
    h = bbox[3] - bbox[1] + padding_y * 2
    draw.rounded_rectangle([x, y, x + w, y + h], radius=4, fill=bg_color)
    draw.text((x + padding_x, y + padding_y), text, fill=text_color, font=font)
    return x + w, y + h

def draw_table(draw, start_x, start_y, columns, rows, col_widths, colors):
    x = start_x
    y = start_y
    total_w = sum(col_widths)
    header_h = 32
    row_h = 28

    # Header Row Background
    draw.rectangle([x, y, x + total_w, y + header_h], fill=colors["primary"])
    
    cur_x = x
    for idx, col in enumerate(columns):
        w = col_widths[idx]
        draw.text((cur_x + 8, y + 8), col, fill=(255, 255, 255), font=FONTS["bold"])
        if idx > 0:
            draw.line([(cur_x, y), (cur_x, y + header_h)], fill=(255, 255, 255, 100), width=1)
        cur_x += w

    y += header_h

    # Data Rows
    for r_idx, row in enumerate(rows):
        bg = (255, 255, 255) if r_idx % 2 == 0 else (248, 250, 252)
        draw.rectangle([x, y, x + total_w, y + row_h], fill=bg)
        
        # Bottom border
        draw.line([(x, y + row_h), (x + total_w, y + row_h)], fill=(226, 232, 240), width=1)
        
        cur_x = x
        for c_idx, cell in enumerate(row):
            w = col_widths[c_idx]
            cell_str = str(cell)
            draw.text((cur_x + 8, y + 6), cell_str, fill=(30, 41, 59), font=FONTS["body"])
            if c_idx > 0:
                draw.line([(cur_x, y), (cur_x, y + row_h)], fill=(226, 232, 240), width=1)
            cur_x += w
        
        y += row_h

    # Outer border
    draw.rectangle([x, start_y, x + total_w, y], outline=(203, 213, 225), width=1)
    return total_w, y - start_y


# =============================================================================
# 1. INVENTORY: Warehouse Inbound Receiving Manifest (PNG)
# =============================================================================
def generate_inventory_manifest_png():
    width, height = 1300, 880
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["inventory"]

    # Top Brand Bar
    draw.rectangle([0, 0, width, 12], fill=colors["primary"])

    # Document Header
    draw.text((60, 40), "SYSCO METRO LOGISTICS & SUPPLY CHAIN", fill=colors["primary"], font=FONTS["title"])
    draw.text((60, 75), "Inbound Receiving Packing Manifest — Surplus Ingress Hub", fill=(100, 116, 139), font=FONTS["subtitle"])

    # Target Badge
    draw_badge(draw, width - 280, 40, colors["tag"], colors["tag_badge_bg"], colors["tag_badge_text"])

    # Meta Info Box
    draw.rounded_rectangle([60, 115, width - 60, 185], radius=6, fill=colors["light"], outline=colors["border"], width=1)
    draw.text((80, 128), "Document ID: MANIFEST-2026-OCT-8812", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((80, 152), "Carrier: Swift Cold-Chain Transport (Trailer #492)", fill=(71, 85, 105), font=FONTS["body"])
    
    draw.text((500, 128), "Date Received: 2026-10-02 08:30 EST", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((500, 152), "Receiving Facility: Chicago DC-1 (Cold Bay 3)", fill=(71, 85, 105), font=FONTS["body"])

    draw.text((920, 128), "Target Pipeline: Inventory Data", fill=colors["primary"], font=FONTS["bold"])
    draw.text((920, 152), "Supplier: Fresh Greens Co (FGC)", fill=(71, 85, 105), font=FONTS["body"])

    # Table
    columns = ["Item Description", "Lot Code", "Quantity Cases", "Price / Case", "Expiration Date", "Warehouse"]
    widths = [360, 160, 140, 130, 160, 230]
    rows = [
        ["Organic Romaine Hearts 24ct", "ROM-2026-99", "120", "$28.50", "2026-11-15", "Chicago DC-1"],
        ["Hydroponic Butterhead Lettuce", "LETT-HYD-04", "85", "$22.00", "2026-11-08", "Chicago DC-1"],
        ["Chobani Greek Yogurt Plain 32oz", "CHOB-2026-04", "240", "$18.25", "2026-10-28", "Newark Hub"],
        ["Oatly Barista Edition Oat Milk 12pk", "OAT-2026-18", "310", "$32.00", "2026-12-05", "Dallas Hub"],
        ["Beyond Meat Plant Burger Patties", "BYND-2026-77", "95", "$44.50", "2026-11-20", "Atlanta South"],
        ["Vital Farms Pasture-Raised Eggs 12ct", "VIT-2026-12", "180", "$19.75", "2026-10-31", "Chicago DC-1"],
        ["Silk Almond Milk Unsweetened 64oz", "SLK-2026-55", "150", "$21.00", "2026-11-25", "Seattle Hub"],
        ["Siggi's Icelandic Skyr Vanilla 5.3oz", "SIG-2026-88", "210", "$16.50", "2026-11-12", "Newark Hub"],
        ["Horizon Organic Whole Milk 1gal", "HRZ-2026-31", "140", "$25.00", "2026-10-29", "Chicago DC-1"],
    ]

    draw_table(draw, 60, 215, columns, rows, widths, colors)

    # Footer
    table_bottom = 215 + 32 + (len(rows) * 28)
    draw.text((60, table_bottom + 25), "Summary: 9 Pallet Lots | 1,530 Total Cases | Certified Cold-Chain Ingress", fill=(71, 85, 105), font=FONTS["bold"])
    draw.text((60, table_bottom + 50), "Verification Note: Ingress targets Inventory Data pipeline. Maps directly into ProductMaster & InventoryLot.", fill=(100, 116, 139), font=FONTS["small"])

    # Stamp / Signoff box
    stamp_x = width - 360
    stamp_y = table_bottom + 15
    draw.rounded_rectangle([stamp_x, stamp_y, width - 60, stamp_y + 70], radius=4, outline=(148, 163, 184), width=1)
    draw.text((stamp_x + 15, stamp_y + 12), "RECEIVING DOCK INSPECTION", fill=(100, 116, 139), font=FONTS["small"])
    draw.text((stamp_x + 15, stamp_y + 32), "STATUS: ACCEPTED & STAGED", fill=colors["primary"], font=FONTS["bold"])
    draw.text((stamp_x + 15, stamp_y + 50), "Inspector: M. Vance #418", fill=(100, 116, 139), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "01_inventory_manifest_packing_slip.png")
    img.save(out_path, "PNG")
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


# =============================================================================
# 2. INVENTORY: Warehouse Bill of Lading BOL Photo (JPG)
# =============================================================================
def generate_inventory_bol_jpg():
    width, height = 1250, 850
    # Slightly warm paper color to simulate scanned photo
    img = Image.new("RGB", (width, height), color=(253, 252, 248))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["inventory"]

    # Header section
    draw.rectangle([50, 40, width - 50, 44], fill=colors["primary"])
    draw.text((50, 55), "STRAIGHT BILL OF LADING — SURPLUS INVENTORY DRAFT", fill=(15, 23, 42), font=FONTS["title"])
    draw.text((50, 90), "Original — Not Negotiable | Carrier Inbound Freight Document", fill=(100, 116, 139), font=FONTS["subtitle"])

    draw_badge(draw, width - 260, 55, "INVENTORY INGRESS", colors["tag_badge_bg"], colors["tag_badge_text"])

    # Two column metadata
    draw.rectangle([50, 125, width/2 - 20, 205], fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((65, 135), "SHIPPER (CONSIGNOR):", fill=colors["primary"], font=FONTS["bold"])
    draw.text((65, 155), "Fresh Harvest Growers & Packers", fill=(30, 41, 59), font=FONTS["body"])
    draw.text((65, 175), "108 Salinas Valley Rd, Salinas CA 93901", fill=(100, 116, 139), font=FONTS["small"])

    draw.rectangle([width/2 + 20, 125, width - 50, 205], fill=(255, 255, 255), outline=(226, 232, 240), width=1)
    draw.text((width/2 + 35, 135), "CONSIGNED TO (DESTINATION):", fill=colors["primary"], font=FONTS["bold"])
    draw.text((width/2 + 35, 155), "SpoilerAlert Regional Hub - Dallas Facility", fill=(30, 41, 59), font=FONTS["body"])
    draw.text((width/2 + 35, 175), "BOL Number: BOL-DAL-99210 | Date: 2026-10-01", fill=(100, 116, 139), font=FONTS["small"])

    # Table
    columns = ["SKU", "Description", "Lot Number", "Cases Available", "Unit Price", "Best Before Date"]
    widths = [160, 360, 160, 150, 140, 180]
    rows = [
        ["SKU-DRY-101", "Barilla Gluten-Free Penne 16oz", "BRL-LOT-441", "150", "$14.20", "2027-04-10"],
        ["SKU-BEV-204", "Harmless Harvest Coconut Water 16oz", "HHM-LOT-802", "80", "$26.50", "2026-11-12"],
        ["SKU-FRZ-305", "Amy's Organic Burrito Fiesta 12ct", "AMY-LOT-913", "210", "$21.80", "2026-12-18"],
        ["SKU-MEA-402", "Applegate Uncured Sunday Bacon 8oz", "APG-LOT-329", "115", "$36.00", "2026-11-05"],
        ["SKU-DAI-510", "Stonyfield Organic Whole Milk Yogurt", "STY-LOT-119", "190", "$17.40", "2026-10-27"],
        ["SKU-SNK-615", "Kettle Brand Sea Salt Potato Chips", "KET-LOT-602", "260", "$12.80", "2027-01-15"],
    ]

    draw_table(draw, 50, 230, columns, rows, widths, colors)

    # Footer Notes
    table_bottom = 230 + 32 + (len(rows) * 28)
    draw.text((50, table_bottom + 30), "Special Instructions: Maintain standard dry & refrigerated zones per item specification.", fill=(100, 116, 139), font=FONTS["small"])
    draw.text((50, table_bottom + 50), "Received in apparent good order except as noted. Subject to OCR schema auto-discovery.", fill=(148, 163, 184), font=FONTS["small"])

    # Stamp
    draw.rounded_rectangle([width - 320, table_bottom + 20, width - 50, table_bottom + 80], radius=6, outline=(220, 38, 38), width=2)
    draw.text((width - 300, table_bottom + 32), "SURPLUS CLEARANCE BOL", fill=(220, 38, 38), font=FONTS["bold"])
    draw.text((width - 300, table_bottom + 54), "STAGED FOR INVENTORY INGRESS", fill=(220, 38, 38), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "02_inventory_warehouse_bol_photo.jpg")
    img.save(out_path, "JPEG", quality=95)
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


# =============================================================================
# 3. SALES: Wholesale Sales Invoice Photo (JPG)
# =============================================================================
def generate_sales_invoice_photo_jpg():
    width, height = 1350, 920
    img = Image.new("RGB", (width, height), color=(254, 255, 254))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["sales"]

    # Header Bar
    draw.rectangle([0, 0, width, 14], fill=colors["primary"])

    # Title
    draw.text((60, 45), "SPOILER ALERT CLEARINGHOUSE", fill=colors["primary"], font=FONTS["title"])
    draw.text((60, 80), "Wholesale Surplus Liquidation & Sales Invoice", fill=(71, 85, 105), font=FONTS["subtitle"])

    draw_badge(draw, width - 260, 45, colors["tag"], colors["tag_badge_bg"], colors["tag_badge_text"])

    # Info Grid
    draw.rounded_rectangle([60, 120, width - 60, 195], radius=6, fill=colors["light"], outline=colors["border"], width=1)
    draw.text((80, 135), "Invoice Batch: INV-DISP-2026-10", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((80, 160), "Terms: Net 15 Surplus Settlement", fill=(71, 85, 105), font=FONTS["body"])

    draw.text((500, 135), "Clearing Date: 2026-10-02", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((500, 160), "Currency: USD ($)", fill=(71, 85, 105), font=FONTS["body"])

    draw.text((920, 135), "Pipeline Target: Sales Data", fill=colors["primary"], font=FONTS["bold"])
    draw.text((920, 160), "Ledger: ERP Surplus Account", fill=(71, 85, 105), font=FONTS["body"])

    # Table
    columns = ["Invoice Number", "Customer Name", "Sale Date", "Item Description", "Sold Cases", "Unit Price", "Total Amount", "Status"]
    widths = [150, 240, 110, 270, 110, 100, 130, 120]
    rows = [
        ["INV-2026-8801", "Whole Foods Market Regional", "2026-10-01", "Organic Romaine Hearts 24ct", "100", "$24.00", "$2,400.00", "delivered"],
        ["INV-2026-8802", "Kroger Mid-Atlantic Hub", "2026-10-02", "Chobani Greek Yogurt Plain 32oz", "180", "$15.50", "$2,790.00", "in_transit"],
        ["INV-2026-8803", "Target Grocery Logistics East", "2026-10-02", "Oatly Barista Edition Oat Milk", "250", "$27.00", "$6,750.00", "confirmed"],
        ["INV-2026-8804", "Trader Joe's Northeast Distribution", "2026-10-03", "Vital Farms Pasture Eggs 12ct", "120", "$16.50", "$1,980.00", "delivered"],
        ["INV-2026-8805", "Publix Super Markets South", "2026-10-03", "Beyond Meat Burger Patties", "80", "$38.00", "$3,040.00", "in_transit"],
        ["INV-2026-8806", "HEB Texas Central Supply", "2026-10-03", "Silk Almond Milk 64oz", "140", "$18.00", "$2,520.00", "confirmed"],
        ["INV-2026-8807", "Wegmans Food Markets North", "2026-10-04", "Horizon Organic Whole Milk", "110", "$21.50", "$2,365.00", "delivered"],
    ]

    draw_table(draw, 60, 225, columns, rows, widths, colors)

    # Footer
    table_bottom = 225 + 32 + (len(rows) * 28)
    draw.text((60, table_bottom + 30), "Sales Ingestion Total: 980 Cases Sold | $21,845.00 Gross Surplus Realization", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((60, table_bottom + 55), "Note: This document verifies Sales Data OCR dispatch, schema mapping, and ERP reconciliation ledger.", fill=(100, 116, 139), font=FONTS["small"])

    # Paid Stamp
    draw.rounded_rectangle([width - 300, table_bottom + 20, width - 60, table_bottom + 85], radius=6, outline=colors["accent"], width=2)
    draw.text((width - 280, table_bottom + 32), "PAID & CLEARED", fill=colors["primary"], font=FONTS["title"])
    draw.text((width - 280, table_bottom + 62), "ERP Reference: ERP-REC-994", fill=(100, 116, 139), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "03_sales_wholesale_invoice_photo.jpg")
    img.save(out_path, "JPEG", quality=95)
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


# =============================================================================
# 4. SALES: ERP Financial Reconciliation Statement (PNG)
# =============================================================================
def generate_sales_reconciliation_png():
    width, height = 1250, 800
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["sales"]

    # Top line
    draw.rectangle([0, 0, width, 10], fill=colors["primary"])

    draw.text((50, 35), "ENTERPRISE SALES RECONCILIATION SUMMARY", fill=colors["primary"], font=FONTS["title"])
    draw.text((50, 70), "Monthly Surplus Financial Clearing & Ledger Lineage", fill=(100, 116, 139), font=FONTS["subtitle"])

    draw_badge(draw, width - 260, 35, "SALES RECONCILIATION", colors["tag_badge_bg"], colors["tag_badge_text"])

    # Table
    columns = ["Invoice", "Buyer Company", "Date", "SKU", "Quantity", "Revenue", "Warehouse"]
    widths = [150, 280, 120, 160, 120, 140, 180]
    rows = [
        ["INV-ERP-401", "Sprouts Farmers Market West", "2026-09-28", "SKU-PRD-101", "75", "$1,875.00", "Dallas Hub"],
        ["INV-ERP-402", "HEB Texas Central Supply", "2026-09-29", "SKU-DRY-302", "140", "$3,220.00", "Dallas Hub"],
        ["INV-ERP-403", "Wegmans Food Markets North", "2026-09-30", "SKU-DAI-044", "200", "$4,100.00", "Newark Hub"],
        ["INV-ERP-404", "Sun Valley Co-op Markets", "2026-10-01", "SKU-BEV-109", "90", "$2,160.00", "Chicago DC-1"],
        ["INV-ERP-405", "Albertsons Pacific Northwest", "2026-10-01", "SKU-MEA-211", "160", "$5,440.00", "Seattle Hub"],
        ["INV-ERP-406", "Giant Eagle Tri-State", "2026-10-02", "SKU-FRZ-092", "125", "$3,125.00", "Newark Hub"],
    ]

    draw_table(draw, 50, 130, columns, rows, widths, colors)

    table_bottom = 130 + 32 + (len(rows) * 28)
    draw.text((50, table_bottom + 30), "Total Financial Recovery: $19,920.00 | Total Reconciled Cases: 790", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((50, table_bottom + 55), "Destination Pipeline: Sales Data (Quadrant 2 -> uploadSalesThunk -> GridMapperTable in mode='import')", fill=(100, 116, 139), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "04_sales_reconciliation_clearing.png")
    img.save(out_path, "PNG")
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


# =============================================================================
# 5. BUYERS: Buyer Network Onboarding & Directory Scan (PNG)
# =============================================================================
def generate_buyer_directory_png():
    width, height = 1380, 880
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["buyers"]

    # Header Bar
    draw.rectangle([0, 0, width, 12], fill=colors["primary"])

    draw.text((60, 40), "ECO-GROCER BUYER PARTNER NETWORK", fill=colors["primary"], font=FONTS["title"])
    draw.text((60, 75), "Regional Buyer Directory & Allergen Constraint Specification", fill=(100, 116, 139), font=FONTS["subtitle"])

    draw_badge(draw, width - 260, 40, colors["tag"], colors["tag_badge_bg"], colors["tag_badge_text"])

    # Info card
    draw.rounded_rectangle([60, 115, width - 60, 185], radius=6, fill=colors["light"], outline=colors["border"], width=1)
    draw.text((80, 128), "Registry Batch: BUYER-ONBOARD-Q4-2026", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((80, 152), "Ingress Category: Buyer Profiles & Routing Rules", fill=(71, 85, 105), font=FONTS["body"])

    draw.text((520, 128), "Effective Date: 2026-10-01", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((520, 152), "Verification Status: KYC & Allergen Certified", fill=(71, 85, 105), font=FONTS["body"])

    draw.text((950, 128), "Target Pipeline: Buyer Data", fill=colors["primary"], font=FONTS["bold"])
    draw.text((950, 152), "Dispatch Thunk: uploadBuyerThunk", fill=(71, 85, 105), font=FONTS["body"])

    # Table
    columns = ["Company Name", "Contact Email", "Buyer Tier", "Min Shelf Life", "Preferred Categories", "Transport Radius", "Excluded Allergens"]
    widths = [270, 240, 110, 120, 220, 140, 160]
    rows = [
        ["Whole Foods Market Regional", "orders+wfm@retailer.com", "tier1", "10 days", "Dairy, Produce, Meat", "150 mi", "Peanuts"],
        ["Kroger Mid-Atlantic Hub", "ops+kroger@supply.com", "tier1", "12 days", "Dairy, Produce, Frozen", "200 mi", "None"],
        ["Cascade Regional Grocers", "intake+cascade@grocers.org", "tier2", "7 days", "Produce, Dairy, Dry Goods", "150 mi", "Tree Nuts, Gluten"],
        ["Sun Valley Co-op Markets", "buy+sunvalley@coop.com", "tier2", "6 days", "Produce, Bakery", "100 mi", "Dairy"],
        ["City Harvest Food Rescue", "rescue+cityharvest@charity.org", "non_profit", "3 days", "Produce, Dairy, Bakery", "75 mi", "None"],
        ["Target Grocery Logistics East", "supply+target@retail.com", "tier1", "14 days", "Dairy, Dry Goods, Snacks", "250 mi", "Soy, Peanuts"],
        ["Prairie State Grocers", "intake+prairie@midwest.com", "tier2", "8 days", "Dairy, Dry Goods, Beverages", "180 mi", "None"],
    ]

    draw_table(draw, 60, 215, columns, rows, widths, colors)

    table_bottom = 215 + 32 + (len(rows) * 28)
    draw.text((60, table_bottom + 30), "Roster Summary: 7 Verified Buyer Accounts | Automatic Radius & Allergen Filtering Enabled", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((60, table_bottom + 55), "Lineage Note: Restaging from Scanned Documents Roster sets Buyer Data target and hydrates setBuyerParsedResult.", fill=(100, 116, 139), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "05_buyer_onboarding_registry_scan.png")
    img.save(out_path, "PNG")
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


# =============================================================================
# 6. BUYERS: Buyer Partner Intake Sheet (JPEG)
# =============================================================================
def generate_buyer_intake_jpeg():
    width, height = 1300, 820
    img = Image.new("RGB", (width, height), color=(253, 252, 255))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["buyers"]

    draw.rectangle([50, 35, width - 50, 40], fill=colors["primary"])
    draw.text((50, 50), "SURPLUS BUYER PARTNER REGISTRATION FORM", fill=(15, 23, 42), font=FONTS["title"])
    draw.text((50, 85), "Commercial Terms, Short-Dated Acceptance, and Facility Contact Records", fill=(100, 116, 139), font=FONTS["subtitle"])

    draw_badge(draw, width - 260, 50, "BUYER ONBOARDING", colors["tag_badge_bg"], colors["tag_badge_text"])

    # Table
    columns = ["Company Name", "Email Address", "Buyer Tier", "Short Dated Accepted", "Min Shelf Life Days", "Phone Number", "Location"]
    widths = [260, 250, 110, 160, 150, 130, 140]
    rows = [
        ["Target Grocery Logistics East", "supply+target@retail.com", "tier1", "Yes", "14", "555-0182", "Newark, NJ"],
        ["Trader Joe's Northeast Distribution", "orders+tj@traderjoes.com", "tier1", "Yes", "10", "555-0199", "Boston, MA"],
        ["Prairie State Grocers", "intake+prairie@midwest.com", "tier2", "No", "8", "555-0245", "Chicago, IL"],
        ["Ozark Mountain Markets", "contact+ozark@markets.com", "tier2", "Yes", "8", "555-0312", "St. Louis, MO"],
        ["Bluegrass Food Co-op", "ops+bluegrass@coop.org", "tier2", "No", "6", "555-0388", "Louisville, KY"],
        ["Feeding America Regional Partner", "intake+feeding@charity.org", "non_profit", "Yes", "2", "555-0450", "Dallas, TX"],
    ]

    draw_table(draw, 50, 140, columns, rows, widths, colors)

    table_bottom = 140 + 32 + (len(rows) * 28)
    draw.text((50, table_bottom + 30), "Data Target: Buyer Data | Supports seamless schema mapping to Buyer canonical model.", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((50, table_bottom + 55), "On Commit: In-Situ confirmation creates buyer roster records with notification tags.", fill=(100, 116, 139), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "06_buyer_partner_intake_sheet.jpeg")
    img.save(out_path, "JPEG", quality=95)
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


# =============================================================================
# 7. INVENTORY: Cold-Chain Delivery Slip (JPEG)
# =============================================================================
def generate_inventory_coldchain_jpeg():
    width, height = 1250, 800
    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["inventory"]

    draw.rectangle([0, 0, width, 10], fill=colors["primary"])

    draw.text((50, 35), "COLD-CHAIN TEMPERATURE COMPLIANCE PACKING SLIP", fill=colors["primary"], font=FONTS["title"])
    draw.text((50, 70), "Refrigerated & Frozen Surplus Ingress Inspection Record", fill=(100, 116, 139), font=FONTS["subtitle"])

    draw_badge(draw, width - 260, 35, colors["tag"], colors["tag_badge_bg"], colors["tag_badge_text"])

    columns = ["Item Description", "Lot Code", "Quantity Cases", "Price / Case", "Expiration Date", "Temp Min F", "Temp Max F"]
    widths = [320, 150, 140, 120, 150, 130, 140]
    rows = [
        ["Horizon Organic Whole Milk 1gal", "HRZ-LOT-11", "160", "$24.50", "2026-10-25", "34 F", "38 F"],
        ["Siggi's Icelandic Skyr Yogurt 5.3oz", "SIG-LOT-88", "300", "$19.00", "2026-11-04", "33 F", "36 F"],
        ["Applegate Natural Turkey Bacon 8oz", "APG-LOT-09", "110", "$38.00", "2026-11-18", "32 F", "38 F"],
        ["Organic Valley Salted Butter 1lb", "OV-LOT-44", "220", "$28.00", "2026-12-01", "30 F", "36 F"],
        ["Amy's Kitchen Frozen Enchilada Meals", "AMY-LOT-72", "140", "$34.00", "2027-01-15", "-10 F", "0 F"],
    ]

    draw_table(draw, 50, 130, columns, rows, widths, colors)

    table_bottom = 130 + 32 + (len(rows) * 28)
    draw.text((50, table_bottom + 30), "Inspection Result: All cold-chain temperature thresholds passed ingress audit.", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((50, table_bottom + 55), "Target: Inventory Data | Verifies OCR reading of thermal telemetry columns.", fill=(100, 116, 139), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "07_inventory_cold_chain_delivery_slip.jpeg")
    img.save(out_path, "JPEG", quality=95)
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


# =============================================================================
# 8. SALES: Mobile Photo Snapshot of Sales Receipt (JPG)
# =============================================================================
def generate_sales_receipt_jpg():
    width, height = 1200, 800
    # Simulate slightly off-white mobile snap background
    img = Image.new("RGB", (width, height), color=(252, 252, 250))
    draw = ImageDraw.Draw(img)
    colors = TARGET_COLORS["sales"]

    draw.rectangle([40, 30, width - 40, 34], fill=colors["primary"])
    draw.text((40, 45), "SURPLUS CASH & LIQUIDATION SALES RECEIPT", fill=(15, 23, 42), font=FONTS["title"])
    draw.text((40, 80), "On-Site Warehouse Closeout Counter Sale Record", fill=(100, 116, 139), font=FONTS["subtitle"])

    draw_badge(draw, width - 240, 45, "SALES RECEIPT", colors["tag_badge_bg"], colors["tag_badge_text"])

    columns = ["Invoice", "Buyer Name", "Date", "Description", "Quantity", "Unit Price", "Total Amount"]
    widths = [140, 230, 120, 280, 110, 110, 130]
    rows = [
        ["REC-9011", "Metro Discount Foods", "2026-10-02", "Barilla Pasta Penne 16oz", "80", "$12.50", "$1,000.00"],
        ["REC-9012", "Mid-City Pantry Co-op", "2026-10-02", "Chobani Greek Yogurt 32oz", "120", "$14.00", "$1,680.00"],
        ["REC-9013", "Apex Liquidators LLC", "2026-10-03", "Harmless Coconut Water 16oz", "65", "$22.00", "$1,430.00"],
        ["REC-9014", "Sun Valley Co-op Markets", "2026-10-03", "Kettle Brand Potato Chips", "150", "$10.00", "$1,500.00"],
    ]

    draw_table(draw, 40, 130, columns, rows, widths, colors)

    table_bottom = 130 + 32 + (len(rows) * 28)
    draw.text((40, table_bottom + 30), "Receipt Total: 415 Cases Cleared | $5,610.00 Immediate Liquidation Revenue", fill=(30, 41, 59), font=FONTS["bold"])
    draw.text((40, table_bottom + 55), "Target: Sales Data | Verifies OCR detection of cash-and-carry sales transactions.", fill=(100, 116, 139), font=FONTS["small"])

    out_path = os.path.join(OUTPUT_DIR, "08_sales_receipt_mobile_snap.jpg")
    img.save(out_path, "JPEG", quality=95)
    print(f"Generated: {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")


def main():
    print("=" * 70)
    print("Generating Multi-Pipeline Doc Scanner Test Image Files...")
    print(f"Target Directory: {OUTPUT_DIR}")
    print("=" * 70)

    generate_inventory_manifest_png()
    generate_inventory_bol_jpg()
    generate_sales_invoice_photo_jpg()
    generate_sales_reconciliation_png()
    generate_buyer_directory_png()
    generate_buyer_intake_jpeg()
    generate_inventory_coldchain_jpeg()
    generate_sales_receipt_jpg()

    print("=" * 70)
    print(f"Successfully generated all 8 test images in {OUTPUT_DIR}!")
    print("=" * 70)

if __name__ == "__main__":
    main()
