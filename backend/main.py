from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from collections import defaultdict, deque
import re
import random
import logging
import json
import os
import datetime
import unicodedata
from fastapi import HTTPException # Added for login and other admin endpoints
from passlib.context import CryptContext # Added for password hashing

# ── Database Imports ───────────────────────────────────────────────────────
from sqlalchemy.orm import Session
from fastapi import Depends
import models
from database import SessionLocal, engine, get_db

# Create all database tables based on models.py
models.Base.metadata.create_all(bind=engine)

# ── Scikit-learn for Intent Classification ─────────────────────────────────
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# ── NLTK sentiment (VADER) ─────────────────────────────────────────────────
import nltk
try:
    nltk.data.find("sentiment/vader_lexicon.zip")
except LookupError:
    nltk.download("vader_lexicon", quiet=True)
from nltk.sentiment.vader import SentimentIntensityAnalyzer

# ── RapidFuzz for typo correction ──────────────────────────────────────────
from rapidfuzz import process as fuzz_process

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Password Hashing Context - using native bcrypt directly for version compatibility
import bcrypt as _bcrypt

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return _bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

app = FastAPI(title="MindGuard Hybrid Chatbot V10")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# DATA MODELS
# =============================================================================
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[str]] = []
    session_id: Optional[str] = "default"
    turn: int = 0
    mood: Optional[str] = "Okay"

class ChatResponse(BaseModel):
    response: str
    sentiment: Optional[str] = "neutral"
    action: Optional[str] = None
    reasoning: Optional[Dict] = None

# ---- Profile & Auth Schemas ----
class UpdateProfileRequest(BaseModel):
    fullname: str
    email: str
    trusted_contacts: Optional[List[str]] = []

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class CreateAdminRequest(BaseModel):
    fullname: str
    email: str
    role: str
    password: str

class CreateStudentRequest(BaseModel):
    fullname: str
    email: str
    student_id: str
    program: str
    password: str

class UpdateStudentRequest(BaseModel):
    fullname: str
    email: str
    program: str

class UpdateAdminRequest(BaseModel):
    fullname: str
    email: str
    role: str

class LoginRequest(BaseModel): # Added LoginRequest
    email: str
    password: str

    reasoning: Optional[Dict] = None

# =============================================================================
# STEP 1 — TEXT NORMALIZER
# =============================================================================
def normalize_text(text: str) -> str:
    """Lowercase, strip punctuation for matching only (NOT for display)."""
    text = unicodedata.normalize("NFKC", text)
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    return re.sub(r"\s+", " ", text)

# =============================================================================
# STEP 2 — FUZZY TYPO CORRECTOR
# Catches common misspellings before crisis detection
# =============================================================================
KNOWN_CRISIS_TERMS = [
    "suicide", "kill myself", "magpapakamatay", "overdose",
    "laslas", "end my life", "hurt myself", "wala na akong rason",
    "gusto ko mamatay", "ayoko na mabuhay", "tired of being alive",
    "everyone would be better without me", "i dont want to exist",
]

def fuzzy_preprocess(text: str) -> str:
    """
    For each word/phrase in KNOWN_CRISIS_TERMS, check if the input is
    close enough (score >= 82). If yes, append the corrected term so
    the downstream regex can catch it.
    """
    normalized = normalize_text(text)
    corrections = []
    for term in KNOWN_CRISIS_TERMS:
        result = fuzz_process.extractOne(
            normalized, [term], score_cutoff=82
        )
        if result:
            corrections.append(result[0])
    if corrections:
        return normalized + " " + " ".join(corrections)
    return normalized

# =============================================================================
# STEP 3 — LAYER 1: HARDENED CRISIS DETECTION (HIGHEST PRIORITY)
# =============================================================================
# Direct suicidal intent
DIRECT_SUICIDE = [
    r"\bmagpapakamatay\b", r"\bkill\s+myself\b", r"\bend\s+my\s+life\b",
    r"\bwant\s+to\s+die\b", r"\bgusto\s+ko\s+mamatay\b",
    r"\bayoko\s+na\s+mabuhay\b", r"\bsuicide\b", r"\bpag-alay\s+ng\s+buhay\b",
]
# Self-harm methods/tools
METHOD_REQUEST = [
    r"\boverdose\b", r"\blaslas\b", r"\bhurt\s+myself\b",
    r"\bsaktan\s+sarili\b", r"\bpaano\s+mamatay\b",
    r"\bhow\s+to\s+kill\b", r"\bpills\b.*\bdie\b",
]
# High-risk hopelessness
HOPELESSNESS = [
    r"\bwala\s+na\s+akong\s+rason\b", r"\bno\s+reason\s+to\s+live\b",
    r"\bwala\s+na\b.*\bpag\-asa\b", r"\bno\s+hope\b",
    r"\bmawala\s+na\s+lang\b", r"\bpagod\s+na\s+ako\s+mabuhay\b",
]
# Indirect but high-risk phrases
INDIRECT_HIGH_RISK = [
    r"\beveryone\s+would\s+be\s+better\s+without\s+me\b",
    r"\bi\s+don.?t\s+want\s+to\s+exist\b",
    r"\btired\s+of\s+being\s+alive\b",
    r"\bi\s+can.?t\s+do\s+this\s+anymore\b",
    r"\blahat\s+mas\s+magiging\s+okay\s+kung\s+wala\s+ako\b",
    r"\bit.?s\s+peaceful\s+when\s+everything\s+stops\b",
    r"\bi\s+just\s+want\s+it\s+to\s+stop\b",
]
# Explicit timeline / plan signals → immediate escalation
PLAN_SIGNALS = [
    r"\btonight\b.*\b(die|kill|end)\b",
    r"\btomorrow\b.*\b(last|final|goodbye)\b",
    r"\bna\s+may\s+plano\s+na\s+ako\b",
    r"\bi\s+have\s+a\s+plan\b",
    r"\bna\s+nag\s*-\s*attempt\b",
    r"\btried\s+before\b",
]
# Anti-dependence triggers
DEPENDENCE_PHRASES = [
    r"\byou.?re\s+the\s+only\s+one\s+i\s+have\b",
    r"\bdon.?t\s+leave\s+me\b",
    r"\bi\s+only\s+trust\s+you\b",
    r"\bwala\s+na\s+akong\s+ibang\s+tatanungin\b",
]
# Sarcasm/context reducers — lower false positives
FALSE_POSITIVE_CONTEXT = [
    r"\bexam\b.*\bdie\b", r"\bdie\s+laughing\b",
    r"\bi\s+want\s+to\s+die\s+from\s+(laughter|laughing|embarrassment)\b",
    r"\bkill\s+it\b",  # "kill it on stage"
]

