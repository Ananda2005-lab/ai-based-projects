import base64
import json
import os
import re
import sqlite3
import urllib.error
import urllib.request
from datetime import datetime, date
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from PIL import Image, ImageEnhance, ImageFilter
from werkzeug.utils import secure_filename


BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DB_PATH = BASE_DIR / "medicine_scanner.db"
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava:7b")

LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "or": "Odia",
    "bn": "Bengali",
}

LANGUAGE_UI = {
    "en": {
        "fallback_note": "Generated from safe built-in medical fallback because local AI is not available.",
        "unclear_note": "Image text is unclear. Please verify the label manually.",
        "disclaimer": "Informational only. Confirm with a qualified doctor or pharmacist before using any medicine.",
        "unknown_expiry": "Expiry date was not detected clearly.",
        "safe": "Safe",
        "expired": "Expired",
        "near_expiry": "Near Expiry",
        "unknown": "Unknown",
        "quality_good": "OCR found enough text for a useful informational report.",
        "quality_low": "Some label text was read, but identification confidence is limited. Please verify before using the medicine.",
        "quality_very_low": "Image/text is not clear enough for reliable identification. Report is still generated, but retake is strongly recommended.",
    },
    "hi": {
        "fallback_note": "Local AI उपलब्ध नहीं है, इसलिए सुरक्षित built-in medical fallback से जानकारी बनाई गई है।",
        "unclear_note": "Image text साफ नहीं है। Medicine use करने से पहले label manually verify करें।",
        "disclaimer": "यह केवल जानकारी के लिए है। कोई भी medicine use करने से पहले doctor या pharmacist से confirm करें।",
        "unknown_expiry": "Expiry date साफ detect नहीं हुई।",
        "safe": "Safe",
        "expired": "Expired",
        "near_expiry": "Near Expiry",
        "unknown": "Unknown",
        "quality_good": "OCR ने useful report के लिए पर्याप्त text पढ़ा है।",
        "quality_low": "कुछ label text पढ़ा गया है, लेकिन confidence limited है। Medicine use करने से पहले verify करें।",
        "quality_very_low": "Image/text reliable identification के लिए साफ नहीं है। Report बनी है, लेकिन photo दुबारा लेना बेहतर है।",
    },
    "or": {
        "fallback_note": "Local AI ଉପଲବ୍ଧ ନାହିଁ, ସେଥିପାଇଁ ସୁରକ୍ଷିତ built-in medical fallback ରୁ ଏହି ସୂଚନା ତିଆରି ହୋଇଛି।",
        "unclear_note": "ଛବିର text ସ୍ପଷ୍ଟ ନୁହେଁ। Medicine ବ୍ୟବହାର ପୂର୍ବରୁ label କୁ manually verify କରନ୍ତୁ।",
        "disclaimer": "ଏହା କେବଳ ସୂଚନା ପାଇଁ। Medicine ବ୍ୟବହାର ପୂର୍ବରୁ doctor କିମ୍ବା pharmacist ସହିତ confirm କରନ୍ତୁ।",
        "unknown_expiry": "Expiry date ସ୍ପଷ୍ଟ ଭାବରେ detect ହୋଇନାହିଁ।",
        "safe": "Safe",
        "expired": "Expired",
        "near_expiry": "Near Expiry",
        "unknown": "Unknown",
        "quality_good": "OCR useful report ପାଇଁ ପର୍ଯ୍ୟାପ୍ତ text ପଢିଛି।",
        "quality_low": "କିଛି label text ପଢାଯାଇଛି, କିନ୍ତୁ confidence limited ଅଛି। Medicine ବ୍ୟବହାର ପୂର୍ବରୁ verify କରନ୍ତୁ।",
        "quality_very_low": "Image/text reliable identification ପାଇଁ ସ୍ପଷ୍ଟ ନୁହେଁ। Report ତିଆରି ହୋଇଛି, କିନ୍ତୁ photo ପୁନଃ ନେବା ଭଲ।",
    },
    "bn": {
        "fallback_note": "Local AI পাওয়া যাচ্ছে না, তাই নিরাপদ built-in medical fallback থেকে এই তথ্য তৈরি করা হয়েছে।",
        "unclear_note": "ছবির text পরিষ্কার নয়। Medicine ব্যবহার করার আগে label manually verify করুন।",
        "disclaimer": "এটি শুধু তথ্যের জন্য। Medicine ব্যবহার করার আগে doctor বা pharmacist-এর সাথে confirm করুন।",
        "unknown_expiry": "Expiry date পরিষ্কারভাবে detect হয়নি।",
        "safe": "Safe",
        "expired": "Expired",
        "near_expiry": "Near Expiry",
        "unknown": "Unknown",
        "quality_good": "OCR useful report-এর জন্য যথেষ্ট text পড়েছে।",
        "quality_low": "কিছু label text পড়া গেছে, কিন্তু confidence limited। Medicine ব্যবহার করার আগে verify করুন।",
        "quality_very_low": "Image/text reliable identification-এর জন্য পরিষ্কার নয়। Report তৈরি হয়েছে, কিন্তু photo আবার নেওয়া ভালো।",
    },
}

