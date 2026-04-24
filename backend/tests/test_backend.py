import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://dev-platform-101.preview.emergentagent.com").rstrip("/")
# Read backend frontend .env if needed
try:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
except Exception:
    pass

API = f"{BASE_URL}/api"


def _s():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _rand_email(prefix="test"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:8]}@x.com"


# ------------------- Health -------------------
def test_root_health():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "FinançasPro" in r.json().get("message", "")


# ------------------- Admin seed -------------------
def test_admin_seed_login():
    s = _s()
    r = s.post(f"{API}/auth/login", json={"email": "admin@financaspro.com", "password": "admin123"})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == "admin@financaspro.com"
    assert data["role"] == "admin"
    # cookies set
    assert "access_token" in s.cookies
    assert "refresh_token" in s.cookies


# ------------------- Register / Login / Me / Logout -------------------
class TestAuthFlow:
    def setup_method(self):
        self.s = _s()
        self.email = _rand_email("flow")
        self.password = "123456"

    def test_register_sets_cookies_and_returns_user(self):
        r = self.s.post(f"{API}/auth/register", json={"email": self.email, "password": self.password})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["email"] == self.email.lower()
        assert data["role"] == "user"
        assert "id" in data
        assert "access_token" in self.s.cookies
        assert "refresh_token" in self.s.cookies

    def test_register_duplicate_email_returns_400(self):
        self.s.post(f"{API}/auth/register", json={"email": self.email, "password": self.password})
        r = self.s.post(f"{API}/auth/register", json={"email": self.email, "password": self.password})
        assert r.status_code == 400

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_returns_user_when_authenticated(self):
        self.s.post(f"{API}/auth/register", json={"email": self.email, "password": self.password})
        r = self.s.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["email"] == self.email.lower()

    def test_login_wrong_password_401(self):
        self.s.post(f"{API}/auth/register", json={"email": self.email, "password": self.password})
        r = self.s.post(f"{API}/auth/login", json={"email": self.email, "password": "wrongpass"})
        assert r.status_code == 401

    def test_logout_clears_cookies(self):
        self.s.post(f"{API}/auth/register", json={"email": self.email, "password": self.password})
        r = self.s.post(f"{API}/auth/logout")
        assert r.status_code == 200
        # After logout, /me should be unauthorized
        r2 = self.s.get(f"{API}/auth/me")
        assert r2.status_code == 401


# ------------------- Validation -------------------
class TestValidation:
    def test_invalid_email_format(self):
        r = requests.post(f"{API}/auth/register", json={"email": "not-an-email", "password": "123456"})
        assert r.status_code == 422

    def test_password_too_short(self):
        r = requests.post(f"{API}/auth/register", json={"email": _rand_email("short"), "password": "123"})
        assert r.status_code == 422

    def test_transaction_value_must_be_positive(self):
        s = _s()
        email = _rand_email("val")
        s.post(f"{API}/auth/register", json={"email": email, "password": "123456"})
        r = s.post(f"{API}/transactions", json={
            "type": "receita", "description": "X", "value": 0, "category": "Salário", "date": "2026-01-15"
        })
        assert r.status_code == 422


# ------------------- Transactions CRUD -------------------
class TestTransactions:
    def setup_method(self):
        self.s = _s()
        self.email = _rand_email("tx")
        self.s.post(f"{API}/auth/register", json={"email": self.email, "password": "123456"})

    def test_create_list_delete(self):
        payload = {"type": "receita", "description": "Salário", "value": 5000, "category": "Salário", "date": "2026-01-15"}
        r = self.s.post(f"{API}/transactions", json=payload)
        assert r.status_code == 200, r.text
        tx = r.json()
        assert tx["description"] == "Salário"
        assert tx["value"] == 5000
        assert "_id" not in tx
        tx_id = tx["id"]

        r2 = self.s.get(f"{API}/transactions")
        assert r2.status_code == 200
        items = r2.json()
        assert any(t["id"] == tx_id for t in items)

        # Sorted by date desc check with a second tx
        self.s.post(f"{API}/transactions", json={**payload, "date": "2026-02-10", "description": "B"})
        items2 = self.s.get(f"{API}/transactions").json()
        dates = [t["date"] for t in items2]
        assert dates == sorted(dates, reverse=True)

        # Delete
        r3 = self.s.delete(f"{API}/transactions/{tx_id}")
        assert r3.status_code == 200
        # Verify gone
        items3 = self.s.get(f"{API}/transactions").json()
        assert not any(t["id"] == tx_id for t in items3)