ALL_CRISIS_PATTERNS = DIRECT_SUICIDE + METHOD_REQUEST + HOPELESSNESS + INDIRECT_HIGH_RISK

def crisis_detection(text: str) -> Optional[dict]:
    """
    HARD OVERRIDE. Returns crisis dict immediately if ANY pattern matches.
    Returns None if no crisis detected.
    """
    preprocessed = fuzzy_preprocess(text)

    # Check false positive context first (reduce noise)
    for pat in FALSE_POSITIVE_CONTEXT:
        if re.search(pat, preprocessed, re.IGNORECASE):
            return None  # Context says it's NOT a real crisis

    has_plan = any(re.search(p, preprocessed, re.IGNORECASE) for p in PLAN_SIGNALS)
    for pat in ALL_CRISIS_PATTERNS:
        if re.search(pat, preprocessed, re.IGNORECASE):
            level = "CRISIS_PLAN" if has_plan else "CRISIS"
            return {"level": level, "override": True, "pattern": pat}

    return None

# =============================================================================
# STEP 4 — LAYER 2: EMOTIONAL INTENSITY SCORING
# =============================================================================
sia = SentimentIntensityAnalyzer()

NEGATIVE_INTENSITY_WORDS = [
    "pagod", "sawa", "galit", "iyak", "luha", "desperado",
    "exhausted", "drained", "hopeless", "helpless", "overwhelmed",
    "panic", "anxious", "ngipin", "scared", "terrified",
]

def emotional_intensity(text: str) -> str:
    """Returns 'low', 'moderate', or 'high'."""
    normalized = normalize_text(text)
    # VADER compound score
    scores = sia.polarity_scores(text)
    compound = scores["compound"]

    # Negative keyword density
    words = normalized.split()
    neg_hits = sum(1 for w in words if w in NEGATIVE_INTENSITY_WORDS)
    neg_density = neg_hits / max(len(words), 1)

    # CAPS ratio (raw text) — screaming / distress indicator
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)

    score = 0
    if compound <= -0.6: score += 2
    elif compound <= -0.3: score += 1
    if neg_density >= 0.15: score += 2
    elif neg_density >= 0.07: score += 1
    if caps_ratio >= 0.3: score += 1

    if score >= 4: return "high"
    if score >= 2: return "moderate"
    return "low"

# =============================================================================
# STEP 5 — LAYER 3: SESSION ESCALATION MONITOR
# =============================================================================
# In-memory session store (per session_id)
_sessions: Dict[str, dict] = defaultdict(lambda: {
    "theme_counts": defaultdict(int),
    "distress_history": deque(maxlen=10),
    "used_responses": set(),
    "turn": 0,
})

def monitor_escalation(session_id: str, intent: str, intensity: str) -> dict:
    """Track themes and distress history. Returns escalation flags."""
    session = _sessions[session_id]
    session["theme_counts"][intent] += 1
    session["distress_history"].append(intensity)
    session["turn"] += 1

    theme_repeat = session["theme_counts"][intent] >= 3
    # Detect worsening trend in last 3 turns
    recent = list(session["distress_history"])[-3:]
    intensity_map = {"low": 0, "moderate": 1, "high": 2}
    worsening = (
        len(recent) == 3
        and intensity_map.get(recent[2], 0) > intensity_map.get(recent[0], 0)
    )

    return {
        "theme_repeat": theme_repeat,
        "worsening": worsening,
        "escalate": theme_repeat or worsening,
        "turn": session["turn"],
    }

def get_used_responses(session_id: str) -> set:
    return _sessions[session_id]["used_responses"]

def mark_response_used(session_id: str, response_key: str):
    _sessions[session_id]["used_responses"].add(response_key)

