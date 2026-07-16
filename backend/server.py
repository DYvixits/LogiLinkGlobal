from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import os
import random
import string
import io
import asyncio
import qrcode
from passlib.context import CryptContext
from jose import JWTError, jwt
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.graphics.barcode import code128
from reportlab.graphics.shapes import Drawing
from dotenv import load_dotenv

load_dotenv()

# --- Config & Auth Setup ---
SECRET_KEY = os.environ["JWT_SECRET"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "720"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# MongoDB setup
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
parcels_collection = db.parcels
users_collection = db.users
audit_collection = db.audit_logs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# --- Workflow statuses ---
# Linear lifecycle (order matters for the timeline / progress)
STATUS_FLOW = [
    "CREATED", "REGISTERED", "RECEIVED_AT_DEPOT", "CONTROLLED", "WEIGHED",
    "PACKED", "INVOICED", "PAID", "LOADED", "IN_TRANSIT", "IN_CUSTOMS",
    "ARRIVED", "AVAILABLE", "DELIVERED",
]
EXCEPTION_STATUSES = ["CANCELLED", "LOST", "DAMAGED"]
ALL_STATUSES = STATUS_FLOW + EXCEPTION_STATUSES
PAID_STATUSES = {"PAID", "LOADED", "IN_TRANSIT", "IN_CUSTOMS", "ARRIVED", "AVAILABLE", "DELIVERED"}

# --- Models ---

class User(BaseModel):
    username: str
    full_name: str
    role: Literal["admin", "director", "agency_manager", "depot_chief", "operator", "accountant", "customer_service", "delivery", "viewer", "supervisor"]
    disabled: Optional[bool] = False

class UserCreate(User):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str

class SenderReceiverInfo(BaseModel):
    name: str
    phone: str
    city: str
    address: Optional[str] = None
    country: Optional[str] = None
    email: Optional[str] = None

class Dimensions(BaseModel):
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None

class ParcelCreate(BaseModel):
    direction: Literal["EU_TO_CM", "CM_TO_EU"]
    sender: SenderReceiverInfo
    receiver: SenderReceiverInfo
    content_description: str
    weight_kg: Optional[float] = None
    departure_date: str
    nature: Optional[str] = None
    declared_value: Optional[float] = None
    fragile: Optional[bool] = False
    insured: Optional[bool] = False
    dimensions: Optional[Dimensions] = None
    agency_origin: Optional[str] = None
    agency_destination: Optional[str] = None
    operator: Optional[str] = None

class ParcelUpdate(BaseModel):
    status: Optional[str] = None
    weight_kg: Optional[float] = None
    final_price: Optional[float] = None
    amount_paid: Optional[float] = None
    note: Optional[str] = None
    nature: Optional[str] = None
    declared_value: Optional[float] = None
    fragile: Optional[bool] = None
    insured: Optional[bool] = None
    dimensions: Optional[Dimensions] = None

class NotificationRequest(BaseModel):
    tracking_id: str
    type: Literal["sms", "email", "whatsapp"]
    message: str

# --- Utils ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await users_collection.find_one({"username": username}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return user

def require_roles(*allowed_roles: str):
    async def _guard(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Permissions insuffisantes")
        return current_user
    return _guard

# roles allowed to operate on parcels
OPERATOR_ROLES = ("admin", "director", "agency_manager", "depot_chief", "operator", "supervisor", "customer_service", "accountant")

def generate_tracking_id():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choice(chars) for _ in range(6))
    return f"LOGI-{suffix}"

def generate_barcode():
    return ''.join(random.choice(string.digits) for _ in range(12))

def now_iso():
    return datetime.now(timezone.utc).isoformat()

async def log_audit(username: str, action: str, target: str, details: str = ""):
    await audit_collection.insert_one({
        "username": username,
        "action": action,
        "target": target,
        "details": details,
        "timestamp": now_iso(),
    })

# --- Seeding ---
@app.on_event("startup")
async def seed_data():
    if await users_collection.count_documents({}) == 0:
        users = [
            {"username": "admin", "full_name": "Administrateur", "role": "admin", "hashed_password": get_password_hash("admin123"), "disabled": False},
            {"username": "operateur", "full_name": "Opérateur Terrain", "role": "operator", "hashed_password": get_password_hash("op123"), "disabled": False},
            {"username": "superviseur", "full_name": "Superviseur Chef", "role": "supervisor", "hashed_password": get_password_hash("super123"), "disabled": False},
        ]
        await users_collection.insert_many(users)
        print("Users seeded")

    # Rich demo parcels
    if await parcels_collection.count_documents({}) < 12:
        await parcels_collection.delete_many({})
        natures = ["Vêtements", "Électronique", "Documents", "Produits alimentaires", "Cosmétiques", "Pièces auto"]
        cities_eu = ["Paris", "Lodi", "Rome", "Bruxelles", "Milan", "Lyon"]
        cities_cm = ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Kribi", "Garoua"]
        dummy = []
        for i in range(24):
            status = random.choice(ALL_STATUSES)
            direction = random.choice(["EU_TO_CM", "CM_TO_EU"])
            days_ago = random.randint(0, 45)
            created_at = datetime.now(timezone.utc) - timedelta(days=days_ago)
            dep_date = created_at + timedelta(days=2)
            arr_date = dep_date + timedelta(days=7)
            weight = round(random.uniform(1.0, 25.0), 1)
            price = round(weight * random.uniform(6, 12), 2)
            paid = status in PAID_STATUSES
            # build a plausible history up to current status
            history = []
            if status in STATUS_FLOW:
                idx = STATUS_FLOW.index(status)
                for j, s in enumerate(STATUS_FLOW[:idx + 1]):
                    ts = created_at + timedelta(days=j * 0.7)
                    history.append({"status": s, "timestamp": ts.isoformat(), "author": "Opérateur Terrain", "comment": ""})
            else:
                history.append({"status": "REGISTERED", "timestamp": created_at.isoformat(), "author": "Système", "comment": ""})
                history.append({"status": status, "timestamp": (created_at + timedelta(days=3)).isoformat(), "author": "Opérateur Terrain", "comment": "Anomalie signalée"})

            src = cities_eu if direction == "EU_TO_CM" else cities_cm
            dst = cities_cm if direction == "EU_TO_CM" else cities_eu
            dummy.append({
                "tracking_id": generate_tracking_id(),
                "barcode": generate_barcode(),
                "direction": direction,
                "sender": {"name": f"Client Exp. {i}", "phone": f"+33{random.randint(600000000,699999999)}", "city": random.choice(src), "address": "Adresse", "country": "Italie" if direction == "EU_TO_CM" else "Cameroun"},
                "receiver": {"name": f"Client Dest. {i}", "phone": f"+237{random.randint(600000000,699999999)}", "city": random.choice(dst), "address": "Adresse", "country": "Cameroun" if direction == "EU_TO_CM" else "Italie"},
                "content_description": random.choice(natures),
                "nature": random.choice(natures),
                "status": status,
                "created_at": created_at.isoformat(),
                "departure_date": dep_date.strftime("%Y-%m-%d"),
                "estimated_arrival": arr_date.strftime("%Y-%m-%d"),
                "weight_kg": weight,
                "volume_m3": round(random.uniform(0.01, 0.3), 3),
                "dimensions": {"length": random.randint(20, 80), "width": random.randint(20, 60), "height": random.randint(10, 50)},
                "declared_value": round(random.uniform(50, 1200), 2),
                "fragile": random.choice([True, False]),
                "insured": random.choice([True, False]),
                "final_price": price,
                "amount_paid": price if paid else 0.0,
                "operator": "Opérateur Terrain",
                "agency_origin": "Agence " + random.choice(src),
                "agency_destination": "Agence " + random.choice(dst),
                "note": "",
                "history": history,
            })
        await parcels_collection.insert_many(dummy)
        print("Parcels seeded")

def generate_pdf_ticket(parcel: dict):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, alignment=1, spaceAfter=20)
    normal_style = styles['Normal']

    story.append(Paragraph("TICKET D'ENVOI - LOGILINK GLOBAL", title_style))
    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph(f"<b>N° SUIVI: {parcel['tracking_id']}</b>", ParagraphStyle('Tracking', parent=styles['Heading2'], fontSize=28, alignment=1, textColor=colors.HexColor('#0F172A'))))
    story.append(Spacer(1, 0.2 * inch))

    dir_text = "EUROPE -> CAMEROUN" if parcel['direction'] == "EU_TO_CM" else "CAMEROUN -> EUROPE"
    story.append(Paragraph(f"DIRECTION: {dir_text}", ParagraphStyle('Dir', parent=styles['Normal'], fontSize=14, alignment=1)))
    story.append(Spacer(1, 0.3 * inch))

    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(f"https://logilink.com/track?id={parcel['tracking_id']}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img_buffer = io.BytesIO()
    img.save(img_buffer)
    img_buffer.seek(0)
    story.append(RLImage(img_buffer, width=1.8 * inch, height=1.8 * inch))
    story.append(Spacer(1, 0.2 * inch))

    # Code 128 barcode
    bc_value = parcel.get('barcode') or parcel['tracking_id']
    barcode = code128.Code128(bc_value, barHeight=0.5 * inch, barWidth=1.1)
    story.append(barcode)
    story.append(Paragraph(bc_value, ParagraphStyle('bc', parent=styles['Normal'], fontSize=9, alignment=1)))
    story.append(Spacer(1, 0.3 * inch))

    data = [
        ["EXPÉDITEUR", "DESTINATAIRE"],
        [f"{parcel['sender']['name']}\n{parcel['sender']['phone']}\n{parcel['sender']['city']}",
         f"{parcel['receiver']['name']}\n{parcel['receiver']['phone']}\n{parcel['receiver']['city']}"],
        ["CONTENU", parcel['content_description']],
        ["DATE DÉPART PRÉVUE", parcel['departure_date']]
    ]
    t = Table(data, colWidths=[3 * inch, 3 * inch])
    t.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('BACKGROUND', (0, 0), (1, 0), colors.HexColor('#F1F5F9')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 12),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('FONTNAME', (0, 0), (1, 0), 'Helvetica-Bold'),
        ('SPAN', (0, 2), (1, 2)),
        ('SPAN', (0, 3), (1, 3)),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.8 * inch))
    story.append(Paragraph("Merci de coller ce ticket sur votre colis avant le dépôt.", normal_style))
    doc.build(story)
    buffer.seek(0)
    return buffer

