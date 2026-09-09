import io
import os
import time
import json
import base64
import logging
from typing import Optional
from PIL import Image
import requests
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ai_engine")

app = FastAPI(
    title="ScrapMax / Kabadiwala Connect - AI Vision & Valuation Engine",
    description="Real AI Multimodal Image Classification, Quality Inspection & Fraud Detection",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Canonical benchmark rates per KG (INR)
MARKET_RATES = {
    "pcb": 350.0,
    "batteries": 90.0,
    "cables": 180.0,
    "lcd": 45.0,
    "crt": 25.0,
    "motors": 65.0,
    "magnets": 30.0,
    "mixed_plastics": 18.0,
    "cardboard": 14.0,
    "iron": 28.0,
    "copper": 450.0,
    "aluminum": 120.0
}

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

def classify_and_grade_scrap_gemini(image_bytes: bytes, original_filename: str = "") -> dict:
    """
    Uses Google Gemini Multimodal Vision to inspect image pixels for:
    1. Material classification (e.g. pcb, cardboard, iron, cables)
    2. Moisture / Wetness (gilla cardboard / soaked paper)
    3. Rust & Corrosion (rusted metal junk)
    4. Contamination & Purity (dirt, oils, mixed impurities)
    5. Recyclability Grade (Grade A, B, C) and rate penalty deduction
    """
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        if pil_img.mode in ("RGBA", "P"):
            pil_img = pil_img.convert("RGB")

        max_dimension = 1024
        if max(pil_img.size) > max_dimension:
            pil_img.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

        buffer = io.BytesIO()
        pil_img.save(buffer, format="JPEG", quality=85)
        base64_data = base64.b64encode(buffer.getvalue()).decode("utf-8")

        prompt_text = (
            "You are an expert recyclable scrap and material valuation inspector in India. "
            "CRITICAL FIRST STEP: Determine whether the image actually contains recyclable scrap or discarded waste material. "
            "If the image is unrelated (e.g. human face, selfie, person, animal, food dish, furniture, nature, vehicle in use, clothing, meme, or screenshot): "
            "Set 'is_valid_scrap': false, 'rejection_reason': 'Ye photo recyclable kabaad/scrap ki nahi hai.', 'detected_material': 'non_scrap'. "
            "If it DOES contain recyclable scrap: "
            "Set 'is_valid_scrap': true, 'rejection_reason': null. "
            f"1. Material Category: exactly one of [{categories_str}]. "
            "2. Moisture / Water Soaking: 'dry' | 'damp' | 'soaked_wet' (Look for water stains, dark damp patches, or sogginess on cardboard/paper). "
            "3. Rust & Oxidation: 'none' | 'surface_rust' | 'heavy_corrosion' (For iron/steel junk). "
            "4. Contamination: 'clean' | 'dusty_debris' | 'oil_stained' | 'mixed_impurities'. "
            "5. Recyclability Grade: 'Grade A (Prime)' | 'Grade B (Standard)' | 'Grade C (Degraded / Junk)'. "
            "6. Deduction Percent: integer 0 to 50 (penalty for water weight inflation, rust loss, or heavy impurities). "
            "7. Quality Verdict: Concise Hindi/English explanation of physical condition and quality rating. "
            "Return ONLY a valid JSON object matching: "
            '{"is_valid_scrap": true, "rejection_reason": null, "detected_material": "string", "confidence_score": 92.5, '
            '"moisture_status": "dry", "rust_status": "none", '
            '"contamination": "clean", "recyclability_grade": "Grade A (Prime)", '
            '"deduction_percent": 0, "quality_verdict": "string", "reasoning": "string"}'
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{PRIMARY_MODEL}:generateContent?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt_text},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_data
                        }
                    }
                ]
            }],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        }

        # Multi-attempt request with retry on 503/429
        for attempt in range(2):
            try:
                response = requests.post(url, json=payload, timeout=20)
                if response.status_code == 200:
                    res_json = response.json()
                    raw_text = res_json["candidates"][0]["content"]["parts"][0]["text"].strip()
                    parsed = json.loads(raw_text)

                    is_valid = parsed.get("is_valid_scrap", True) and str(parsed.get("detected_material", "")).lower() != "non_scrap"
                    if not is_valid:
                        return {
                            "is_valid_scrap": False,
                            "rejection_reason": parsed.get("rejection_reason", "Ye photo kisi recyclable kabaad ya scrap material ki nahi lag rahi hai."),
                            "detected_material": "non_scrap",
                            "confidence_score": float(parsed.get("confidence_score", 90.0)),
                            "reasoning": str(parsed.get("reasoning", "Unrelated photo detected.")),
                            "engine": f"Gemini Multimodal Vision ({PRIMARY_MODEL})",
                            "is_real_ai": True
                        }

                    detected = str(parsed.get("detected_material", "")).lower().strip()
                    if detected not in MARKET_RATES and detected != "other":
                        matched = next((k for k in MARKET_RATES if k in detected), "other")
                        detected = matched

                    confidence = float(parsed.get("confidence_score", 92.5))
                    confidence = min(max(confidence, 60.0), 99.8)

                    moisture = str(parsed.get("moisture_status", "dry")).lower()
                    if moisture not in ("dry", "damp", "soaked_wet"):
                        moisture = "dry"

                    rust = str(parsed.get("rust_status", "none")).lower()
                    if rust not in ("none", "surface_rust", "heavy_corrosion"):
                        rust = "none"

                    contamination = str(parsed.get("contamination", "clean")).lower()
                    grade = str(parsed.get("recyclability_grade", "Grade A (Prime)"))
                    deduction = int(parsed.get("deduction_percent", 0))
                    deduction = min(max(deduction, 0), 50)

                    verdict = str(parsed.get("quality_verdict", parsed.get("reasoning", "Material inspected.")))

                    return {
                        "is_valid_scrap": True,
                        "detected_material": detected,
                        "confidence_score": round(confidence, 1),
                        "moisture_status": moisture,
                        "rust_status": rust,
                        "contamination": contamination,
                        "recyclability_grade": grade,
                        "deduction_percent": deduction,
                        "quality_verdict": verdict,
                        "reasoning": str(parsed.get("reasoning", verdict)),
                        "visual_quality": "good" if deduction == 0 else ("fair" if deduction <= 20 else "poor"),
                        "engine": f"Gemini Multimodal Vision ({PRIMARY_MODEL})",
                        "is_real_ai": True
                    }
                elif response.status_code in (503, 429) and attempt == 0:
                    logger.warning(f"Gemini API status {response.status_code}, retrying after 1.5s...")
                    time.sleep(1.5)
                else:
                    logger.warning(f"Gemini API returned status {response.status_code}")
            except requests.exceptions.RequestException as req_err:
                logger.warning(f"Request exception on attempt {attempt+1}: {req_err}")
                if attempt == 0:
                    time.sleep(1.0)

    except Exception as e:
        logger.error(f"Gemini Vision quality inspection failed: {e}")

    # Safe rejection fallback: if AI vision could not verify scrap, do not pretend it's cardboard
    return {
        "is_valid_scrap": False,
        "rejection_reason": "Photo mein koi recyclable scrap (kabaad) confirm nahi ho paya. Kripya kabaad ki saaf photo upload karein.",
        "detected_material": "non_scrap",
        "confidence_score": 0.0,
        "moisture_status": "dry",
        "rust_status": "none",
        "contamination": "clean",
        "recyclability_grade": "Not Applicable",
        "deduction_percent": 0,
        "quality_verdict": "Unverified / Non-scrap",
        "reasoning": "Image could not be verified as recyclable scrap by vision analysis.",
        "visual_quality": "poor",
        "engine": "ScrapMax Guardrail Engine",
        "is_real_ai": False
    }