# =============================================================================
# STEP 6 — LAYER 4: ML INTENT CLASSIFIER (Scikit-Learn)
# TF-IDF + Logistic Regression trained on seed data
# =============================================================================
TRAINING_DATA = [
    # academic_stress
    ("I failed my exam and I don't know what to do", "academic_stress"),
    ("My thesis is killing me, I can't finish it", "academic_stress"),
    ("Bagsak na naman ako sa subject ko", "academic_stress"),
    ("The deadline is tomorrow and I haven't started", "academic_stress"),
    ("I'm so stressed about my grades", "academic_stress"),
    ("Hindi ko ma-gets yung lesson, nahuhuli na ako", "academic_stress"),
    ("My professor is so unfair with grades", "academic_stress"),
    ("I have three exams this week and I'm not ready", "academic_stress"),
    ("Thesis defense ko bukas, wala pa akong laman", "academic_stress"),
    ("I think I'm going to fail this semester", "academic_stress"),

    # relationship_issues
    ("My boyfriend and I broke up and I'm devastated", "relationship_issues"),
    ("Naghiwalay kami ng jowa ko", "relationship_issues"),
    ("I feel like my partner doesn't listen to me", "relationship_issues"),
    ("I'm having trust issues with my boyfriend", "relationship_issues"),
    ("My ex keeps contacting me and I don't know what to do", "relationship_issues"),
    ("Parang hindi na ko mahal ng jowa ko", "relationship_issues"),
    ("I'm scared my partner will leave me", "relationship_issues"),
    ("We keep fighting and I'm exhausted", "relationship_issues"),

    # family_conflict
    ("My parents fight all the time and I'm scared", "family_conflict"),
    ("Nagagalit lagi ang nanay ko sa akin", "family_conflict"),
    ("I feel like my family doesn't understand me", "family_conflict"),
    ("My dad is very strict and I can't breathe", "family_conflict"),
    ("I feel alone even when I'm at home", "family_conflict"),
    ("Palagi kaming nag-aaway ng tatay ko", "family_conflict"),
    ("My parents are separating and I don't know how to cope", "family_conflict"),

    # financial_stress
    ("I can't pay my tuition this semester", "financial_stress"),
    ("Wala na kaming pera, baka mag-stop out na ako", "financial_stress"),
    ("I'm worried about money and I can't focus", "financial_stress"),
    ("My scholarship got canceled and I don't know what to do", "financial_stress"),
    ("I have to work part time just to pay for college", "financial_stress"),

    # loneliness
    ("I feel like I have no real friends", "loneliness"),
    ("Nobody talks to me in class", "loneliness"),
    ("Parang wala akong kaibigan dito sa school", "loneliness"),
    ("I eat alone every day and it hurts", "loneliness"),
    ("I feel invisible to everyone around me", "loneliness"),
    ("I moved to a new city and I don't know anyone", "loneliness"),

    # burnout
    ("I'm so tired of everything, I can't keep going", "burnout"),
    ("I've been grinding for months and I feel empty", "burnout"),
    ("Pagod na pagod na ako, wala na akong energy", "burnout"),
    ("I don't feel motivated to do anything anymore", "burnout"),
    ("I used to love studying but now I hate it", "burnout"),
    ("I feel like I'm running on empty", "burnout"),

    # general_anxiety
    ("I have panic attacks before class", "general_anxiety"),
    ("I'm always worried even when nothing is wrong", "general_anxiety"),
    ("Palagi akong nag-aalala tungkol sa lahat", "general_anxiety"),
    ("My heart races when I have to present in class", "general_anxiety"),
    ("I can't sleep because I overthink everything", "general_anxiety"),

    # general_chat
    ("Hello how are you", "general_chat"),
    ("I just wanted to talk to someone", "general_chat"),
    ("Kumusta ka", "general_chat"),
    ("What can you do", "general_chat"),
    ("I'm okay I just wanted to check in", "general_chat"),
    ("Can we just talk", "general_chat"),
]

X_train = [t[0] for t in TRAINING_DATA]
y_train = [t[1] for t in TRAINING_DATA]

intent_clf = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
    ("clf", LogisticRegression(max_iter=1000, C=1.5)),
])
intent_clf.fit(X_train, y_train)

def classify_intent(text: str) -> tuple:
    """Returns (intent: str, confidence: float)."""
    probs = intent_clf.predict_proba([text])[0]
    classes = intent_clf.classes_
    idx = probs.argmax()
    return classes[idx], round(float(probs[idx]), 3)

# =============================================================================
# STEP 7 — SEMI-SUPERVISED LOGGING (Backend only, never shown to user)
# =============================================================================
LOG_FILE = os.path.join(os.path.dirname(__file__), "low_confidence_log.jsonl")

def log_low_confidence(text: str, intent: str, confidence: float, intensity: str):
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "text_hash": hash(text),  # Anonymized
        "predicted_intent": intent,
        "confidence": confidence,
        "intensity": intensity,
    }
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        logger.warning(f"Could not write log: {e}")

# =============================================================================
# STEP 8 — LANGUAGE DETECTOR
# =============================================================================
class LanguageDetector:
    def __init__(self):
        self.tl_func = {
            "ang", "ng", "sa", "mga", "ay", "na", "ba", "po", "ko",
            "mo", "niya", "kami", "tayo", "sila", "natin", "nila", "ito",
            "hindi", "wala", "kaya", "pero", "kasi", "talaga",
        }
        self.en_func = {
            "the", "a", "an", "is", "are", "was", "were", "to",
            "in", "for", "on", "with", "as", "by", "at", "i", "me",
        }

    def detect(self, text: str) -> str:
        words = set(re.findall(r"\b\w+\b", text.lower()))
        if not words: return "tl"
        tl = len(words & self.tl_func)
        en = len(words & self.en_func)
        total = tl + en
        if total == 0: return "tl"
        ratio = tl / total
        if ratio > 0.65: return "tl"
        if ratio < 0.35: return "en"
        return "taglish"

