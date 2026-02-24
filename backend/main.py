from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict
import re
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[str]] = []
    session_id: Optional[str] = "default"
    turn: int = 0

class ChatResponse(BaseModel):
    response: str
    sentiment: Optional[str] = "neutral"
    action: Optional[str] = None
    reasoning: Optional[Dict] = None

# ==============================================================================
# LAYER 1: ABUSE DETECTOR (MANDATORY HARD ESCALATION)
# ==============================================================================
class AbuseDetector:
    def __init__(self):
        # Specific abuse indicators matched against family members
        self.abusers = [r"nanay", r"tatay", r"kuya", r"ate", r"tita", r"tito", r"lolo", r"lola", r"pinsan", r"relative", r"kamag-anak"]
        
        self.physical = [r"sinampal", r"pinapalo", r"sinaktan", r"binugbog", r"hinampas", r"hit", r"slapped", r"choked", r"sinakal"]
        self.psychological = [r"tinatawag.*siraulo", r"sinigawan", r"pinapahiya", r"belittle", r"gaslight"]
        self.economic = [r"hinulog\s+phone", r"kinuha\s+pera", r"withhold", r"nilock\s+sa\s+labas"]
        self.sexual = [r"hinahawakan", r"forced.*touch", r"rape", r"bastos"]

        self.fear_flags = [r"takot\s+magsabi", r"baka\s+magalit", r"scared", r"takot\s+ko", r"natatakot"]

    def detect_abuse(self, text: str) -> dict:
        text_lower = text.lower()
        
        # Check if an abuser word is present
        has_abuser = any(re.search(a, text_lower) for a in self.abusers)
        
        # Check specific abuse type
        abuse_type = None
        if any(re.search(p, text_lower) for p in self.physical): abuse_type = "physical"
        elif any(re.search(p, text_lower) for p in self.sexual): abuse_type = "sexual"
        elif has_abuser and any(re.search(p, text_lower) for p in self.psychological): abuse_type = "psychological"
        elif has_abuser and any(re.search(p, text_lower) for p in self.economic): abuse_type = "economic"

        if not abuse_type: 
            return None

        # Check for fear (requires de-escalation first)
        is_scared = any(re.search(f, text_lower) for f in self.fear_flags)

        return {"type": abuse_type, "scared": is_scared}

    def get_abuse_response(self, data: dict, lang: str) -> dict:
        scared = data["scared"]
        
        if scared:
            if lang == "en":
                res = "Your fear is completely valid. You shouldn't have to be afraid in your own home. Are you safe right now? You can report anonymously to DSWD Childline at 02-8735-1370—they won't reveal who you are."
            else:
                res = "Valid yung takot mo. Hindi ka dapat matakot sa sariling bahay. Safe ka ba ngayon? Pwede kang mag-report anonymously sa DSWD Childline 02-8735-1370—hindi nila sasabihin kung sino ka."
            return {"response": res, "action": "abuse_deescalation", "safe": False}

        # Hard Escalation depending on type
        if lang == "en":
            return {
                "response": "SAFETY FIRST. This is abuse. Please call DSWD Childline NOW at 02-8735-1370 or the PNP Women's Desk at 02-8532-6680. It is not normal. Report this first. I am still here after you call.",
                "action": "abuse_hotline",
                "safe": False
            }
        else:
            return {
                "response": "SAFETY FIRST. Isa itong uri ng pang-aabuso. Tumawag sa DSWD Childline NGAYON 02-8735-1370 o sa PNP Women's Desk 02-8532-6680. Hindi normal iyan. Mag-report ka muna bago ang lahat. Nandito pa rin ako pagkatapos.",
                "action": "abuse_hotline",
                "safe": False
            }

# ==============================================================================
# LAYER 2: LANGUAGE DETECTOR 
# ==============================================================================
class LanguageDetector:
    def __init__(self):
        self.tl_func = {"ang", "ng", "sa", "mga", "ay", "na", "ba", "po", "ko", "mo", "niya", "kami", "tayo", "sila", "natin", "nila", "ito"}
        self.en_func = {"the", "a", "an", "is", "are", "was", "were", "to", "in", "for", "on", "with", "as", "by", "at"}

    def detect(self, text: str) -> str:
        words = set(re.findall(r'\b\w+\b', text.lower()))
        if not words: return "tl" # default

        tl_count = len(words.intersection(self.tl_func))
        en_count = len(words.intersection(self.en_func))

        total_func = tl_count + en_count
        if total_func == 0:
            return "tl"

        tl_ratio = tl_count / total_func
        
        if tl_ratio > 0.7: return "tl"
        elif tl_ratio < 0.3: return "en"
        else: return "taglish"