LOCAL_MEDICINE_TRANSLATIONS = {
    "albendazole": {
        "hi": {
            "uses": "Albendazole एक antiparasitic medicine है, जो कुछ worm infections में इस्तेमाल होती है। इसे label या doctor/pharmacist की सलाह के अनुसार ही लें।",
            "dosage": "Dose age, weight और infection type पर depend करता है। बिना medical advice के dose repeat न करें।",
            "sideEffects": ["पेट दर्द", "मतली", "सिर दर्द", "चक्कर"],
            "warnings": ["Pregnancy में बिना prescription use न करें", "बच्चों, liver disease या repeated dosing के लिए doctor से पूछें"],
            "storage": "ठंडी, सूखी जगह पर और बच्चों से दूर रखें।",
            "alternatives": ["Generic Albendazole", "दूसरी antiparasitic medicine केवल medical advice पर"],
        },
        "or": {
            "uses": "Albendazole ଏକ antiparasitic medicine, ଯାହା କିଛି worm infection ପାଇଁ ବ୍ୟବହୃତ ହୁଏ। Label କିମ୍ବା doctor/pharmacist ଙ୍କ advice ଅନୁସାରେ ମାତ୍ର ନିଅନ୍ତୁ।",
            "dosage": "Dose age, weight ଏବଂ infection type ଉପରେ depend କରେ। Medical advice ବିନା dose repeat କରନ୍ତୁ ନାହିଁ।",
            "sideEffects": ["ପେଟ ଯନ୍ତ୍ରଣା", "ବାନ୍ତି ଲାଗିବା", "ମୁଣ୍ଡ ବେଦନା", "ଚକ୍କର"],
            "warnings": ["Pregnancy ସମୟରେ prescription ବିନା use କରନ୍ତୁ ନାହିଁ", "ଶିଶୁ, liver disease କିମ୍ବା repeated dosing ପାଇଁ doctor ଙ୍କୁ ପଚାରନ୍ତୁ"],
            "storage": "ଠଣ୍ଡା, ସୁକା ସ୍ଥାନରେ ଏବଂ ଶିଶୁମାନଙ୍କୁ ଦୂରେ ରଖନ୍ତୁ।",
            "alternatives": ["Generic Albendazole", "ଅନ୍ୟ antiparasitic medicine କେବଳ medical advice ରେ"],
        },
        "bn": {
            "uses": "Albendazole একটি antiparasitic medicine, যা কিছু worm infection-এ ব্যবহার হয়। Label বা doctor/pharmacist-এর advice অনুযায়ী নিন।",
            "dosage": "Dose age, weight এবং infection type-এর উপর depend করে। Medical advice ছাড়া dose repeat করবেন না।",
            "sideEffects": ["পেট ব্যথা", "বমিভাব", "মাথা ব্যথা", "মাথা ঘোরা"],
            "warnings": ["Pregnancy-তে prescription ছাড়া use করবেন না", "শিশু, liver disease বা repeated dosing-এর জন্য doctor-কে জিজ্ঞেস করুন"],
            "storage": "ঠান্ডা, শুকনো জায়গায় এবং শিশুদের থেকে দূরে রাখুন।",
            "alternatives": ["Generic Albendazole", "অন্য antiparasitic medicine শুধু medical advice অনুযায়ী"],
        },
    }
}

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024
app.config["UPLOAD_FOLDER"] = UPLOAD_DIR
UPLOAD_DIR.mkdir(exist_ok=True)


FALLBACK_MEDICINE_HINTS = {
    "paracetamol": {
        "brand": "Paracetamol",
        "generic": "Acetaminophen / Paracetamol",
        "composition": "Paracetamol 500 mg",
        "uses": "Helps reduce fever and mild to moderate pain such as headache, body ache, toothache, and cold-related fever.",
        "dosage": "Adults commonly use 500 mg when needed, but dose and frequency must follow the label or a clinician's advice.",
        "side_effects": ["Nausea", "Allergic rash", "Liver injury if taken in high doses"],
        "warnings": ["Avoid overdose", "Be careful with liver disease", "Do not combine with other paracetamol products"],
        "storage": "Store below 30 C in a dry place, away from children.",
        "alternatives": ["Generic paracetamol", "Acetaminophen brands"],
        "interactions": ["Alcohol", "Warfarin"],
    },
    "amoxicillin": {
        "brand": "Amoxicillin",
        "generic": "Amoxicillin",
        "composition": "Amoxicillin 500 mg",
        "uses": "An antibiotic used for some bacterial infections. It does not work for viral infections like common cold.",
        "dosage": "Use only when prescribed. Complete the full course unless your doctor tells you otherwise.",
        "side_effects": ["Diarrhea", "Nausea", "Skin rash", "Yeast infection"],
        "warnings": ["Avoid if allergic to penicillin", "Seek urgent help for swelling or breathing trouble"],
        "storage": "Store as directed on the label. Some liquid forms need refrigeration.",
        "alternatives": ["Generic amoxicillin", "Doctor-prescribed antibiotic alternatives"],
        "interactions": ["Methotrexate", "Warfarin"],
    },
    "ibuprofen": {
        "brand": "Ibuprofen",
        "generic": "Ibuprofen",
        "composition": "Ibuprofen 200 mg / 400 mg",
        "uses": "Reduces pain, swelling, and fever. Often used for muscle pain, period pain, dental pain, and inflammation.",
        "dosage": "Take with food or milk to reduce stomach irritation. Follow the label or clinician's advice.",
        "side_effects": ["Acidity", "Stomach pain", "Dizziness", "Raised blood pressure"],
        "warnings": ["Avoid in stomach ulcer", "Use caution in kidney disease", "Avoid late pregnancy unless prescribed"],
        "storage": "Store at room temperature in a dry place.",
        "alternatives": ["Generic ibuprofen", "Other NSAIDs only if advised"],
        "interactions": ["Aspirin", "Warfarin", "Steroids"],
    },
    "cetirizine": {
        "brand": "Cetirizine",
        "generic": "Cetirizine",
        "composition": "Cetirizine 10 mg",
        "uses": "An antihistamine used for allergy symptoms like sneezing, runny nose, itching, and hives.",
        "dosage": "Often taken once daily, but follow the label. It may cause sleepiness in some people.",
        "side_effects": ["Sleepiness", "Dry mouth", "Fatigue"],
        "warnings": ["Avoid driving if drowsy", "Use caution with alcohol"],
        "storage": "Store in a cool, dry place.",
        "alternatives": ["Generic cetirizine", "Loratadine", "Fexofenadine"],
        "interactions": ["Alcohol", "Sedatives"],
    },
    "albendazole": {
        "brand": "Albendazole",
        "generic": "Albendazole",
        "composition": "Albendazole IP",
        "uses": "An antiparasitic medicine used for some worm infections. It should be used according to the label or a clinician's advice.",
        "dosage": "Dose depends on age, weight, infection type, and local medical guidance. Do not repeat doses without advice.",
        "side_effects": ["Stomach pain", "Nausea", "Headache", "Dizziness"],
        "warnings": ["Avoid during pregnancy unless prescribed", "Ask a doctor for children, liver disease, or repeated dosing"],
        "storage": "Store in a cool, dry place away from children.",
        "alternatives": ["Generic albendazole", "Other antiparasitic medicines only if advised"],
        "interactions": ["Praziquantel", "Cimetidine", "Dexamethasone"],
    },
}