lang_det = LanguageDetector()

# =============================================================================
# STEP 9 — RESPONSE TEMPLATE ENGINE
# Intent-specific + intensity-adaptive templates
# =============================================================================
TEMPLATES = {
    "academic_stress": {
        "en": [
            "It sounds like the pressure from your coursework is really building up. That's genuinely exhausting. Breaking tasks into smaller steps can help make things feel more manageable. What part feels most overwhelming right now?",
            "I hear you — academic pressure can feel crushing, especially when deadlines pile up. You don't have to figure it all out at once. Would you like to talk through what's on your plate?",
        ],
        "tl": [
            "Ramdam ko kung gaano kahirap ang pinagdadaanan mo sa pag-aaral. Hindi ka nag-iisa dito. Pwede mong subukan hatiin sa maliliit na hakbang ang iyong gawain. Anong bahagi ang pinakanahihirapan ka?",
            "Ang bigat ng pakiramdam na yun, lalo na kapag maraming deadline. Valid ang nararamdaman mo. Gusto mo bang pag-usapan kung paano mo haharapin ito?",
        ],
    },
    "relationship_issues": {
        "en": [
            "Relationship pain is real and it can feel very isolating. I'm here to listen. What's been happening that's been hardest for you?",
            "It sounds like things have been really difficult with someone you care about. That kind of hurt takes time. Would you like to share more about what you're going through?",
        ],
        "tl": [
            "Ang sakit ng pakiramdam na yun pagdating sa taong mahal mo. Nandito lang ako para makinig. Gusto mo bang ikuwento pa ang nangyayari?",
            "Naiintindihan ko na mahirap ang sitwasyon mo ngayon. Valid ang lahat ng nararamdaman mo. Anong bahagi ang pinaka-gusto mong pag-usapan?",
        ],
    },
    "family_conflict": {
        "en": [
            "Family tension is one of the hardest things to carry, especially when you're also dealing with school. I'm sorry you're going through this. Are you somewhere safe right now?",
            "It makes sense that you're struggling when home doesn't feel peaceful. You deserve support. Would you like to talk about what's been happening?",
        ],
        "tl": [
            "Napakahirap ng mga sitwasyong ganyan sa pamilya, lalo na kapag ikaw pa ay may pag-aaral. Naririnig kita. Ligtas ka ba ngayon?",
            "Hindi madaling harapin ang ganoong klaseng tensyon sa bahay. Nandito ako para makinig at suportahan ka. Ano ang nangyayari?",
        ],
    },
    "financial_stress": {
        "en": [
            "Financial stress is one of the most draining pressures to carry as a student. It's okay to feel overwhelmed by it. Is there someone at your school's financial aid office you've been able to reach out to?",
            "Worrying about money while trying to study is incredibly hard. You're carrying a lot. Would it help to talk through your options together?",
        ],
        "tl": [
            "Napakabigat ng pag-aalala sa pera lalo na habang nag-aaral. Naririnig kita. Nakarating ka na ba sa financial aid office ng inyong school?",
            "Hindi madaling pagsabayin ang pag-aaral at pag-aalala sa gastos. Valid ang nararamdaman mo. Gusto mo bang pag-usapan ang mga pwedeng gawin?",
        ],
    },
    "loneliness": {
        "en": [
            "Feeling lonely, especially in a place full of people, can be one of the most painful experiences. You reaching out here matters. Is there one person at school you feel even a little comfortable with?",
            "I hear you. Loneliness can feel invisible to others but it's very real. You're not alone in this moment. Would you like to talk about it?",
        ],
        "tl": [
            "Ang pakiramdam na mag-isa kahit maraming tao sa paligid ay isang napakamahirap na bagay. Salamat na pinagkakatiwalaan mo ako. May isang tao ba sa school na medyo komportable kang kausapin?",
            "Naiintindihan ko ang nararamdaman mo. Hindi ka nag-iisa ngayon. Gusto mo bang pag-usapan ito?",
        ],
    },
    "burnout": {
        "en": [
            "Burnout is real and it's your body and mind telling you something important. It's okay to rest. What would feel like even a small act of care for yourself today?",
            "Feeling completely drained after pushing yourself so hard makes total sense. You don't have to keep running on empty. Is there one small thing you can let go of today?",
        ],
        "tl": [
            "Ang pagod na pakiramdam ay senyales ng katawan mo na kailangan mo ng pahinga. Okay lang magpahinga. May isang bagay ba na maibibigay mo sa sarili mo ngayon bilang pag-aalaga?",
            "Naiintindihan ko ang pagod na yun. Hindi mo kailangan laging maging strong. Ano ang isang bagay na pwede mong bitawan ngayon?",
        ],
    },
    "general_anxiety": {
        "en": [
            "Living with constant worry is exhausting. You don't have to carry that alone. Can you tell me more about what's been on your mind lately?",
            "Anxiety can make everything feel bigger and more uncertain. I'm here. Would a simple breathing exercise help you feel more grounded right now?",
        ],
        "tl": [
            "Ang palaging pag-aalala ay napakapagod. Hindi mo iyon kailangang dalhin nang mag-isa. Pwede mo bang ikwento sa akin kung ano ang madalas umabot sa isip mo?",
            "Naiintindihan ko kung paano pinapalaki ng anxiety ang lahat. Nandito ako. Gusto mo bang subukan ang maikling breathing exercise para makarelax?",
        ],
    },
    "general_chat": {
        "en": [
            "I'm glad you reached out. I'm here to listen. How are you feeling today?",
            "Hello! I'm here for you. Is there something on your mind you'd like to share?",
        ],
        "tl": [
            "Salamat na kinausap mo ako. Nandito lang ako para makinig. Kumusta ka ngayon?",
            "Kumusta! Nandito ako para sa iyo. May gusto ka bang ibahagi?",
        ],
    },
    "other": {
        "en": [
            "I want to understand what you're going through better. Can you share a little more about what's been on your mind?",
        ],
        "tl": [
            "Gusto kong mas maunawaan ang nararamdaman mo. Pwede mo bang ibahagi pa?",
        ],
    },
}