@app.get("/")
def home():
    return {
        "status": "Online",
        "service": "ScrapMax & Kabadiwala Connect AI Engine",
        "version": "2.1.0",
        "primary_model": PRIMARY_MODEL,
        "features": [
            "Real Gemini Multimodal Vision Image Classification",
            "Moisture Detection (Wet / Gilla Cardboard Check)",
            "Rust & Corrosion Inspection (Metal Scrap Junk Check)",
            "Recyclability Grading (Grade A, B, C)",
            "Dynamic Quality-Adjusted Valuation",
            "Anti-Fraud Price & Water Weight Audit"
        ]
    }

@app.get("/rates")
def get_benchmark_rates():
    return {"rates_per_kg": MARKET_RATES}

@app.post("/classify-image")
async def classify_image_only(image: UploadFile = File(...)):
    contents = await image.read()
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
        img = Image.open(io.BytesIO(contents))
    except Exception as error:
        raise HTTPException(status_code=422, detail="Invalid readable image provided") from error
    
    width, height = img.size
    analysis = classify_and_grade_scrap_gemini(contents, image.filename or "")
    material = analysis["detected_material"]
    base_rate = MARKET_RATES.get(material, 20.0)

    # Calculate quality-adjusted rate
    deduction = analysis["deduction_percent"]
    effective_rate = round(base_rate * (1 - deduction / 100.0), 2)

    return {
        "detected_material": material,
        "confidence_score": f"{analysis['confidence_score']}%",
        "quality_inspection": {
            "moisture_status": analysis["moisture_status"],
            "rust_status": analysis["rust_status"],
            "contamination": analysis["contamination"],
            "recyclability_grade": analysis["recyclability_grade"],
            "deduction_percent": f"{deduction}%",
            "quality_verdict": analysis["quality_verdict"]
        },
        "valuation": {
            "base_market_rate_per_kg": base_rate,
            "quality_adjusted_rate_per_kg": effective_rate
        },
        "reasoning": analysis["reasoning"],
        "visual_quality": analysis["visual_quality"],
        "engine": analysis["engine"],
        "is_real_ai": analysis["is_real_ai"],
        "image_resolution": f"{width}x{height}",
        "status": "VALID"
    }