# ------------------- Goals CRUD + deposit -------------------
class TestGoals:
    def setup_method(self):
        self.s = _s()
        self.email = _rand_email("goal")
        self.s.post(f"{API}/auth/register", json={"email": self.email, "password": "123456"})

    def test_create_deposit_delete(self):
        r = self.s.post(f"{API}/goals", json={"name": "Viagem", "emoji": "✈️", "target": 5000, "saved": 500, "deadline": "2026-06-30"})
        assert r.status_code == 200, r.text
        g = r.json()
        gid = g["id"]
        assert g["saved"] == 500

        r2 = self.s.put(f"{API}/goals/{gid}/deposit", json={"amount": 250})
        assert r2.status_code == 200
        assert r2.json()["saved"] == 750

        # Verify via GET
        goals = self.s.get(f"{API}/goals").json()
        assert any(x["id"] == gid and x["saved"] == 750 for x in goals)

        r3 = self.s.delete(f"{API}/goals/{gid}")
        assert r3.status_code == 200

        # Delete again → 404
        r4 = self.s.delete(f"{API}/goals/{gid}")
        assert r4.status_code == 404


# ------------------- Row-level security -------------------
class TestRLS:
    def test_user_a_cannot_access_user_b_data(self):
        sa, sb = _s(), _s()
        ea, eb = _rand_email("rlsa"), _rand_email("rlsb")
        sa.post(f"{API}/auth/register", json={"email": ea, "password": "123456"})
        sb.post(f"{API}/auth/register", json={"email": eb, "password": "123456"})

        # A creates a transaction and goal
        tx = sa.post(f"{API}/transactions", json={"type": "despesa", "description": "A-tx", "value": 10, "category": "c", "date": "2026-01-01"}).json()
        goal = sa.post(f"{API}/goals", json={"name": "A-goal", "emoji": "🎯", "target": 100, "saved": 0, "deadline": "2026-12-31"}).json()

        # B's listings should not contain A's data
        b_tx = sb.get(f"{API}/transactions").json()
        assert not any(t["id"] == tx["id"] for t in b_tx)
        b_goals = sb.get(f"{API}/goals").json()
        assert not any(g["id"] == goal["id"] for g in b_goals)

        # B tries to delete A's transaction and goal → 404
        assert sb.delete(f"{API}/transactions/{tx['id']}").status_code == 404
        assert sb.delete(f"{API}/goals/{goal['id']}").status_code == 404
        assert sb.put(f"{API}/goals/{goal['id']}/deposit", json={"amount": 10}).status_code == 404

        # A's data still intact
        a_tx = sa.get(f"{API}/transactions").json()
        assert any(t["id"] == tx["id"] for t in a_tx)


# ------------------- Brute force -------------------
def test_brute_force_lockout():
    # Fresh email to avoid previous counters
    email = _rand_email("bf")
    s = _s()
    s.post(f"{API}/auth/register", json={"email": email, "password": "123456"})
    # logout to clear cookies for pure login testing
    s.cookies.clear()

    # 5 failed attempts
    for i in range(5):
        r = s.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
        assert r.status_code == 401, f"attempt {i}: {r.status_code}"

    # 6th should be 429 with Portuguese message
    r = s.post(f"{API}/auth/login", json={"email": email, "password": "wrong"})
    assert r.status_code == 429, r.text
    assert "Muitas tentativas" in r.json().get("detail", "")

    # Even correct password should be locked
    r2 = s.post(f"{API}/auth/login", json={"email": email, "password": "123456"})
    assert r2.status_code == 429