GROUNDING_TECHNIQUES = {
    "en": [
        "Try this: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. This can help ground you in the present moment.",
        "Let's try a breathing exercise: breathe in for 4 counts, hold for 4, breathe out for 6. Repeat this 3 times.",
        "It might help to get a glass of water and take a short walk, even just around the room.",
    ],
    "tl": [
        "Subukan natin ito: pangalanan mo ang 5 bagay na nakikita mo, 4 na nararamdaman, 3 na naririnig, 2 na naaaamoy, at 1 na nalalasahan. Makakatulong ito.",
        "Subukan nating huminga: huminga ng 4 beses, pigilan ng 4, ilabas ng 6. Ulitin ng 3 beses.",
        "Pwede kang kumuha ng tubig at maglakad sandali, kahit sa paligid lang ng kwarto.",
    ],
}

CRISIS_RESPONSES = {
    "en": {
        "standard": "I hear you, and I'm concerned about you. What you're feeling is real, and you don't have to face it alone. Please reach out to Hopeline now at 0917-558-4673 — they are here for you. I'll stay here while you make that call.",
        "plan": "I'm genuinely worried about you right now. Please call Hopeline immediately at 0917-558-4673. If you feel you cannot keep yourself safe, please go to your nearest emergency room or call 911. I'm staying right here with you.",
        "abuse": "What you're describing is not okay, and your safety matters. Please contact the Ka-PEER Yu organization or your campus Guidance and Counseling Office right now. You can also report anonymously to DSWD Childline at 02-8735-1370.",
    },
    "tl": {
        "standard": "Naririnig kita, at nag-aalala ako sa iyo. Totoo ang nararamdaman mo, at hindi mo kailangang harapin ito nang mag-isa. Mangyaring tumawag sa Hopeline ngayon sa 0917-558-4673. Nandito ako habang kumukuha ka ng tulong.",
        "plan": "Nag-aalala talaga ako sa iyo ngayon. Mangyaring tumawag kaagad sa Hopeline sa 0917-558-4673. Kung pakiramdam mo ay hindi mo maaaring panatilihing ligtas ang iyong sarili, pumunta sa pinakamalapit na emergency room o tumawag sa 911. Nandito ako para sa iyo.",
        "abuse": "Hindi tama ang nangyayari sa iyo, at ang iyong kaligtasan ang pinaka-importante. Makipag-ugnayan kaagad sa Ka-PEER Yu o sa Guidance and Counseling Office ng inyong campus. Pwede ka ring mag-report nang anonymous sa DSWD Childline sa 02-8735-1370.",
    },
}

ESCALATION_BUMP = {
    "en": " It sounds like this has been weighing on you for a while. It might help to speak with a real counselor at your campus Guidance Office — they're trained to support you through exactly this.",
    "tl": " Parang matagal na itong binubuo sa iyo. Maaaring makatulong ang pakikipag-usap sa isang counselor sa Guidance Office ng inyong campus — handa sila para tulungan ka.",
}

ANTI_DEPENDENCE = {
    "en": "I'm really glad you trust me, and I want to be here for you. And because I care, I also want to encourage you to lean on people in your life too — a friend, a family member, or a counselor. Human connection matters, and you deserve it.",
    "tl": "Natutuwa ako na nagtitiwala ka sa akin, at nandito talaga ako para sa iyo. Dahil mahalaga ka sa akin, gusto ko ring hingin sa iyo na hanapin ang suporta ng mga tao sa iyong buhay — kaibigan, kamag-anak, o counselor. Kailangan mo ng tunay na koneksyon ng tao.",
}

TRANSPARENCY = {
    "en": "I'm an AI, not a therapist — but I'm here to listen and help you navigate what you're feeling safely. ",
    "tl": "AI lang ako, hindi therapist — pero nandito ako para makinig at tulungan kang harapin ang nararamdaman mo nang ligtas. ",
}

# =============================================================================
# STEP 10 — RESPONSE GENERATOR
# =============================================================================
def pick_response(pool: list, used: set, fallback: str) -> str:
    """Pick a response not yet used in this session."""
    available = [r for r in pool if r not in used]
    if not available:
        available = pool  # reset if all used
    choice = random.choice(available)
    used.add(choice)
    return choice