INTERACTION_RULES = [
    {
        "medicines": {"ibuprofen", "warfarin"},
        "severity": "High",
        "message": "Ibuprofen with warfarin may increase bleeding risk. Ask a doctor or pharmacist before combining.",
    },
    {
        "medicines": {"paracetamol", "alcohol"},
        "severity": "High",
        "message": "Paracetamol with heavy alcohol use can increase liver injury risk.",
    },
    {
        "medicines": {"cetirizine", "alcohol"},
        "severity": "Medium",
        "message": "Cetirizine with alcohol can increase drowsiness and slow reaction time.",
    },
    {
        "medicines": {"amoxicillin", "warfarin"},
        "severity": "Medium",
        "message": "Amoxicillin may affect blood thinner control in some people. Monitoring may be needed.",
    },
]


def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    with get_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS scans (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                raw_text TEXT,
                result_json TEXT NOT NULL,
                favorite INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                medicine_name TEXT NOT NULL,
                dosage TEXT,
                reminder_time TEXT NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL
            );
            """
        )


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def preprocess_image(path):
    """Improve OCR chances with a light grayscale/contrast pass."""
    image = Image.open(path).convert("L")
    image = image.filter(ImageFilter.SHARPEN)
    image = ImageEnhance.Contrast(image).enhance(1.6)
    processed_path = Path(path).with_name(f"{Path(path).stem}_ocr.png")
    image.save(processed_path)
    return processed_path


def extract_text_with_ocr(path):
    processed_path = preprocess_image(path)
    errors = []

    try:
        import easyocr

        reader = easyocr.Reader(["en"], gpu=False)
        result = reader.readtext(str(processed_path), detail=0)
        text = "\n".join(result).strip()
        if text:
            return text, "EasyOCR"
    except Exception as exc:
        errors.append(f"EasyOCR unavailable: {exc}")

    try:
        import pytesseract

        text = pytesseract.image_to_string(Image.open(processed_path)).strip()
        if text:
            return text, "Tesseract"
    except Exception as exc:
        errors.append(f"Tesseract unavailable: {exc}")

    fallback = "OCR could not confidently read the image. " + " ".join(errors)
    return fallback, "OCR low-confidence fallback"


def normalize_text(text):
    return re.sub(r"\s+", " ", text or "").strip()


def detect_medicine(text):
    lower_text = text.lower()
    for key, data in FALLBACK_MEDICINE_HINTS.items():
        if key in lower_text or data["generic"].lower() in lower_text:
            return key, data

    guessed_name = guess_medicine_name(text)
    return "unknown", {
        "brand": guessed_name,
        "generic": "Not confidently detected",
        "composition": extract_field(text, ["composition", "contains", "each tablet contains"]) or "Not clearly visible",
        "uses": "This medicine could not be confidently identified. Please verify the label with a pharmacist or doctor.",
        "dosage": "Use only according to the package label or medical advice.",
        "side_effects": ["Side effects depend on the exact medicine", "Ask a pharmacist if unsure"],
        "warnings": ["Identification confidence is low", "Do not use if label is unclear or package is damaged"],
        "storage": "Store according to the package instructions.",
        "alternatives": ["Ask a pharmacist for generic alternatives"],
        "interactions": [],
    }


def guess_medicine_name(text):
    cleaned_lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    skip_words = {
        "batch", "mfg", "mfd", "exp", "expiry", "composition", "contains", "tablet",
        "capsule", "syrup", "label", "medicine", "warning", "storage", "schedule",
    }
    best = ""
    for line in cleaned_lines:
        tokens = re.findall(r"[A-Za-z][A-Za-z0-9-]{2,}", line)
        useful = [token for token in tokens if token.lower() not in skip_words]
        if useful and len(" ".join(useful)) > len(best):
            best = " ".join(useful[:3])
    if best:
        return best.title()
    words = re.findall(r"[A-Za-z][A-Za-z0-9-]{2,}", text or "")
    return words[0].title() if words else "Unknown Medicine"


def extract_field(text, labels):
    for label in labels:
        pattern = rf"{label}\s*[:\-]?\s*([^\n\r]+)"
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return None


def extract_batch(text):
    match = re.search(r"\b(?:batch|bt\.?|b\.no|lot)\s*[:\-]?\s*([A-Z0-9-]+)", text, re.IGNORECASE)
    if not match:
        return "Not detected"
    value = match.group(1).strip()
    if value.lower() in {"no", "number", "not"} or len(value) < 3:
        return "Not detected"
    return value


def parse_month_year(value):
    value = value.strip().replace(".", "/").replace("-", "/")
    formats = ["%m/%Y", "%m/%y", "%Y/%m", "%d/%m/%Y", "%d/%m/%y"]
    for fmt in formats:
        try:
            parsed = datetime.strptime(value, fmt).date()
            if fmt in {"%m/%Y", "%m/%y", "%Y/%m"}:
                return date(parsed.year, parsed.month, 28)
            return parsed
        except ValueError:
            continue
    return None


def extract_date_by_labels(text, labels):
    label_pattern = "|".join(labels)
    pattern = rf"(?:{label_pattern})\s*[:\-]?\s*((?:\d{{1,2}}[\/\-.]\d{{2,4}})|(?:\d{{4}}[\/\-.]\d{{1,2}}))"
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return "Not detected", None
    raw = match.group(1)
    return raw, parse_month_year(raw)


def expiry_status(expiry_date, language="en"):
    if not expiry_date:
        return {"label": ui_text(language, "unknown"), "tone": "neutral", "message": ui_text(language, "unknown_expiry")}

    today = date.today()
    days_left = (expiry_date - today).days
    if days_left < 0:
        if language == "or":
            message = f"{abs(days_left)} ଦିନ ପୂର୍ବରୁ expired ହୋଇଛି। ଏହା use କରନ୍ତୁ ନାହିଁ।"
        elif language == "hi":
            message = f"{abs(days_left)} दिन पहले expired हो चुकी है। इसे use न करें।"
        elif language == "bn":
            message = f"{abs(days_left)} দিন আগে expired হয়েছে। এটি use করবেন না।"
        else:
            message = f"Expired {abs(days_left)} days ago. Do not use it."
        return {"label": ui_text(language, "expired"), "tone": "danger", "message": message}
    if days_left <= 90:
        if language == "or":
            message = f"{days_left} ଦିନ ମଧ୍ୟରେ expire ହେବ। Label intact ଥିଲେ ଏବଂ advice ଅନୁସାରେ ମାତ୍ର use କରନ୍ତୁ।"
        elif language == "hi":
            message = f"{days_left} दिन में expire होगी। Label ठीक हो और advice हो तभी use करें।"
        elif language == "bn":
            message = f"{days_left} দিনের মধ্যে expire হবে। Label ঠিক থাকলে এবং advice থাকলে use করুন।"
        else:
            message = f"Expires in {days_left} days. Use only if advised and label is intact."
        return {"label": ui_text(language, "near_expiry"), "tone": "warning", "message": message}
    if language == "or":
        message = f"Expiry ପ୍ରାୟ {days_left} ଦିନ ପର୍ଯ୍ୟନ୍ତ valid ଦେଖାଯାଉଛି।"
    elif language == "hi":
        message = f"Expiry लगभग {days_left} दिन तक valid दिख रही है।"
    elif language == "bn":
        message = f"Expiry প্রায় {days_left} দিন পর্যন্ত valid দেখাচ্ছে।"
    else:
        message = f"Expiry looks valid for about {days_left} more days."
    return {"label": ui_text(language, "safe"), "tone": "success", "message": message}


def parse_ai_json(text):
    if not text:
        return None
    match = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def image_to_base64(path):
    try:
        with open(path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")
    except OSError:
        return ""


def language_name(code):
    return LANGUAGES.get(code, "English")


def ui_text(language, key):
    return LANGUAGE_UI.get(language, LANGUAGE_UI["en"]).get(key, LANGUAGE_UI["en"][key])


def medicine_translation_key(library_data):
    text = f"{library_data.get('brand', '')} {library_data.get('generic', '')} {library_data.get('composition', '')}".lower()
    for key in LOCAL_MEDICINE_TRANSLATIONS:
        if key in text:
            return key
    return ""


def localized_fallback_data(library_data, language):
    med_key = medicine_translation_key(library_data)
    translated = LOCAL_MEDICINE_TRANSLATIONS.get(med_key, {}).get(language)
    if not translated:
        return {
            "uses": library_data["uses"],
            "dosage": library_data["dosage"],
            "sideEffects": library_data["side_effects"],
            "warnings": library_data["warnings"],
            "storage": library_data["storage"],
            "alternatives": library_data["alternatives"],
        }
    return translated


def ask_ollama(prompt, model=None, images=None, timeout=12, num_predict=650):
    payload = json.dumps({
        "model": model or OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "images": images or [],
        "options": {
            "temperature": 0.2,
            "num_predict": num_predict,
        },
    }).encode("utf-8")
    request_obj = urllib.request.Request(
        OLLAMA_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request_obj, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
            return data.get("response", "").strip()
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError):
        return ""


def ai_medicine_report(raw_text, parsed_medicine, expiry, image_paths=None, language="en"):
    target_language = language_name(language)
    prompt = f"""