@app.post("/analyze-scrap")
async def analyze_scrap(
    image: UploadFile = File(...),
    weight_kg: float = Form(...),
    actual_price: float = Form(...),
    benchmark_rate_per_kg: Optional[float] = Form(None)
):
    if weight_kg <= 0:
        raise HTTPException(status_code=422, detail="weight_kg must be greater than 0")
    if actual_price < 0:
        raise HTTPException(status_code=422, detail="actual_price must not be negative")
    if benchmark_rate_per_kg is not None and benchmark_rate_per_kg < 0:
        raise HTTPException(status_code=422, detail="benchmark_rate_per_kg must not be negative")

    contents = await image.read()
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()
        img = Image.open(io.BytesIO(contents))
    except Exception as error:
        raise HTTPException(status_code=422, detail="image must be a valid readable image") from error
    width, height = img.size

    # REAL Material & Quality Classification via Gemini Multimodal Vision
    analysis = classify_and_grade_scrap_gemini(contents, image.filename or "")
    detected_material = analysis["detected_material"]
    confidence = analysis["confidence_score"]
    deduction = analysis["deduction_percent"]

    base_rate = benchmark_rate_per_kg or MARKET_RATES.get(detected_material, 20.0)
    adjusted_rate = round(base_rate * (1 - deduction / 100.0), 2)
    expected_price = round(adjusted_rate * weight_kg, 2)

    price_diff = abs(actual_price - expected_price)
    deviation = price_diff / expected_price if expected_price > 0 else 0

    is_abnormal = False
    audit_message = "Transaction Verified - Fair price matches quality-adjusted benchmark."

    # Fraud & Quality Warnings
    quality_warnings = []
    if analysis["moisture_status"] in ("damp", "soaked_wet"):
        quality_warnings.append(
            f"ALERT: Cardboard/Paper appears {analysis['moisture_status']}! Water soaking adds fake artificial weight. {deduction}% rate deduction applied."
        )
        is_abnormal = True

    if analysis["rust_status"] == "heavy_corrosion":
        quality_warnings.append(
            f"ALERT: Heavy rust and oxidation junk detected. Material downgraded to Grade C with {deduction}% penalty."
        )

    if deviation > 0.35:
        is_abnormal = True
        if actual_price < expected_price:
            audit_message = "ALERT: Underpayment! Collector/Seller is being paid less than fair adjusted rate."
        else:
            audit_message = "ALERT: Overbilling! Unusual high price entered for this scrap material condition."
    elif quality_warnings:
        audit_message = " ".join(quality_warnings)

    return {
        "classification": {
            "detected_material": detected_material,
            "confidence_score": f"{confidence}%",
            "quality_inspection": {
                "moisture_status": analysis["moisture_status"],
                "rust_status": analysis["rust_status"],
                "contamination": analysis["contamination"],
                "recyclability_grade": analysis["recyclability_grade"],
                "deduction_percent": f"{deduction}%",
                "quality_verdict": analysis["quality_verdict"]
            },
            "reasoning": analysis["reasoning"],
            "visual_quality": analysis["visual_quality"],
            "engine": analysis["engine"],
            "is_real_ai": analysis["is_real_ai"],
            "image_resolution": f"{width}x{height}",
            "status": "VALID"
        },
        "valuation": {
            "base_market_rate_per_kg": base_rate,
            "quality_deduction_percent": f"{deduction}%",
            "adjusted_rate_per_kg": adjusted_rate,
            "weight_kg": weight_kg,
            "expected_fair_price": expected_price,
            "actual_transaction_price": actual_price
        },
        "fraud_audit": {
            "is_flagged": is_abnormal,
            "deviation_percentage": f"{round(deviation * 100, 2)}%",
            "system_verdict": audit_message,
            "quality_warnings": quality_warnings
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