# --- Auth Routes ---

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Identifiant ou mot de passe incorrect")
    if user.get("disabled"):
        raise HTTPException(status_code=403, detail="Compte désactivé")
    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"], "full_name": user["full_name"]}

@api_router.get("/auth/me")
async def read_me(current_user: dict = Depends(get_current_user)):
    return {"username": current_user["username"], "full_name": current_user["full_name"], "role": current_user["role"]}

# --- Users (admin) ---

@api_router.get("/users", response_model=List[User])
async def list_users(current_user: dict = Depends(require_roles("admin", "director"))):
    return await users_collection.find({}, {"_id": 0, "hashed_password": 0}).to_list(200)

@api_router.post("/users", response_model=User)
async def create_user(user_in: UserCreate, current_user: dict = Depends(require_roles("admin", "director"))):
    if await users_collection.find_one({"username": user_in.username}):
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")
    user_doc = user_in.dict()
    user_doc["hashed_password"] = get_password_hash(user_in.password)
    del user_doc["password"]
    await users_collection.insert_one(user_doc)
    await log_audit(current_user["username"], "CREATE_USER", user_in.username)
    return user_in

# --- Parcels ---

@api_router.post("/parcels")
async def create_parcel(parcel_in: ParcelCreate):
    tracking_id = generate_tracking_id()
    dep_date = datetime.strptime(parcel_in.departure_date, "%Y-%m-%d")
    arrival_date = dep_date + timedelta(days=7)
    parcel_doc = parcel_in.dict()
    author = parcel_in.operator or "Client (Web)"
    parcel_doc.update({
        "tracking_id": tracking_id,
        "barcode": generate_barcode(),
        "status": "REGISTERED",
        "created_at": now_iso(),
        "estimated_arrival": arrival_date.strftime("%Y-%m-%d"),
        "weight_kg": parcel_in.weight_kg or 0.0,
        "volume_m3": 0.0,
        "final_price": 0.0,
        "amount_paid": 0.0,
        "note": "",
        "history": [{"status": "REGISTERED", "timestamp": now_iso(), "author": author, "comment": "Colis enregistré"}],
    })
    await parcels_collection.insert_one(parcel_doc)
    parcel_doc.pop("_id", None)
    return parcel_doc