You are a careful medicine label explainer. Use only the OCR text and cautious general medical knowledge.
Never invent a certain prescription. If text is unclear, say confidence is low but still provide a useful report.
Write every patient-facing value in {target_language}. Keep medicine names and chemical names unchanged.
Return JSON only with this exact shape:
{{
  "brand": "best visible brand or Unknown Medicine",
  "generic": "generic name/composition if inferable",
  "composition": "composition if visible or likely from label",
  "uses": "simple patient-friendly explanation",
  "dosage": "general usage guidance, not a prescription",
  "sideEffects": ["common side effect 1", "common side effect 2"],
  "warnings": ["safety warning 1", "safety warning 2"],
  "storage": "storage advice",
  "alternatives": ["generic or class alternative, if safe to mention"],
  "confidenceNote": "how confident the report is"
}}

OCR text:
{raw_text}

Initial parser guess:
Brand: {parsed_medicine["brand"]}
Generic: {parsed_medicine["generic"]}
Composition: {parsed_medicine["composition"]}
Expiry status: {expiry["label"]} - {expiry["message"]}
"""
    image_payload = [image_to_base64(path) for path in (image_paths or [])[:4]]
    image_payload = [item for item in image_payload if item]
    ai_text = ""
    used_model = OLLAMA_MODEL
    if image_payload:
        vision_prompt = "Read this medicine package photo and combine it with the OCR text below. " + prompt
        ai_text = ask_ollama(vision_prompt, model=OLLAMA_VISION_MODEL, images=image_payload, timeout=18, num_predict=850)
        if ai_text:
            used_model = OLLAMA_VISION_MODEL
    if not ai_text:
        ai_text = ask_ollama(prompt, model=OLLAMA_MODEL, timeout=12, num_predict=750)
        used_model = OLLAMA_MODEL
    ai_json = parse_ai_json(ai_text)
    if not ai_json:
        return None

    def ensure_list(value, fallback):
        if isinstance(value, list) and value:
            return [str(item) for item in value]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return fallback

    return {
        "brand": str(ai_json.get("brand") or parsed_medicine["brand"]),
        "generic": str(ai_json.get("generic") or parsed_medicine["generic"]),
        "composition": str(ai_json.get("composition") or parsed_medicine["composition"]),
        "uses": str(ai_json.get("uses") or "AI could not confidently explain this medicine from the label."),
        "dosage": str(ai_json.get("dosage") or "Follow the label or a clinician's advice."),
        "sideEffects": ensure_list(ai_json.get("sideEffects"), ["Side effects depend on the exact medicine."]),
        "warnings": ensure_list(ai_json.get("warnings"), ["Confirm unclear labels with a pharmacist before use."]),
        "storage": str(ai_json.get("storage") or "Store according to the package label."),
        "alternatives": ensure_list(ai_json.get("alternatives"), ["Ask a pharmacist for a safe generic alternative."]),
        "confidenceNote": str(ai_json.get("confidenceNote") or "AI generated this from OCR text."),
        "source": f"Ollama {used_model}",
    }


def fallback_report(library_data, raw_text, quality_label, language="en"):
    localized = localized_fallback_data(library_data, language)
    note = ui_text(language, "fallback_note")
    if quality_label != "Good":
        note += " " + ui_text(language, "unclear_note")
    return {
        "brand": library_data["brand"],
        "generic": library_data["generic"],
        "composition": library_data["composition"],
        "uses": localized["uses"],
        "dosage": localized["dosage"],
        "sideEffects": localized["sideEffects"],
        "warnings": localized["warnings"],
        "storage": localized["storage"],
        "alternatives": localized["alternatives"],
        "confidenceNote": note,
        "source": "Parser fallback",
    }


def image_quality(raw_text, medicine_key, language="en"):
    text_length = len(normalize_text(raw_text))
    if text_length < 25:
        return {
            "label": "Very Low",
            "message": ui_text(language, "quality_very_low"),
        }
    if medicine_key == "unknown" or text_length < 70:
        return {
            "label": "Low",
            "message": ui_text(language, "quality_low"),
        }
    return {
        "label": "Good",
        "message": ui_text(language, "quality_good"),
    }


def build_scan_result(file_name, file_path, raw_text, ocr_engine, image_paths=None, language="en"):
    medicine_key, library_data = detect_medicine(raw_text)
    composition = extract_field(raw_text, ["composition", "contains", "each tablet contains"]) or library_data["composition"]
    expiry_raw, expiry_date = extract_date_by_labels(raw_text, ["exp", "expiry", "expires", "use before"])
    mfg_raw, _ = extract_date_by_labels(raw_text, ["mfg", "mfd", "manufacturing", "manufactured"])

    status = expiry_status(expiry_date, language)
    quality = image_quality(raw_text, medicine_key, language)
    confidence = 88 if medicine_key != "unknown" and quality["label"] == "Good" else 55 if quality["label"] == "Low" else 25
    parsed_medicine = {
        "key": medicine_key,
        "brand": library_data["brand"],
        "generic": library_data["generic"],
        "composition": composition,
        "batch": extract_batch(raw_text),
        "manufacturingDate": mfg_raw,
        "expiryDate": expiry_raw,
    }
    ai_report = ai_medicine_report(raw_text, parsed_medicine, status, image_paths or [file_path], language)
    report = ai_report or fallback_report({**library_data, "composition": composition}, raw_text, quality["label"], language)
    parsed_medicine["brand"] = report["brand"]
    parsed_medicine["generic"] = report["generic"]
    parsed_medicine["composition"] = report["composition"]

    return {
        "fileName": file_name,
        "filePath": str(file_path),
        "ocrEngine": ocr_engine,
        "aiEngine": report["source"],
        "rawText": raw_text,
        "confidence": confidence,
        "quality": quality,
        "language": language,
        "medicine": parsed_medicine,
        "expiry": status,
        "explanation": {
            "simpleSummary": f"{report['brand']}: {report['uses']}",
            "uses": report["uses"],
            "dosage": report["dosage"],
            "sideEffects": report["sideEffects"],
            "warnings": report["warnings"],
            "storage": report["storage"],
            "alternatives": report["alternatives"],
            "confidenceNote": report["confidenceNote"],
            "disclaimer": ui_text(language, "disclaimer"),
        },
    }


def row_to_scan(row):
    result = json.loads(row["result_json"])
    result["id"] = row["id"]
    result["favorite"] = bool(row["favorite"])
    result["createdAt"] = row["created_at"]
    return result


def save_scan(file_name, file_path, raw_text, result):
    with get_db() as db:
        cursor = db.execute(
            """
            INSERT INTO scans (file_name, file_path, raw_text, result_json, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (file_name, str(file_path), raw_text, json.dumps(result), datetime.utcnow().isoformat()),
        )
        return cursor.lastrowid