def generate_response(
    intent: str,
    confidence: float,
    intensity: str,
    lang: str,
    escalation: dict,
    session_id: str,
    is_first_turn: bool,
) -> dict:
    used = get_used_responses(session_id)
    prefix = TRANSPARENCY[lang if lang == "en" else "tl"] if is_first_turn else ""
    lang_key = "en" if lang == "en" else "tl"

    # High distress (non-suicidal) → grounding + referral
    if intensity == "high":
        grounding = random.choice(GROUNDING_TECHNIQUES[lang_key])
        base = pick_response(
            TEMPLATES.get(intent, TEMPLATES["other"])[lang_key],
            used,
            "I'm here to listen.",
        )
        mark_response_used(session_id, base)
        bump = ESCALATION_BUMP[lang_key] if escalation["escalate"] else ""
        return {
            "response": prefix + base + " " + grounding + bump,
            "action": "high_distress_grounding",
        }

    # Low confidence → neutral + clarification
    if confidence < 0.80:
        log_low_confidence("(anonymized)", intent, confidence, intensity)
        clarifier = (
            " Can you tell me a little more about what's been going on?"
            if lang == "en"
            else " Pwede mo bang ibahagi pa ang nangyayari?"
        )
        base = pick_response(
            TEMPLATES.get("general_chat")[lang_key], used, ""
        )
        mark_response_used(session_id, base)
        bump = ESCALATION_BUMP[lang_key] if escalation["escalate"] else ""
        return {
            "response": prefix + base + clarifier + bump,
            "action": "clarification",
        }

    # Standard intent template
    base = pick_response(
        TEMPLATES.get(intent, TEMPLATES["other"])[lang_key], used, ""
    )
    mark_response_used(session_id, base)
    bump = ESCALATION_BUMP[lang_key] if escalation["escalate"] else ""
    return {
        "response": prefix + base + bump,
        "action": intent,
    }

# =============================================================================
# MAIN ENGINE — ORCHESTRATOR
# =============================================================================
# =============================================================================
class MentalHealthEngine:
    def process(self, req: ChatRequest, db: Session) -> dict:
        text = req.message
        lang = lang_det.detect(text)
        lang_key = "en" if lang == "en" else "tl"
        is_first_turn = req.turn == 0

        # -- Database: Get or Create Session --
        db_session = db.query(models.ChatSession).filter(models.ChatSession.session_id == req.session_id).first()
        if not db_session:
            db_session = models.ChatSession(
                session_id=req.session_id,
                latest_mood=req.mood or "Okay",
                total_turns=0,
                highest_risk_level=0
            )
            db.add(db_session)
            db.commit()
            db.refresh(db_session)

        # Log User Message
        user_msg = models.MessageLog(session_id=db_session.session_id, sender="user", text=text)
        db.add(user_msg)

        # ── ANTI-DEPENDENCE CHECK ───────────────────────────────────────────
        normalized = normalize_text(text)
        for pat in DEPENDENCE_PHRASES:
            if re.search(pat, normalized, re.IGNORECASE):
                logger.info("Anti-dependence trigger fired.")
                bot_msg = models.MessageLog(session_id=db_session.session_id, sender="bot", text=ANTI_DEPENDENCE[lang_key])
                db.add(bot_msg)
                db.commit()
                return {
                    "response": ANTI_DEPENDENCE[lang_key],
                    "action": "anti_dependence",
                    "reasoning": {"trigger": "dependence_phrase"},
                }

        # ── LAYER 1: CRISIS DETECTION (HIGHEST PRIORITY) ───────────────────
        crisis = crisis_detection(text)
        if crisis:
            level = crisis["level"]
            logger.critical(
                f"⚠️ CRISIS [{level}] | Session: {req.session_id} | Mood: {req.mood}"
            )
            response_type = "plan" if level == "CRISIS_PLAN" else "standard"
            reply_text = CRISIS_RESPONSES[lang_key][response_type]

            # DB Update
            db_session.highest_risk_level = 3
            db_session.latest_mood = req.mood or db_session.latest_mood
            db_session.action_taken = f"crisis_escalation_{response_type}"
            db_session.total_turns += 1

            new_alert = models.AlertLog(
                session_id=db_session.session_id,
                risk_level=3,
                action_taken=db_session.action_taken,
                latest_mood=db_session.latest_mood
            )
            bot_msg = models.MessageLog(session_id=db_session.session_id, sender="bot", text=reply_text)
            
            db.add(new_alert)
            db.add(bot_msg)
            db.commit()

            return {
                "response": reply_text,
                "action": f"crisis_escalation_{response_type}",
                "reasoning": {"crisis": crisis},
            }

        # ── LAYER 2: EMOTIONAL INTENSITY ────────────────────────────────────
        intensity = emotional_intensity(text)

        # ── LAYER 3: ML INTENT CLASSIFICATION ───────────────────────────────
        intent, confidence = classify_intent(text)

        # ── LAYER 4: SESSION ESCALATION MONITOR ─────────────────────────────
        escalation = monitor_escalation(req.session_id, intent, intensity)
        if escalation["escalate"]:
            logger.info(
                f"Escalation flag: repeat={escalation['theme_repeat']} worsening={escalation['worsening']}"
            )

        # ── LAYER 5: RESPONSE GENERATION ────────────────────────────────────
        result = generate_response(
            intent, confidence, intensity, lang, escalation, req.session_id, is_first_turn
        )

        # ── ADMIN DATA UPDATE (SQLITE) ──────────────────────────────────────
        current_risk_level = 0
        if intensity == "high":
            current_risk_level = 2
        elif intensity == "moderate" or escalation["escalate"]:
            current_risk_level = 1

        db_session.highest_risk_level = max(db_session.highest_risk_level, current_risk_level)
        db_session.latest_mood = req.mood or db_session.latest_mood
        db_session.action_taken = result["action"]
        db_session.total_turns += 1
        db_session.last_updated = datetime.datetime.utcnow()

        if current_risk_level >= 2 or escalation["escalate"]:
            new_alert = models.AlertLog(
                session_id=db_session.session_id,
                risk_level=current_risk_level,
                action_taken=result["action"],
                latest_mood=db_session.latest_mood
            )
            db.add(new_alert)
        
        bot_msg = models.MessageLog(session_id=db_session.session_id, sender="bot", text=result["response"])
        db.add(bot_msg)
        db.commit()

        return {
            "response": result["response"],
            "action": result["action"],
            "sentiment": result["sentiment"],
            "reasoning": {
                "intent": intent, # Corrected from result["intent_class"]
                "confidence": confidence, # Corrected from result["confidence"]
                "intensity": intensity,
                "escalation": escalation,
            }
        }