@api_router.get("/parcels/{tracking_id}")
async def get_parcel(tracking_id: str):
    parcel = await parcels_collection.find_one({"tracking_id": tracking_id}, {"_id": 0})
    if not parcel:
        raise HTTPException(status_code=404, detail="Colis non trouvé")
    return parcel

@api_router.get("/parcels/{tracking_id}/pdf")
async def get_parcel_pdf(tracking_id: str):
    parcel = await parcels_collection.find_one({"tracking_id": tracking_id}, {"_id": 0})
    if not parcel:
        raise HTTPException(status_code=404, detail="Colis non trouvé")
    pdf_buffer = generate_pdf_ticket(parcel)
    return StreamingResponse(pdf_buffer, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename=ticket-{tracking_id}.pdf"})

@api_router.get("/parcels")
async def list_parcels(current_user: dict = Depends(require_roles(*OPERATOR_ROLES))):
    return await parcels_collection.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

@api_router.patch("/parcels/{tracking_id}")
async def update_parcel(tracking_id: str, update: ParcelUpdate, current_user: dict = Depends(require_roles(*OPERATOR_ROLES))):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data:
        return {"message": "No data"}
    parcel = await parcels_collection.find_one({"tracking_id": tracking_id})
    if not parcel:
        raise HTTPException(status_code=404, detail="Colis non trouvé")
    history_entry = None
    if "status" in update_data and update_data["status"] != parcel.get("status"):
        history_entry = {"status": update_data["status"], "timestamp": now_iso(),
                         "author": current_user["full_name"], "comment": update_data.get("note", "")}
    ops = {"$set": update_data}
    if history_entry:
        ops["$push"] = {"history": history_entry}
    await parcels_collection.update_one({"tracking_id": tracking_id}, ops)
    await log_audit(current_user["username"], "UPDATE_PARCEL", tracking_id, str(update_data))
    return {"message": "Parcel updated", "updated_fields": update_data}

@api_router.patch("/parcels/{tracking_id}/status")
async def update_status(tracking_id: str, status: str, current_user: dict = Depends(require_roles(*OPERATOR_ROLES))):
    parcel = await parcels_collection.find_one({"tracking_id": tracking_id})
    if not parcel:
        raise HTTPException(status_code=404, detail="Colis non trouvé")
    entry = {"status": status, "timestamp": now_iso(), "author": current_user["full_name"], "comment": ""}
    await parcels_collection.update_one({"tracking_id": tracking_id},
                                        {"$set": {"status": status}, "$push": {"history": entry}})
    await log_audit(current_user["username"], "UPDATE_STATUS", tracking_id, status)
    return {"message": "Status updated"}

# --- Schedule ---

@api_router.get("/schedule")
async def get_schedule():
    today = datetime.now()
    schedule = {"eu_to_cm": [], "cm_to_eu": []}
    next_friday = today + timedelta((4 - today.weekday()) % 7)
    next_saturday = today + timedelta((5 - today.weekday()) % 7)
    for i in range(4):
        schedule["eu_to_cm"].append((next_friday + timedelta(weeks=i)).strftime("%Y-%m-%d"))
        schedule["cm_to_eu"].append((next_saturday + timedelta(weeks=i)).strftime("%Y-%m-%d"))
    return schedule

# --- Stats / Dashboard ---

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(require_roles(*OPERATOR_ROLES))):
    parcels = await parcels_collection.find({}, {"_id": 0}).to_list(5000)
    total = len(parcels)
    status_counts = {s: 0 for s in ALL_STATUSES}
    revenue_collected = 0.0
    revenue_pending = 0.0
    total_weight = 0.0
    total_volume = 0.0
    senders, receivers, clients = set(), set(), set()
    dir_counts = {"EU_TO_CM": 0, "CM_TO_EU": 0}
    delivery_days = []
    daily = defaultdict(int)
    monthly = defaultdict(int)

    for p in parcels:
        st = p.get("status", "REGISTERED")
        status_counts[st] = status_counts.get(st, 0) + 1
        price = float(p.get("final_price") or 0)
        paid = float(p.get("amount_paid") or 0)
        revenue_collected += paid
        revenue_pending += max(price - paid, 0)
        total_weight += float(p.get("weight_kg") or 0)
        total_volume += float(p.get("volume_m3") or 0)
        s_ph = p.get("sender", {}).get("phone")
        r_ph = p.get("receiver", {}).get("phone")
        if s_ph:
            senders.add(s_ph); clients.add(s_ph)
        if r_ph:
            receivers.add(r_ph); clients.add(r_ph)
        dir_counts[p.get("direction", "EU_TO_CM")] = dir_counts.get(p.get("direction", "EU_TO_CM"), 0) + 1
        # activity by created day
        try:
            created = datetime.fromisoformat(p["created_at"].replace("Z", "+00:00"))
            daily[created.strftime("%Y-%m-%d")] += 1
            monthly[created.strftime("%Y-%m")] += 1
        except Exception:
            pass
        # delivery time
        if st == "DELIVERED":
            hist = p.get("history", [])
            delivered_at = next((h["timestamp"] for h in hist if h["status"] == "DELIVERED"), None)
            try:
                c = datetime.fromisoformat(p["created_at"].replace("Z", "+00:00"))
                d = datetime.fromisoformat(delivered_at.replace("Z", "+00:00")) if delivered_at else None
                if d:
                    delivery_days.append((d - c).days)
            except Exception:
                pass

    delivered = status_counts.get("DELIVERED", 0)
    incidents = status_counts.get("LOST", 0) + status_counts.get("DAMAGED", 0) + status_counts.get("CANCELLED", 0)
    in_transit = sum(status_counts.get(s, 0) for s in ("LOADED", "IN_TRANSIT", "IN_CUSTOMS"))
    registered = status_counts.get("REGISTERED", 0) + status_counts.get("CREATED", 0)
    waiting = sum(status_counts.get(s, 0) for s in ("RECEIVED_AT_DEPOT", "CONTROLLED", "WEIGHED", "PACKED", "INVOICED", "PAID"))
    arrived = sum(status_counts.get(s, 0) for s in ("ARRIVED", "AVAILABLE"))

    # daily activity last 14 days
    daily_series = []
    for i in range(13, -1, -1):
        d = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_series.append({"date": d, "count": daily.get(d, 0)})
    # monthly last 6 months
    monthly_series = []
    for i in range(5, -1, -1):
        d = (datetime.now() - timedelta(days=i * 30)).strftime("%Y-%m")
        monthly_series.append({"month": d, "count": monthly.get(d, 0)})

    success_rate = round((delivered / total) * 100, 1) if total else 0
    avg_delivery = round(sum(delivery_days) / len(delivery_days), 1) if delivery_days else 0

    return {
        "total": total,
        "registered": registered,
        "waiting": waiting,
        "transit": in_transit,
        "arrived": arrived,
        "delivered": delivered,
        "incidents": incidents,
        "delayed": 0,
        "status_counts": status_counts,
        "revenue_collected": round(revenue_collected, 2),
        "revenue_pending": round(revenue_pending, 2),
        "total_weight": round(total_weight, 1),
        "total_volume": round(total_volume, 3),
        "clients": len(clients),
        "senders": len(senders),
        "receivers": len(receivers),
        "direction_counts": dir_counts,
        "success_rate": success_rate,
        "avg_delivery_days": avg_delivery,
        "daily_activity": daily_series,
        "monthly_activity": monthly_series,
    }

@api_router.get("/audit")
async def list_audit(current_user: dict = Depends(require_roles("admin", "director"))):
    return await audit_collection.find({}, {"_id": 0}).sort("timestamp", -1).to_list(100)

@api_router.post("/notify/simulate")
async def simulate_notification(req: NotificationRequest, current_user: dict = Depends(require_roles(*OPERATOR_ROLES))):
    await asyncio.sleep(0.5)
    return {"success": True, "message": f"SIMULATION: {req.type.upper()} envoyé pour {req.tracking_id}", "details": req.message}

app.include_router(api_router)