def json_error(message, status=400, code="error"):
    return jsonify({"ok": False, "code": code, "message": message}), status


@app.errorhandler(413)
def file_too_large(_error):
    return json_error("File is too large. Please upload an image under 20 MB.", 413, "file_too_large")


@app.route("/")
def index():
    return render_template("index.html")


@app.post("/api/upload")
def upload_image():
    language = request.form.get("language", "en")
    files = request.files.getlist("images") or request.files.getlist("image")
    files = [file for file in files if file and file.filename]
    if not files:
        return json_error("No image file was uploaded.", 400, "missing_file")
    if len(files) > 6:
        return json_error("Upload up to 6 medicine photos at once.", 400, "too_many_files")

    saved_paths = []
    saved_names = []
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")

    for index, file in enumerate(files, start=1):
        if not allowed_file(file.filename):
            return json_error("Unsupported file type. Use jpg, jpeg, or png.", 400, "invalid_file_type")
        safe_name = secure_filename(file.filename)
        saved_name = f"{timestamp}_{index}_{safe_name}"
        file_path = UPLOAD_DIR / saved_name
        file.save(file_path)
        saved_paths.append(file_path)
        saved_names.append(saved_name)

    try:
        ocr_chunks = []
        engines = []
        for index, path in enumerate(saved_paths, start=1):
            text, engine = extract_text_with_ocr(path)
            engines.append(engine)
            ocr_chunks.append(f"Photo {index} ({path.name}) OCR via {engine}:\n{text}")
        raw_text = "\n\n---\n\n".join(ocr_chunks)
        ocr_engine = " + ".join(sorted(set(engines)))
        result = build_scan_result(", ".join(saved_names), str(saved_paths[0]), raw_text, ocr_engine, saved_paths, language)
        scan_id = save_scan(", ".join(saved_names), " | ".join(str(path) for path in saved_paths), raw_text, result)
        result["id"] = scan_id
        result["favorite"] = False
        result["createdAt"] = datetime.utcnow().isoformat()
        return jsonify({"ok": True, "scan": result})
    except Exception as exc:
        return json_error(f"Scan failed: {exc}", 500, "scan_failed")