# ==============================================================================
# LAYER 3: RISK SCORER (Weighted Crisis Matrix)
# ==============================================================================
class RiskScorer:
    def __init__(self):
        self.lv1_passive = {r"wala.*gana": 1, r"pagod.*mabuhay": 2, r"tired\s+of\s+everything": 2, r"give\s+up": 1}
        self.lv2_ideation = {r"sasaktan.*sarili": 5, r"hurt\s+myself": 5, r"overdose": 5, r"laslas": 5, r"mawala\s+na\s+lang": 5}
        self.lv3_intent = {r"magpapakamatay": 8, r"kill\s+myself": 8, r"jump": 8, r"pills": 8, r"end.*life": 8, r"suicide": 8}

    def evaluate_risk(self, text: str) -> dict:
        text_lower = text.lower()
        score = sum(val for pat, val in self.lv1_passive.items() if re.search(pat, text_lower))
        score += sum(val for pat, val in self.lv2_ideation.items() if re.search(pat, text_lower))
        score += sum(val for pat, val in self.lv3_intent.items() if re.search(pat, text_lower))

        level = 0
        if score >= 8: level = 3
        elif score >= 5: level = 2
        elif score >= 3: level = 1
        return {"score": score, "level": level}

    def get_escalation(self, risk_level: int, lang: str) -> dict:
        if risk_level == 3:
            res = "Ang bigat ng nararamdaman mo. Ligtas ka ba ngayon? Concerned ako sa safety mo. Mahalagang tumawag agad sa Hopeline: 0917-558-4673. Nandito ako habang kumokonekta ka sa kanila." if "tl" in lang else "That sounds incredibly heavy. Are you safe right now? I'm deeply concerned for your safety. Please call Hopeline immediately at 0917-558-4673. I'm here while you connect with them."
            return {"response": res, "action": "crisis_hotline", "safe": False}
        elif risk_level == 2:
            res = "Nakikita ko na napakasakit na ng pinagdadaanan mo. Ligtas ka ba ngayon? Kapag ganitong kabigat, mahalaga ang tulong ng Ka-PEER Yu o Guidance Office." if "tl" in lang else "I can see how much pain you're in. Are you safe right now? When things feel this unbearable, reaching out to Ka-PEER Yu or the Guidance Office is vital."
            return {"response": res, "action": "soft_crisis", "safe": True}
        return None

# ==============================================================================
# LAYER 4: REFLECTION ENGINE & EMPATHY
# ==============================================================================
class ReflectionEngine:
    def __init__(self):
        self.targets = ["prof", "grades", "exam", "thesis", "parents", "deadline", "jowa", "ex", "org", "manager", "pera", "tuition", "kaibigan"]

    def extract_subject(self, text: str) -> str:
        for target in self.targets:
            if re.search(r'\b' + target + r'\b', text.lower()): return target
        return ""

class TemplatedEmpathy:
    def __init__(self):
        self.presence_tl = ["Nandito ako para makinig.", "Kasama mo ako dito.", "Hindi ka nag-iisa habang nagkukwento ka."]
        self.presence_en = ["I'm here to listen.", "I'm with you in this.", "You're not alone while sharing this."]
        
    def get_presence(self, lang: str) -> str:
        return random.choice(self.presence_en) if lang == "en" else random.choice(self.presence_tl)

    def generate(self, text: str, lang: str, subject: str) -> str:
        is_question = "?" in text
        presence = self.get_presence(lang)

        # Base Validation
        if lang == "en":
            validations = ["That sounds really painful.", "It makes sense that you feel this way.", "That is incredibly heavy."]
            val = random.choice(validations)
            ref = f" It seems like navigating things with your {subject} is weighing you down right now." if subject else " I can hear how overwhelming this is for you."
            ask = " What feels the absolute hardest about this?" if not is_question else ""
            act = " If you're open to it, taking a slow sip of water might help ground you."
            referral = " You can also connect with the Ka-PEER Yu organization if you need more support." if random.random() < 0.2 else ""
        else: # tl or taglish
            validations = ["Ang bigat niyan.", "Valid na mahirapan ka sa sitwasyong ito.", "Mukhang napakabigat nito para sa'yo."]
            val = random.choice(validations)
            ref = f" Parang pinapabigat pa lalo ng isyu sa {subject} ang lahat." if subject else " Ramdam ang bigat ng pinapasan mo ngayon."
            ask = " Gusto mo bang magkwento pa?" if not is_question else ""
            act = " Kung okay lang, pwede mong subukan huminga nang mabagal sandali para makalma ang isip."
            referral = " Kung gusto mo, pwede mong kausapin ang Ka-PEER Yu o Guidance Office sa campus." if random.random() < 0.2 else ""

        # Construct final format: Validation -> Reflection -> [Ask/Act] -> Presence
        middle = act if len(text.split()) > 15 else ask
        
        response = f"{val}{ref}{middle} {presence}{referral}"
        return response

