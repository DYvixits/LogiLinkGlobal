from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timedelta
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
from dotenv import load_dotenv

load_dotenv()

# --- Config & Auth Setup ---
SECRET_KEY = "logilink_secret_key_change_me_in_prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# MongoDB setup
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'logilink')]
parcels_collection = db.parcels
users_collection = db.users

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

# --- Models ---

class User(BaseModel):
    username: str
    full_name: str
    role: Literal["admin", "supervisor", "operator"]
    disabled: Optional[bool] = False

class UserInDB(User):
    hashed_password: str

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

class ParcelCreate(BaseModel):
    direction: Literal["EU_TO_CM", "CM_TO_EU"]
    sender: SenderReceiverInfo
    receiver: SenderReceiverInfo
    content_description: str
    weight_kg: Optional[float] = None
    departure_date: str 

class ParcelUpdate(BaseModel):
    status: Optional[str] = None
    weight_kg: Optional[float] = None
    final_price: Optional[float] = None
    note: Optional[str] = None

class NotificationRequest(BaseModel):
    tracking_id: str
    type: Literal["sms", "email"]
    message: str

# --- Utils ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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
    user = await users_collection.find_one({"username": username})
    if user is None:
        raise credentials_exception
    return user

# Seeding Default Users
@app.on_event("startup")
async def seed_users():
    if await users_collection.count_documents({}) == 0:
        users = [
            {"username": "admin", "full_name": "Administrateur", "role": "admin", "hashed_password": get_password_hash("admin123")},
            {"username": "operateur", "full_name": "Opérateur Terrain", "role": "operator", "hashed_password": get_password_hash("op123")},
            {"username": "superviseur", "full_name": "Superviseur Chef", "role": "supervisor", "hashed_password": get_password_hash("super123")},
        ]
        await users_collection.insert_many(users)

def generate_tracking_id():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choice(chars) for _ in range(6))
    return f"LOGI-{suffix}"

def generate_pdf_ticket(parcel: dict):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, alignment=1, spaceAfter=20)
    normal_style = styles['Normal']
    
    story.append(Paragraph("TICKET D'ENVOI - LOGILINK GLOBAL", title_style))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(f"<b>N° SUIVI: {parcel['tracking_id']}</b>", ParagraphStyle('Tracking', parent=styles['Heading2'], fontSize=30, alignment=1, textColor=colors.navy)))
    story.append(Spacer(1, 0.2*inch))
    
    dir_text = "EUROPE -> CAMEROUN" if parcel['direction'] == "EU_TO_CM" else "CAMEROUN -> EUROPE"
    story.append(Paragraph(f"DIRECTION: {dir_text}", ParagraphStyle('Dir', parent=styles['Normal'], fontSize=14, alignment=1)))
    story.append(Spacer(1, 0.5*inch))

    qr = qrcode.QRCode(box_size=10, border=4)
    qr.add_data(f"https://logilink.com/track/{parcel['tracking_id']}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img_buffer = io.BytesIO()
    img.save(img_buffer)
    img_buffer.seek(0)
    rl_img = RLImage(img_buffer, width=2*inch, height=2*inch)
    story.append(rl_img)
    story.append(Spacer(1, 0.5*inch))

    data = [
        ["EXPÉDITEUR", "DESTINATAIRE"],
        [f"{parcel['sender']['name']}\n{parcel['sender']['phone']}\n{parcel['sender']['city']}",
         f"{parcel['receiver']['name']}\n{parcel['receiver']['phone']}\n{parcel['receiver']['city']}"],
        ["CONTENU", parcel['content_description']],
        ["DATE DÉPART PRÉVUE", parcel['departure_date']]
    ]
    t = Table(data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 1, colors.black),
        ('BACKGROUND', (0,0), (1,0), colors.lightgrey),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.black),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 12),
        ('FONTSIZE', (0,0), (-1,-1), 12),
        ('FONTNAME', (0,0), (1,0), 'Helvetica-Bold'),
        ('SPAN', (0,2), (1,2)),
        ('SPAN', (0,3), (1,3)),
    ]))
    story.append(t)
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("Merci de coller ce ticket sur votre colis avant le dépôt.", normal_style))
    doc.build(story)
    buffer.seek(0)
    return buffer

# --- Routes ---

@api_router.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user["username"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"], "full_name": user["full_name"]}

@api_router.post("/parcels")
async def create_parcel(parcel_in: ParcelCreate):
    tracking_id = generate_tracking_id()
    dep_date = datetime.strptime(parcel_in.departure_date, "%Y-%m-%d")
    arrival_date = dep_date + timedelta(days=7) 
    
    parcel_doc = parcel_in.dict()
    parcel_doc.update({
        "tracking_id": tracking_id,
        "status": "REGISTERED",
        "created_at": datetime.now(),
        "estimated_arrival": arrival_date.strftime("%Y-%m-%d"),
        "weight_kg": 0.0,
        "final_price": 0.0,
        "note": ""
    })
    
    await parcels_collection.insert_one(parcel_doc)
    parcel_doc.pop("_id")
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
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=ticket-{tracking_id}.pdf"}
    )

@api_router.get("/parcels")
async def list_parcels():
    # In a real app, filtering could be done via query params here
    parcels = await parcels_collection.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return parcels

@api_router.patch("/parcels/{tracking_id}")
async def update_parcel(tracking_id: str, update: ParcelUpdate):
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if not update_data: return {"message": "No data"}
    result = await parcels_collection.update_one({"tracking_id": tracking_id}, {"$set": update_data})
    if result.modified_count == 0:
         doc = await parcels_collection.find_one({"tracking_id": tracking_id})
         if not doc: raise HTTPException(status_code=404, detail="Parcel not found")
    return {"message": "Parcel updated", "updated_fields": update_data}

@api_router.patch("/parcels/{tracking_id}/status")
async def update_status(tracking_id: str, status: str):
    result = await parcels_collection.update_one({"tracking_id": tracking_id}, {"$set": {"status": status}})
    if result.modified_count == 0: raise HTTPException(status_code=404, detail="Update failed")
    return {"message": "Status updated"}

@api_router.get("/schedule")
async def get_schedule():
    today = datetime.now()
    schedule = {"eu_to_cm": [], "cm_to_eu": []}
    next_friday = today + timedelta((4 - today.weekday()) % 7)
    next_saturday = today + timedelta((5 - today.weekday()) % 7)
    for i in range(4):
        f = next_friday + timedelta(weeks=i)
        s = next_saturday + timedelta(weeks=i)
        schedule["eu_to_cm"].append(f.strftime("%Y-%m-%d"))
        schedule["cm_to_eu"].append(s.strftime("%Y-%m-%d"))
    return schedule

@api_router.get("/stats")
async def get_stats():
    total = await parcels_collection.count_documents({})
    registered = await parcels_collection.count_documents({"status": "REGISTERED"})
    transit = await parcels_collection.count_documents({"status": "IN_TRANSIT"})
    arrived = await parcels_collection.count_documents({"status": "ARRIVED"})
    delivered = await parcels_collection.count_documents({"status": "DELIVERED"})
    return {"total": total, "registered": registered, "transit": transit, "arrived": arrived, "delivered": delivered}

@api_router.post("/notify/simulate")
async def simulate_notification(req: NotificationRequest):
    await asyncio.sleep(1)
    return {"success": True, "message": f"SIMULATION: {req.type.upper()} envoyé à {req.tracking_id}", "details": req.message}

app.include_router(api_router)