@app.post("/api/scan")
def scan_existing():
    payload = request.get_json(silent=True) or {}
    file_path = payload.get("filePath")
    language = payload.get("language", "en")
    if not file_path:
        return json_error("filePath is required.", 400, "missing_file_path")
    path = Path(file_path)
    if not path.exists() or UPLOAD_DIR not in path.resolve().parents:
        return json_error("Uploaded file was not found.", 404, "file_not_found")
    raw_text, ocr_engine = extract_text_with_ocr(path)
    result = build_scan_result(path.name, path, raw_text, ocr_engine, language=language)
    scan_id = save_scan(path.name, path, raw_text, result)
    result["id"] = scan_id
    return jsonify({"ok": True, "scan": result})


@app.get("/api/details/<int:scan_id>")
def get_details(scan_id):
    with get_db() as db:
        row = db.execute("SELECT * FROM scans WHERE id = ?", (scan_id,)).fetchone()
    if not row:
        return json_error("Scan not found.", 404, "not_found")
    return jsonify({"ok": True, "scan": row_to_scan(row)})


@app.post("/api/check-expiry")
def check_expiry():
    payload = request.get_json(silent=True) or {}
    raw = payload.get("expiryDate", "")
    language = payload.get("language", "en")
    parsed = parse_month_year(raw) if raw else None
    return jsonify({"ok": True, "expiry": expiry_status(parsed, language), "input": raw})


@app.post("/api/check-interactions")
def check_interactions():
    payload = request.get_json(silent=True) or {}
    medicines = {item.lower().strip() for item in payload.get("medicines", []) if item.strip()}
    warnings = []

    ai_prompt = f"""
You are a careful drug interaction explainer. Check these medicines for possible interactions:
{", ".join(sorted(medicines))}

Return JSON only:
{{
  "warnings": [
    {{"severity": "Low/Medium/High", "message": "simple warning"}}
  ]
}}
If uncertain, say uncertainty clearly. Do not prescribe.
"""
    ai_json = parse_ai_json(ask_ollama(ai_prompt))
    if ai_json and isinstance(ai_json.get("warnings"), list):
        for item in ai_json["warnings"]:
            if isinstance(item, dict) and item.get("message"):
                warnings.append({
                    "severity": str(item.get("severity", "Medium")),
                    "message": str(item["message"]),
                })
        if warnings:
            return jsonify({"ok": True, "warnings": warnings, "engine": f"Ollama {OLLAMA_MODEL}"})

    for rule in INTERACTION_RULES:
        if rule["medicines"].issubset(medicines):
            warnings.append({"severity": rule["severity"], "message": rule["message"]})

    if not warnings:
        warnings.append({
            "severity": "Low",
            "message": "No major interaction found in the built-in demo rules. Always confirm combinations with a pharmacist.",
        })

    return jsonify({"ok": True, "warnings": warnings, "engine": "Parser fallback"})