engine_app = MentalHealthEngine()

# =============================================================================
# API ENDPOINTS
# =============================================================================
@app.get("/")
def home():
    return {"status": "MindGuard Hybrid Engine V10 Ready"}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, db: Session = Depends(get_db)):
    try:
        result = engine_app.process(req, db)
        return ChatResponse(
            response=result["response"],
            sentiment="neutral",
            action=result.get("action", "none"),
            reasoning=result.get("reasoning"),
        )
    except Exception as e:
        logger.error(f"Engine error: {str(e)}", exc_info=True)
        return ChatResponse(
            response=(
                "Naririnig kita. Nandito ako para sa iyo."
                if "tl" in lang_det.detect(req.message)
                else "I hear you. I'm here for you."
            ),
            sentiment="neutral",
            action="fallback",
        )

# =============================================================================
# ADMIN DASHBOARD ENDPOINTS (SQLITE BACKED)
# =============================================================================
@app.get("/api/admin/students")
def get_admin_students(db: Session = Depends(get_db)):
    sessions = db.query(models.ChatSession).order_by(models.ChatSession.last_updated.desc()).all()
    return [
        {
            "session_id": s.session_id,
            "user_id": s.user_id,
            "user_email": s.user.email if s.user else "Anonymous",
            "student_id": s.user.student_id if s.user else "N/A",
            "fullname": s.user.fullname if s.user else "N/A",
            "course": s.user.program if s.user else "N/A",
            "latest_mood": s.latest_mood,
            "highest_risk_level": s.highest_risk_level,
            "total_turns": s.total_turns,
            "last_interaction": s.last_updated.isoformat()
        }
        for s in sessions
    ]

