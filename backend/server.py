from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Literal, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# --- DB ---
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# --- App ---
app = FastAPI()
api_router = APIRouter(prefix="/api")

JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

# --- Password helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

# --- JWT helpers ---
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60 * 24),  # 1 day for dev UX
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

# --- Models ---
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    role: str = "user"
    created_at: datetime

class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

class LoginBody(BaseModel):
    email: EmailStr
    password: str

class TransactionCreate(BaseModel):
    type: Literal["receita", "despesa"]
    description: str = Field(min_length=1)
    value: float = Field(gt=0)
    category: str
    date: str  # YYYY-MM-DD

class Transaction(BaseModel):
    id: str
    user_id: str
    type: str
    description: str
    value: float
    category: str
    date: str
    created_at: datetime

class GoalCreate(BaseModel):
    name: str
    emoji: str = "🎯"
    target: float = Field(gt=0)
    saved: float = 0
    deadline: str

class Goal(BaseModel):
    id: str
    user_id: str
    name: str
    emoji: str
    target: float
    saved: float
    deadline: str
    created_at: datetime

class DepositBody(BaseModel):
    amount: float = Field(gt=0)

# --- Auth dependency ---
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Brute force ---
LOCKOUT_MAX = 5
LOCKOUT_WINDOW = 15 * 60

async def check_lockout(identifier: str):
    now = datetime.now(timezone.utc)
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= LOCKOUT_MAX:
        last = rec.get("last_at")
        if isinstance(last, str):
            last = datetime.fromisoformat(last)
        if last and (now - last).total_seconds() < LOCKOUT_WINDOW:
            raise HTTPException(status_code=429, detail="Muitas tentativas. Tente novamente em 15 minutos.")

async def register_failed(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

async def clear_failed(identifier: str):
    await db.login_attempts.delete_one({"identifier": identifier})

# --- Auth endpoints ---
@api_router.post("/auth/register")
async def register(body: RegisterBody, response: Response):
    email = body.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "role": "user",
        "created_at": now.isoformat(),
    }
    await db.users.insert_one(doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"id": user_id, "email": email, "role": "user", "created_at": now.isoformat(), "access_token": access}

@api_router.post("/auth/login")
async def login(body: LoginBody, request: Request, response: Response):
    email = body.email.lower().strip()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await register_failed(identifier)
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos")
    await clear_failed(identifier)
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "email": email, "role": user.get("role", "user"), "created_at": user["created_at"], "access_token": access}

@api_router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "role": user.get("role", "user"), "created_at": user["created_at"]}

@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
        return {"ok": True}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# --- Transactions ---
@api_router.get("/transactions")
async def list_transactions(user: dict = Depends(get_current_user)):
    items = await db.transactions.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(2000)
    return items