@app.post("/api/translate-report")
def translate_report():
    payload = request.get_json(silent=True) or {}
    scan = payload.get("scan") or {}
    language = payload.get("language", "en")
    if language == "en":
        scan["language"] = "en"
        return jsonify({"ok": True, "scan": scan, "engine": "Original English"})

    target_language = language_name(language)
    prompt = f"""
Translate and rewrite this medicine report in {target_language}. Keep medicine names, chemical names, dates, and numbers unchanged.
Return JSON only with this shape:
{{
  "uses": "translated usage",
  "dosage": "translated general dosage guidance",
  "sideEffects": ["translated side effect"],
  "warnings": ["translated warning"],
  "storage": "translated storage",
  "alternatives": ["translated alternative"],
  "simpleSummary": "translated simple summary"
}}

Medicine: {scan.get("medicine", {})}
Explanation: {scan.get("explanation", {})}
Expiry: {scan.get("expiry", {})}
"""
    translated = parse_ai_json(ask_ollama(prompt, timeout=10, num_predict=650))
    if not translated:
        medicine = scan.get("medicine", {})
        library_data = {
            "brand": medicine.get("brand", "Unknown Medicine"),
            "generic": medicine.get("generic", "Not confidently detected"),
            "composition": medicine.get("composition", "Not clearly visible"),
            "uses": scan.get("explanation", {}).get("uses", ""),
            "dosage": scan.get("explanation", {}).get("dosage", ""),
            "side_effects": scan.get("explanation", {}).get("sideEffects", []),
            "warnings": scan.get("explanation", {}).get("warnings", []),
            "storage": scan.get("explanation", {}).get("storage", ""),
            "alternatives": scan.get("explanation", {}).get("alternatives", []),
        }
        local_data = localized_fallback_data(library_data, language)
        if medicine_translation_key(library_data):
            explanation = scan.get("explanation", {})
            explanation["uses"] = local_data["uses"]
            explanation["dosage"] = local_data["dosage"]
            explanation["sideEffects"] = local_data["sideEffects"]
            explanation["warnings"] = local_data["warnings"]
            explanation["storage"] = local_data["storage"]
            explanation["alternatives"] = local_data["alternatives"]
            explanation["simpleSummary"] = f"{medicine.get('brand', 'Medicine')}: {local_data['uses']}"
            explanation["confidenceNote"] = ui_text(language, "fallback_note")
            explanation["disclaimer"] = ui_text(language, "disclaimer")
            scan["explanation"] = explanation
            scan["language"] = language
            scan["aiEngine"] = "Local language fallback"
            return jsonify({"ok": True, "scan": scan, "engine": "Local language fallback"})
        return json_error(f"Ollama is needed to translate this unknown medicine report into {target_language}.", 503, "translation_unavailable")

    explanation = scan.get("explanation", {})
    for key in ["uses", "dosage", "storage", "simpleSummary"]:
        if translated.get(key):
            explanation[key] = translated[key]
    for key in ["sideEffects", "warnings", "alternatives"]:
        if isinstance(translated.get(key), list) and translated[key]:
            explanation[key] = translated[key]
    scan["explanation"] = explanation
    scan["language"] = language
    scan["aiEngine"] = f"Ollama {OLLAMA_MODEL}"
    return jsonify({"ok": True, "scan": scan, "engine": f"Ollama {OLLAMA_MODEL}"})


@app.get("/api/history")
def history():
    with get_db() as db:
        rows = db.execute("SELECT * FROM scans ORDER BY id DESC LIMIT 30").fetchall()
    return jsonify({"ok": True, "scans": [row_to_scan(row) for row in rows]})


@app.get("/api/favorites")
def favorites():
    with get_db() as db:
        rows = db.execute("SELECT * FROM scans WHERE favorite = 1 ORDER BY id DESC").fetchall()
    return jsonify({"ok": True, "favorites": [row_to_scan(row) for row in rows]})


@app.post("/api/favorites")
def toggle_favorite():
    payload = request.get_json(silent=True) or {}
    scan_id = payload.get("scanId")
    favorite = 1 if payload.get("favorite", True) else 0
    if not scan_id:
        return json_error("scanId is required.", 400, "missing_scan_id")
    with get_db() as db:
        db.execute("UPDATE scans SET favorite = ? WHERE id = ?", (favorite, scan_id))
    return jsonify({"ok": True, "scanId": scan_id, "favorite": bool(favorite)})


@app.get("/api/reminders")
def list_reminders():
    with get_db() as db:
        rows = db.execute("SELECT * FROM reminders ORDER BY reminder_time ASC").fetchall()
    return jsonify({"ok": True, "reminders": [dict(row) for row in rows]})