# -----------------------------------------------------------------------------
# PROFILE / PASSWORD MANAGEMENT
# -----------------------------------------------------------------------------
@app.put("/api/profile/{user_id}")
def update_profile(user_id: int, req: UpdateProfileRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first() # Changed User to models.User
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.fullname = req.fullname
    user.email = req.email
    user.trusted_contacts = json.dumps(req.trusted_contacts) if req.trusted_contacts else None
    
    db.commit()
    db.refresh(user)
    return {"status": "success", "message": "Profile updated successfully"}

@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    # Return user details for frontend context
    user_payload = {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "fullname": user.fullname,
        "student_id": user.student_id,
        "program": user.program,
        "is_primary_admin": user.is_primary_admin,
        "trusted_contacts": json.loads(user.trusted_contacts) if user.trusted_contacts else []
    }

    return {"status": "success", "message": f"Welcome back, {user.email}", "user": user_payload}

@app.post("/api/signup")
def signup(req: CreateStudentRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = models.User(
        email=req.email,
        password_hash=hash_password(req.password),
        fullname=req.fullname,
        student_id=req.student_id,
        program=req.program,
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    user_payload = {
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "fullname": new_user.fullname,
        "student_id": new_user.student_id,
        "program": new_user.program,
        "is_primary_admin": new_user.is_primary_admin,
        "trusted_contacts": []
    }
    return {"status": "success", "message": "Sign up successful", "user": user_payload}

@app.put("/api/profile/password/{user_id}")
def update_password(user_id: int, req: UpdatePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first() # Changed User to models.User
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Verify current password
    if not verify_password(req.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully"}

# -----------------------------------------------------------------------------
# ADMIN CRUD: MANAGE STUDENTS
# -----------------------------------------------------------------------------
@app.post("/api/admin/students")
def create_student(req: CreateStudentRequest, db: Session = Depends(get_db)):
    # Check if email exists
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_student = User(
        email=req.email,
        password_hash=hash_password(req.password),
        fullname=req.fullname,
        student_id=req.student_id,
        program=req.program,
        role="student"
    )
    db.add(new_student)
    db.commit()
    return {"status": "success", "message": "Student created successfully"}

@app.put("/api/admin/students/{user_id}")
def update_student(user_id: int, req: UpdateStudentRequest, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student.fullname = req.fullname
    student.email = req.email
    student.program = req.program
    db.commit()
    return {"status": "success", "message": "Student updated successfully"}

@app.delete("/api/admin/students/{user_id}")
def delete_student(user_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id == user_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student) # Cascade to sessions/messages
    db.commit()
    return {"status": "success", "message": "Student deleted successfully"}

# -----------------------------------------------------------------------------
# ADMIN CRUD: MANAGE ADMINS (With Primary Restriction)
# -----------------------------------------------------------------------------
@app.get("/api/admin/admins")
def get_admins(db: Session = Depends(get_db)):
    admins = db.query(User).filter(User.role == "admin").all()
    return [
        {
            "id": a.id,
            "fullname": a.fullname,
            "email": a.email,
            "role_title": a.program, # Using 'program' field to store Guidence vs Peer
            "is_primary": a.is_primary_admin
        }
        for a in admins
    ]

@app.post("/api/admin/admins")
def create_admin(req: CreateAdminRequest, requester_email: str, db: Session = Depends(get_db)):
    # 1. Enforce Primary Admin Rule
    requester = db.query(User).filter(User.email == requester_email).first()
    if not requester or not requester.is_primary_admin:
        raise HTTPException(status_code=403, detail="Only the Primary Admin can create new administrators.")
        
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_admin = User(
        email=req.email,
        password_hash=hash_password(req.password),
        fullname=req.fullname,
        program=req.role, # Mapping generic Guidence/Peer title here
        role="admin",
        is_primary_admin=False
    )
    db.add(new_admin)
    
    # 2. Fire Audit Log
    audit = AdminAuditLog(
        actor_admin_email=requester_email,
        action_type="CREATED_ADMIN",
        target_email=req.email
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "message": f"Admin {req.email} successfully created."}

@app.put("/api/admin/admins/{user_id}")
def update_admin(user_id: int, req: UpdateAdminRequest, requester_email: str, db: Session = Depends(get_db)):
    requester = db.query(User).filter(User.email == requester_email).first()
    if not requester or not requester.is_primary_admin:
        raise HTTPException(status_code=403, detail="Only the Primary Admin can edit other administrators.")
        
    admin = db.query(User).filter(User.id == user_id, User.role == "admin").first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    admin.fullname = req.fullname
    admin.email = req.email
    admin.program = req.role
    
    db.commit()
    return {"status": "success"}

@app.delete("/api/admin/admins/{user_id}")
def delete_admin(user_id: int, requester_email: str, db: Session = Depends(get_db)):
    requester = db.query(User).filter(User.email == requester_email).first()
    if not requester or not requester.is_primary_admin:
        raise HTTPException(status_code=403, detail="Only the Primary Admin can delete administrators.")
        
    admin = db.query(User).filter(User.id == user_id, User.role == "admin").first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    if admin.is_primary_admin:
        raise HTTPException(status_code=400, detail="Cannot delete the Primary Admin.")
        
    db.delete(admin)
    
    # Log Deletion
    audit = AdminAuditLog(
        actor_admin_email=requester_email,
        action_type="DELETED_ADMIN",
        target_email=admin.email
    )
    db.add(audit)
    db.commit()
    return {"status": "success"}

# -----------------------------------------------------------------------------
# EXISTING DASHBOARD ANALYTICS
# -----------------------------------------------------------------------------
@app.get("/api/admin/summary")
def get_admin_summary(db: Session = Depends(get_db)):
    active = db.query(models.ChatSession).count()
    
    # Calculate conversations today
    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_convos = db.query(models.MessageLog).filter(models.MessageLog.timestamp >= today_start).count()
    
    crisis_alerts = db.query(models.AlertLog).filter(models.AlertLog.is_reviewed == False).count()
    students_at_risk = db.query(models.ChatSession).filter(models.ChatSession.highest_risk_level >= 2).count()
    
    return {
        "total_active_students": active,
        "conversations_today": today_convos,
        "crisis_alerts": crisis_alerts,
        "students_at_risk": students_at_risk
    }

@app.get("/api/admin/mood-analytics")
def get_mood_analytics(start_date: Optional[str] = None, end_date: Optional[str] = None, db: Session = Depends(get_db)):
    sessions = db.query(models.ChatSession).all()
    moods = {"Happy": 0, "Okay": 0, "Stressed": 0, "Sad": 0, "Crisis": 0}
    
    for s in sessions:
        m = s.latest_mood.capitalize()
        # Fallback mappings just in case
        if m in moods:
            moods[m] += s.total_turns
        elif s.highest_risk_level == 3:
            moods["Crisis"] += s.total_turns
        else:
            moods["Okay"] += s.total_turns
    return moods

@app.get("/api/admin/risk-analytics")
def get_risk_analytics(db: Session = Depends(get_db)):
    sessions = db.query(models.ChatSession).all()
    risks = {"level_0": 0, "level_1": 0, "level_2": 0, "level_3": 0}
    for s in sessions:
        lvl = s.highest_risk_level
        if lvl in [0, 1, 2, 3]:
            risks[f"level_{lvl}"] += 1
    return risks

@app.get("/api/admin/alerts")
def get_admin_alerts(db: Session = Depends(get_db)):
    alerts = db.query(models.AlertLog).order_by(models.AlertLog.timestamp.desc()).all()
    out = []
    for a in alerts:
        out.append({
            "session_id": a.session_id,
            "risk_level": a.risk_level,
            "mood": a.latest_mood or "Unknown",
            "action": a.action_taken,
            "timestamp": a.timestamp.isoformat(),
            "is_reviewed": a.is_reviewed
        })
    return out

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