class InformationalRouter:
    def is_informational(self, text: str) -> bool:
        emo_flags = [r"stressed", r"pagod", r"iyak", r"sad", r"pressure"]
        if any(re.search(e, text.lower()) for e in emo_flags): return False
        return any(re.search(w, text.lower()) for w in [r"schedule", r"enrollment", r"requirements", r"deadline", r"registrar"])

    def get_info_response(self, lang: str) -> str:
        if lang == "en": return "I'm not entirely sure about the specific campus policy for that. You might want to ask the Registrar or your department office. But if there's anything weighing on your mind, I'm here to listen."
        return "Hindi ako sure sa specific campus policy para diyan. Pwede kang magtanong sa Registrar o sa department office ninyo. Pero kung may gumugulo sa isip mo, nandito lang ako para makinig."

# ==============================================================================
# ORCHESTRATOR
# ==============================================================================
class EmpathyBot:
    def __init__(self):
        logger.info("MindGuard V9 (Abuse Protocol & Language Mirror) Ready")
        self.abuse = AbuseDetector()
        self.lang_det = LanguageDetector()
        self.risk = RiskScorer()
        self.informational = InformationalRouter()
        self.reflection = ReflectionEngine()
        self.templates = TemplatedEmpathy()

    async def generate_response(self, req: ChatRequest) -> dict:
        text = req.message
        lang = self.lang_det.detect(text)

        transparency = ""
        if req.turn == 0:
            transparency = "I am an AI and not a therapist, but I'm here to listen and help you figure out safe next steps. " if lang == "en" else "AI lang ako at hindi therapist, pero nandito ako para makinig at tulungan kang mag-isip ng safe next steps. "

        # 1. Abuse Detection (Absolute Priority)
        abuse_data = self.abuse.detect_abuse(text)
        if abuse_data:
            response = self.abuse.get_abuse_response(abuse_data, lang)
            return {"response": response["response"], "action": response["action"], "reasoning": {"abuse": abuse_data}}

        # 2. Informational Bypass
        if self.informational.is_informational(text):
            response = self.informational.get_info_response(lang)
            return {"response": transparency + response, "action": "info", "reasoning": {"type": "informational"}}

        # 3. Suicide Risk Detection
        risk_data = self.risk.evaluate_risk(text)
        if risk_data["level"] >= 2:
            escalation = self.risk.get_escalation(risk_data["level"], lang)
            res_text = escalation["response"]
            if risk_data["level"] == 2: res_text = transparency + res_text
            return {"response": res_text, "action": escalation["action"], "reasoning": risk_data}

        # 4. Standard Empathy Flow
        subject = self.reflection.extract_subject(text)
        safe_response = self.templates.generate(text, lang, subject)

        # 5. Post-Gen Guardrails
        if re.search(r"kailangan\s+mong", safe_response, re.IGNORECASE):
            safe_response = re.sub(r"kailangan\s+mong", "pwede mong subukan", safe_response, flags=re.IGNORECASE)
        safe_response = safe_response.replace("!", "")
        
        # Word limit cap (approx 120 words max)
        words = safe_response.split()
        if len(words) > 120:
            safe_response = " ".join(words[:115]) + "... Nandito ako para makinig."

        return {
            "response": transparency + safe_response,
            "action": "none",
            "reasoning": {"lang": lang, "subject": subject, "risk": risk_data}
        }

bot = EmpathyBot()

@app.get("/")
def home(): return {"status": "MindGuard V9 Production Ready"}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        res = await bot.generate_response(req)
        return ChatResponse(**res)
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return ChatResponse(
            response="Naririnig kita. Valid ang nararamdaman mo. Nandito ako para makinig.",
            sentiment="neutral",
            action="none"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