@api_router.post("/transactions")
async def create_transaction(body: TransactionCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": body.type,
        "description": body.description,
        "value": float(body.value),
        "category": body.category,
        "date": body.date,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: str, user: dict = Depends(get_current_user)):
    r = await db.transactions.delete_one({"id": tx_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return {"ok": True}

# --- Goals ---
@api_router.get("/goals")
async def list_goals(user: dict = Depends(get_current_user)):
    items = await db.goals.find({"user_id": user["id"]}, {"_id": 0}).sort("deadline", 1).to_list(500)
    return items

@api_router.post("/goals")
async def create_goal(body: GoalCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "emoji": body.emoji or "🎯",
        "target": float(body.target),
        "saved": float(body.saved or 0),
        "deadline": body.deadline,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.goals.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/goals/{goal_id}/deposit")
async def deposit_goal(goal_id: str, body: DepositBody, user: dict = Depends(get_current_user)):
    goal = await db.goals.find_one({"id": goal_id, "user_id": user["id"]}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    new_saved = float(goal["saved"]) + float(body.amount)
    await db.goals.update_one({"id": goal_id, "user_id": user["id"]}, {"$set": {"saved": new_saved}})
    goal["saved"] = new_saved
    return goal

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user: dict = Depends(get_current_user)):
    r = await db.goals.delete_one({"id": goal_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    return {"ok": True}
# --- Bills (Contas Fixas) ---
class BillCreate(BaseModel):
    name: str = Field(min_length=1)
    value: float = Field(gt=0)
    category: str
    due_day: int = Field(ge=1, le=31)
    emoji: str = "💰"

class Bill(BaseModel):
    id: str
    user_id: str
    name: str
    value: float
    category: str
    due_day: int
    emoji: str
    created_at: datetime

class BillPayment(BaseModel):
    id: str
    bill_id: str
    user_id: str
    month: str  # formato: "2026-04"
    paid_at: datetime

@api_router.get("/bills")
async def list_bills(user: dict = Depends(get_current_user)):
    items = await db.bills.find({"user_id": user["id"]}, {"_id": 0}).sort("due_day", 1).to_list(500)
    return items

@api_router.post("/bills")
async def create_bill(body: BillCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "value": float(body.value),
        "category": body.category,
        "due_day": body.due_day,
        "emoji": body.emoji or "💰",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bills.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/bills/{bill_id}")
async def delete_bill(bill_id: str, user: dict = Depends(get_current_user)):
    r = await db.bills.delete_one({"id": bill_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    await db.bill_payments.delete_many({"bill_id": bill_id, "user_id": user["id"]})
    return {"ok": True}

@api_router.put("/bills/{bill_id}")
async def update_bill(bill_id: str, body: BillCreate, user: dict = Depends(get_current_user)):
    bill = await db.bills.find_one({"id": bill_id, "user_id": user["id"]})
    if not bill:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    await db.bills.update_one(
        {"id": bill_id, "user_id": user["id"]},
        {"$set": {
            "name": body.name,
            "value": float(body.value),
            "category": body.category,
            "due_day": body.due_day,
            "emoji": body.emoji or "💰",
        }}
    )
    updated = await db.bills.find_one({"id": bill_id}, {"_id": 0})
    return updated

@api_router.get("/bills/payments")
async def list_payments(month: str, user: dict = Depends(get_current_user)):
    items = await db.bill_payments.find(
        {"user_id": user["id"], "month": month}, {"_id": 0}
    ).to_list(500)
    return items

@api_router.post("/bills/{bill_id}/pay")
async def pay_bill(bill_id: str, user: dict = Depends(get_current_user)):
    bill = await db.bills.find_one({"id": bill_id, "user_id": user["id"]}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    
    now = datetime.now(timezone.utc)
    month = now.strftime("%Y-%m")
    
    existing = await db.bill_payments.find_one({
        "bill_id": bill_id, "user_id": user["id"], "month": month
    })
    if existing:
        raise HTTPException(status_code=400, detail="Conta já paga neste mês")
    
    payment = {
        "id": str(uuid.uuid4()),
        "bill_id": bill_id,
        "user_id": user["id"],
        "month": month,
        "paid_at": now.isoformat(),
    }
    await db.bill_payments.insert_one(payment)
    payment.pop("_id", None)
    
    # Cria transação automática no Quest Log
    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "despesa",
        "description": f"{bill['emoji']} {bill['name']}",
        "value": float(bill["value"]),
        "category": bill["category"],
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now.isoformat(),
    }
    await db.transactions.insert_one(tx)
    tx.pop("_id", None)
    
    return {"payment": payment, "transaction": tx}

@api_router.delete("/bills/{bill_id}/pay")
async def unpay_bill(bill_id: str, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    month = now.strftime("%Y-%m")
    r = await db.bill_payments.delete_one({
        "bill_id": bill_id, "user_id": user["id"], "month": month
    })
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return {"ok": True}

# --- Installments (Parcelamentos) ---
class InstallmentCreate(BaseModel):
    name: str = Field(min_length=1)
    emoji: str = "💳"
    category: str
    due_day: int = Field(ge=1, le=31)
    total_installments: int = Field(ge=2)
    installment_value: float = Field(gt=0)

@api_router.get("/installments")
async def list_installments(user: dict = Depends(get_current_user)):
    items = await db.installments.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items

@api_router.post("/installments")
async def create_installment(body: InstallmentCreate, user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "emoji": body.emoji or "💳",
        "category": body.category,
        "due_day": body.due_day,
        "total_installments": body.total_installments,
        "installment_value": float(body.installment_value),
        "paid_installments": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.installments.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/installments/{inst_id}")
async def update_installment(inst_id: str, body: InstallmentCreate, user: dict = Depends(get_current_user)):
    inst = await db.installments.find_one({"id": inst_id, "user_id": user["id"]})
    if not inst:
        raise HTTPException(status_code=404, detail="Parcelamento não encontrado")
    await db.installments.update_one(
        {"id": inst_id, "user_id": user["id"]},
        {"$set": {
            "name": body.name,
            "emoji": body.emoji or "💳",
            "category": body.category,
            "due_day": body.due_day,
            "total_installments": body.total_installments,
            "installment_value": float(body.installment_value),
        }}
    )
    updated = await db.installments.find_one({"id": inst_id}, {"_id": 0})
    return updated

@api_router.delete("/installments/{inst_id}")
async def delete_installment(inst_id: str, user: dict = Depends(get_current_user)):
    r = await db.installments.delete_one({"id": inst_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Parcelamento não encontrado")
    return {"ok": True}

@api_router.post("/installments/{inst_id}/pay")
async def pay_installment(inst_id: str, user: dict = Depends(get_current_user)):
    inst = await db.installments.find_one({"id": inst_id, "user_id": user["id"]}, {"_id": 0})
    if not inst:
        raise HTTPException(status_code=404, detail="Parcelamento não encontrado")
    if inst["paid_installments"] >= inst["total_installments"]:
        raise HTTPException(status_code=400, detail="Parcelamento já quitado")

    new_paid = inst["paid_installments"] + 1
    await db.installments.update_one(
        {"id": inst_id, "user_id": user["id"]},
        {"$set": {"paid_installments": new_paid}}
    )

    now = datetime.now(timezone.utc)
    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "type": "despesa",
        "description": f"{inst['emoji']} {inst['name']} ({new_paid}/{inst['total_installments']})",
        "value": float(inst["installment_value"]),
        "category": inst["category"],
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now.isoformat(),
    }
    await db.transactions.insert_one(tx)
    tx.pop("_id", None)

    inst["paid_installments"] = new_paid
    return {"installment": inst, "transaction": tx}

# --- Profile ---
class ProfileUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    monthly_income: float = Field(ge=0)
    savings_goal_pct: float = Field(ge=0, le=100)

@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    profile = await db.profiles.find_one({"user_id": user["id"]}, {"_id": 0})
    if not profile:
        return {
            "user_id": user["id"],
            "display_name": user["email"].split("@")[0],
            "monthly_income": 0,
            "savings_goal_pct": 20,
        }
    return profile

@api_router.put("/profile")
async def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["id"],
        "display_name": body.display_name,
        "monthly_income": float(body.monthly_income),
        "savings_goal_pct": float(body.savings_goal_pct),
    }
    await db.profiles.update_one(
        {"user_id": user["id"]},
        {"$set": doc},
        upsert=True,
    )
    return doc

# --- Health ---
@api_router.get("/")
async def root():
    return {"message": "FinançasPro API"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Startup ---
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.transactions.create_index([("user_id", 1), ("date", -1)])
    await db.goals.create_index([("user_id", 1)])
    await db.login_attempts.create_index("identifier")
    await db.bills.create_index([("user_id", 1)])
    await db.bill_payments.create_index([("user_id", 1), ("month", 1)])
    await db.installments.create_index([("user_id", 1)])
    await db.profiles.create_index("user_id", unique=True)
    # Admin seed
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@financaspro.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin user seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

@app.on_event("shutdown")
async def shutdown():
    client.close()