@app.post("/api/reminders")
def create_reminder():
    payload = request.get_json(silent=True) or {}
    medicine_name = payload.get("medicineName", "").strip()
    reminder_time = payload.get("reminderTime", "").strip()
    if not medicine_name or not reminder_time:
        return json_error("Medicine name and reminder time are required.", 400, "missing_reminder_fields")
    with get_db() as db:
        cursor = db.execute(
            """
            INSERT INTO reminders (medicine_name, dosage, reminder_time, notes, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                medicine_name,
                payload.get("dosage", ""),
                reminder_time,
                payload.get("notes", ""),
                datetime.utcnow().isoformat(),
            ),
        )
    return jsonify({"ok": True, "id": cursor.lastrowid})


@app.delete("/api/reminders/<int:reminder_id>")
def delete_reminder(reminder_id):
    with get_db() as db:
        db.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
    return jsonify({"ok": True})


def scan_expiry_answer(language):
    if language == "or":
        return "Expiry confirm କରିବା ପାଇଁ package ର EXP/Expiry date ଥିବା close-up photo upload କରନ୍ତୁ। Expiry unclear ଥିଲେ medicine use କରନ୍ତୁ ନାହିଁ।"
    if language == "hi":
        return "Expiry confirm करने के लिए package पर EXP/Expiry date वाला close-up photo upload करें। Expiry unclear हो तो medicine use न करें।"
    if language == "bn":
        return "Expiry confirm করতে package-এর EXP/Expiry date close-up photo upload করুন। Expiry unclear হলে medicine use করবেন না।"
    return "Upload a close-up photo of the EXP/Expiry date to confirm expiry. Do not use medicine when expiry is unclear."


@app.post("/api/chatbot")
def chatbot():
    payload = request.get_json(silent=True) or {}
    question = payload.get("question", "").strip()
    medicine_name = payload.get("medicineName", "").strip().lower()
    composition = payload.get("composition", "").strip()
    summary = payload.get("summary", "").strip()
    language = payload.get("language", "en")
    target_language = language_name(language)
    if not question:
        return json_error("Please ask a question.", 400, "missing_question")

    ai_prompt = f"""
You are a medicine safety assistant. Answer simply and cautiously.
Do not prescribe. Tell the user to confirm with a doctor/pharmacist for personal dosing.
Medicine context: {medicine_name or "unknown"}
Composition context: {composition or "unknown"}
Existing scan summary: {summary or "unknown"}
Question: {question}
Answer in {target_language}. Keep medicine names and chemical names unchanged.
"""
    ai_answer = ask_ollama(ai_prompt, timeout=3, num_predict=320)
    if ai_answer:
        return jsonify({
            "ok": True,
            "answer": ai_answer + " " + ui_text(language, "disclaimer"),
            "engine": f"Ollama {OLLAMA_MODEL}",
        })

    context_text = f"{medicine_name} {composition} {question}".lower()
    key = next((name for name in FALLBACK_MEDICINE_HINTS if name in context_text), "unknown")
    info = FALLBACK_MEDICINE_HINTS.get(key)
    lower_question = question.lower()

    if info:
        local = localized_fallback_data(info, language)
        if "after food" in lower_question or "food" in lower_question or "ଖାଇବା" in question or "খাবার" in question:
            answer = f"{info['brand']}: {local['dosage']}"
        elif "child" in lower_question or "children" in lower_question or "ଶିଶୁ" in question or "बच्च" in question or "শিশু" in question:
            if language == "or":
                answer = f"ଶିଶୁମାନଙ୍କ ପାଇଁ dose age ଏବଂ weight ଉପରେ depend କରେ। {info['brand']} ପାଇଁ dose guess କରନ୍ତୁ ନାହିଁ; pediatrician କିମ୍ବା pharmacist ଙ୍କୁ ପଚାରନ୍ତୁ।"
            elif language == "hi":
                answer = f"बच्चों के लिए dose age और weight पर depend करता है। {info['brand']} का dose guess न करें; pediatrician या pharmacist से पूछें।"
            elif language == "bn":
                answer = f"শিশুদের dose age এবং weight-এর উপর depend করে। {info['brand']} dose guess করবেন না; pediatrician বা pharmacist-কে জিজ্ঞেস করুন।"
            else:
                answer = f"Children need age and weight-based dosing. Do not guess the dose for {info['brand']}; ask a pediatrician or pharmacist."
        elif "side effect" in lower_question or "reaction" in lower_question or "ପାର୍ଶ୍ୱ" in question or "दुष्प्रभाव" in question:
            answer = f"{info['brand']} common side effects: {', '.join(local['sideEffects'])}."
        elif "expiry" in lower_question or "expire" in lower_question:
            answer = scan_expiry_answer(language)
        else:
            answer = f"{info['brand']}: {local['uses']} {local['warnings'][0]}"
    else:
        if medicine_name or composition:
            if language == "or":
                answer = f"ମୁଁ scan context ଦେଖୁଛି: brand '{medicine_name or 'unknown'}', composition '{composition or 'unknown'}'। Use, timing, side effects, expiry କିମ୍ବା safety ବିଷୟରେ ପଚାରନ୍ତୁ।"
            elif language == "hi":
                answer = f"Scan context दिख रहा है: brand '{medicine_name or 'unknown'}', composition '{composition or 'unknown'}'। Use, timing, side effects, expiry या safety के बारे में पूछें।"
            elif language == "bn":
                answer = f"Scan context দেখা যাচ্ছে: brand '{medicine_name or 'unknown'}', composition '{composition or 'unknown'}'। Use, timing, side effects, expiry বা safety নিয়ে জিজ্ঞেস করুন।"
            else:
                answer = (
                    f"I can see this scan context: medicine/brand '{medicine_name or 'unknown'}' "
                    f"and composition '{composition or 'unknown'}'. Ask about use, dose timing, side effects, expiry, or safety."
                )
        else:
            if language == "or":
                answer = "Exact medicine identify ହୋଇନାହିଁ। Clear label scan କରନ୍ତୁ କିମ୍ବା pharmacist ଙ୍କୁ ପଚାରନ୍ତୁ।"
            elif language == "hi":
                answer = "Exact medicine identify नहीं हुई। Clear label scan करें या pharmacist से पूछें।"
            elif language == "bn":
                answer = "Exact medicine identify হয়নি। Clear label scan করুন বা pharmacist-কে জিজ্ঞেস করুন।"
            else:
                answer = "I could not identify the exact medicine from your question. Please scan a clear label or ask a pharmacist before taking it."

    return jsonify({
        "ok": True,
        "answer": answer + " " + ui_text(language, "disclaimer"),
        "engine": "Parser fallback",
    })


init_db()


if __name__ == "__main__":
    app.run(debug=True)
