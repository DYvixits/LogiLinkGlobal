from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
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
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from dotenv import load_dotenv

load_dotenv()

# MongoDB setup
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'logilink')]
parcels_collection = db.parcels

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
    departure_date: str # ISO Date YYYY-MM-DD

class Parcel(BaseModel):
    tracking_id: str
    direction: str
    sender: SenderReceiverInfo
    receiver: SenderReceiverInfo
    content_description: str
    status: Literal["REGISTERED", "RECEIVED_AT_DEPOT", "IN_TRANSIT", "ARRIVED", "DELIVERED"] = "REGISTERED"
    created_at: datetime
    departure_date: str
    estimated_arrival: str

class NotificationRequest(BaseModel):
    tracking_id: str
    type: Literal["sms", "email"]
    message: str

# --- Utils ---

def generate_tracking_id():
    # Format: LG-XXXXXX (LogiLink)
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choice(chars) for _ in range(6))
    return f"LOGI-{suffix}"

def generate_pdf_ticket(parcel: dict):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    # Custom Styles
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=24, alignment=1, spaceAfter=20)
    normal_style = styles['Normal']
    
    # Header
    story.append(Paragraph("TICKET D'ENVOI - LOGILINK GLOBAL", title_style))
    story.append(Spacer(1, 0.5*inch))

    # Tracking Number (BIG)
    story.append(Paragraph(f"<b>N° SUIVI: {parcel['tracking_id']}</b>", ParagraphStyle('Tracking', parent=styles['Heading2'], fontSize=30, alignment=1, textColor=colors.navy)))
    story.append(Spacer(1, 0.2*inch))
    
    # Status & Direction
    dir_text = "EUROPE -> CAMEROUN" if parcel['direction'] == "EU_TO_CM" else "CAMEROUN -> EUROPE"
    story.append(Paragraph(f"DIRECTION: {dir_text}", ParagraphStyle('Dir', parent=styles['Normal'], fontSize=14, alignment=1)))
    story.append(Spacer(1, 0.5*inch))

    # QR Code
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

    # Details Table
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
        ('SPAN', (0,2), (1,2)), # Merge content row
        ('SPAN', (0,3), (1,3)), # Merge date row
    ]))
    story.append(t)
    
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("Merci de coller ce ticket sur votre colis avant le dépôt.", normal_style))

    doc.build(story)
    buffer.seek(0)
    return buffer

# --- Routes ---

@api_router.post("/parcels")
async def create_parcel(parcel_in: ParcelCreate):
    tracking_id = generate_tracking_id()
    
    # Calculate estimates (simple rule: 1 week later)
    dep_date = datetime.strptime(parcel_in.departure_date, "%Y-%m-%d")
    arrival_date = dep_date + timedelta(days=7) # Approx 1 week
    
    parcel_doc = parcel_in.dict()
    parcel_doc.update({
        "tracking_id": tracking_id,
        "status": "REGISTERED",
        "created_at": datetime.now(),
        "estimated_arrival": arrival_date.strftime("%Y-%m-%d")
    })
    
    await parcels_collection.insert_one(parcel_doc)
    
    # Clean for response
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
    # Simple list for backoffice
    parcels = await parcels_collection.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return parcels

@api_router.patch("/parcels/{tracking_id}/status")
async def update_status(tracking_id: str, status: str):
    result = await parcels_collection.update_one(
        {"tracking_id": tracking_id},
        {"$set": {"status": status}}
    )
    if result.modified_count == 0:
         raise HTTPException(status_code=404, detail="Update failed")
    return {"message": "Status updated"}

# Schedule Endpoint (Mock logic for now, could be DB driven later)
@api_router.get("/schedule")
async def get_schedule():
    # Generate next 4 weeks of schedule
    today = datetime.now()
    schedule = {
        "eu_to_cm": [], # Fridays
        "cm_to_eu": []  # Saturdays
    }
    
    # Find next Friday
    next_friday = today + timedelta((4 - today.weekday()) % 7)
    # Find next Saturday
    next_saturday = today + timedelta((5 - today.weekday()) % 7)
    
    for i in range(4):
        f = next_friday + timedelta(weeks=i)
        s = next_saturday + timedelta(weeks=i)
        schedule["eu_to_cm"].append(f.strftime("%Y-%m-%d"))
        schedule["cm_to_eu"].append(s.strftime("%Y-%m-%d"))
        
    return schedule

# --- NEW: Dashboard Stats ---
@api_router.get("/stats")
async def get_stats():
    total = await parcels_collection.count_documents({})
    registered = await parcels_collection.count_documents({"status": "REGISTERED"})
    transit = await parcels_collection.count_documents({"status": "IN_TRANSIT"})
    arrived = await parcels_collection.count_documents({"status": "ARRIVED"})
    delivered = await parcels_collection.count_documents({"status": "DELIVERED"})
    
    # Simple stats return
    return {
        "total": total,
        "registered": registered,
        "transit": transit,
        "arrived": arrived,
        "delivered": delivered
    }

# --- NEW: Notification Simulation ---
@api_router.post("/notify/simulate")
async def simulate_notification(req: NotificationRequest):
    # Simulate network delay
    await asyncio.sleep(1)
    # In a real app, we would call Twilio or SendGrid here
    return {
        "success": True, 
        "message": f"SIMULATION: {req.type.upper()} envoyé à {req.tracking_id}",
        "details": req.message
    }

app.include_router(api_router)
