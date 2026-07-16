"""LOGILINK GLOBAL - Backend E2E test suite (Phase 1 + Phase 2)
Phase 1: Auth/RBAC, Public endpoints, Stats, Parcel lifecycle/history, User CRUD (admin)
Phase 2: Agencies, Settings/pricing, Clients (derived), Invoices (create/pay/pdf),
        E-commerce integration (API keys + X-API-Key protected shipments), Agency scoping.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://package-tracker-eu.preview.emergentagent.com",
).rstrip("/")


# ---------- Fixtures ----------
def _login(username, password):
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": username, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, f"Login failed {username}: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def admin_token():
    return _login("admin", "admin123")["access_token"]


@pytest.fixture(scope="session")
def operator_token():
    return _login("operateur", "op123")["access_token"]


@pytest.fixture(scope="session")
def supervisor_token():
    return _login("superviseur", "super123")["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def operator_headers(operator_token):
    return {"Authorization": f"Bearer {operator_token}"}


@pytest.fixture(scope="session")
def supervisor_headers(supervisor_token):
    return {"Authorization": f"Bearer {supervisor_token}"}


@pytest.fixture(scope="session")
def sample_tracking_id(admin_headers):
    r = requests.get(f"{BASE_URL}/api/parcels", headers=admin_headers)
    assert r.status_code == 200
    parcels = r.json()
    assert len(parcels) > 0
    return parcels[0]["tracking_id"]


@pytest.fixture(scope="session")
def weighted_parcel_id(admin_headers):
    """Find any parcel with weight_kg > 0 that has NO invoice yet."""
    parcels = requests.get(f"{BASE_URL}/api/parcels", headers=admin_headers).json()
    invoices = requests.get(f"{BASE_URL}/api/invoices", headers=admin_headers).json()
    invoiced_ids = {i["tracking_id"] for i in invoices}
    for p in parcels:
        if (p.get("weight_kg") or 0) > 0 and p["tracking_id"] not in invoiced_ids:
            return p["tracking_id"]
    # If none available, create a fresh one
    payload = {
        "direction": "EU_TO_CM",
        "sender": {"name": "TEST_Invoice_Sender", "phone": "+3311111", "city": "Lodi"},
        "receiver": {"name": "TEST_Invoice_Recv", "phone": "+237600001", "city": "Douala"},
        "content_description": "TEST invoice source",
        "weight_kg": 5.5,
        "departure_date": "2026-03-01",
    }
    r = requests.post(f"{BASE_URL}/api/parcels", json=payload)
    assert r.status_code == 200
    tid = r.json()["tracking_id"]
    # bump weight via admin patch (ensures >0)
    requests.patch(
        f"{BASE_URL}/api/parcels/{tid}",
        json={"weight_kg": 5.5},
        headers=admin_headers,
    )
    return tid


# ---------- AUTH ----------
class TestAuth:
    def test_login_admin_success(self, admin_token):
        assert admin_token

    def test_login_operator_success(self, operator_token):
        assert operator_token

    def test_login_supervisor_success(self, supervisor_token):
        assert supervisor_token

    def test_login_wrong_password(self):
        r = requests.post(f"{BASE_URL}/api/auth/login", data={"username": "admin", "password": "wrong"})
        assert r.status_code == 400


# ---------- Protected + RBAC ----------
class TestProtectedRoutes:
    def test_parcels_401_without_token(self):
        assert requests.get(f"{BASE_URL}/api/parcels").status_code == 401

    def test_stats_401_without_token(self):
        assert requests.get(f"{BASE_URL}/api/stats").status_code == 401

    def test_users_401_without_token(self):
        assert requests.get(f"{BASE_URL}/api/users").status_code == 401

    def test_audit_401_without_token(self):
        assert requests.get(f"{BASE_URL}/api/audit").status_code == 401

    def test_admin_can_access_all(self, admin_headers):
        for p in ("/api/parcels", "/api/stats", "/api/users", "/api/audit", "/api/agencies", "/api/settings", "/api/clients", "/api/invoices", "/api/integrations/keys"):
            r = requests.get(f"{BASE_URL}{p}", headers=admin_headers)
            assert r.status_code == 200, f"{p} -> {r.status_code}"


class TestRBAC:
    def test_operator_forbidden_from_users(self, operator_headers):
        assert requests.get(f"{BASE_URL}/api/users", headers=operator_headers).status_code == 403

    def test_operator_forbidden_from_audit(self, operator_headers):
        assert requests.get(f"{BASE_URL}/api/audit", headers=operator_headers).status_code == 403

    def test_operator_forbidden_from_integration_keys(self, operator_headers):
        assert requests.get(f"{BASE_URL}/api/integrations/keys", headers=operator_headers).status_code == 403

    def test_operator_can_read_settings(self, operator_headers):
        assert requests.get(f"{BASE_URL}/api/settings", headers=operator_headers).status_code == 200


# ---------- Public endpoints ----------
class TestPublicEndpoints:
    def test_public_create_parcel(self):
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "TEST_Public", "phone": "+3312345", "city": "Lodi"},
            "receiver": {"name": "TEST_PublicR", "phone": "+23799999", "city": "Douala"},
            "content_description": "TEST public parcel",
            "departure_date": "2026-02-01",
        }
        r = requests.post(f"{BASE_URL}/api/parcels", json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["tracking_id"].startswith("LOGI-")
        assert d["status"] == "REGISTERED"

    def test_public_pdf(self, sample_tracking_id):
        r = requests.get(f"{BASE_URL}/api/parcels/{sample_tracking_id}/pdf")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")


# ---------- Agencies ----------
class TestAgencies:
    def test_list_seeded_agencies(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/agencies", headers=admin_headers)
        assert r.status_code == 200
        codes = {a["code"] for a in r.json()}
        assert {"AG-LODI", "AG-PARIS", "AG-DOUALA", "AG-YAOUNDE"}.issubset(codes)

    def test_create_and_delete_agency(self, admin_headers):
        code = f"TEST-AG-{int(time.time())}"
        r = requests.post(
            f"{BASE_URL}/api/agencies",
            json={"code": code, "name": "TEST Agency", "country": "Test", "city": "Test"},
            headers=admin_headers,
        )
        assert r.status_code == 200
        codes = {a["code"] for a in requests.get(f"{BASE_URL}/api/agencies", headers=admin_headers).json()}
        assert code in codes
        # cleanup
        assert requests.delete(f"{BASE_URL}/api/agencies/{code}", headers=admin_headers).status_code == 200

    def test_operator_cannot_create_agency(self, operator_headers):
        r = requests.post(
            f"{BASE_URL}/api/agencies",
            json={"code": "TEST-BAD", "name": "N", "country": "C", "city": "C"},
            headers=operator_headers,
        )
        assert r.status_code == 403


# ---------- Settings ----------
class TestSettings:
    def test_read_settings(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/settings", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert "price_per_kg" in d and "EU_TO_CM" in d["price_per_kg"] and "CM_TO_EU" in d["price_per_kg"]
        assert "vat_percent" in d and "currency" in d

    def test_update_settings_persists(self, admin_headers):
        current = requests.get(f"{BASE_URL}/api/settings", headers=admin_headers).json()
        new_body = {
            "price_per_kg": {"EU_TO_CM": 8.5, "CM_TO_EU": 10.5},
            "vat_percent": 5.0,
            "currency": "EUR",
        }
        r = requests.put(f"{BASE_URL}/api/settings", json=new_body, headers=admin_headers)
        assert r.status_code == 200
        got = requests.get(f"{BASE_URL}/api/settings", headers=admin_headers).json()
        assert got["price_per_kg"]["EU_TO_CM"] == 8.5
        assert got["vat_percent"] == 5.0
        # restore
        requests.put(f"{BASE_URL}/api/settings", json={"price_per_kg": current["price_per_kg"], "vat_percent": current.get("vat_percent", 0.0), "currency": current.get("currency", "EUR")}, headers=admin_headers)


# ---------- Clients ----------
class TestClients:
    def test_clients_list_shape(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/clients", headers=admin_headers)
        assert r.status_code == 200
        clients = r.json()
        assert isinstance(clients, list)
        assert len(clients) > 0
        c0 = clients[0]
        for k in ("phone", "parcels", "total_spent", "total_weight"):
            assert k in c0

    def test_client_detail(self, admin_headers):
        clients = requests.get(f"{BASE_URL}/api/clients", headers=admin_headers).json()
        phone = clients[0]["phone"]
        r = requests.get(f"{BASE_URL}/api/clients/{phone}", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["phone"] == phone
        assert isinstance(d["parcels"], list)


# ---------- Invoices ----------
class TestInvoices:
    def test_create_invoice_computes_totals_and_marks_parcel(self, admin_headers, weighted_parcel_id):
        r = requests.post(
            f"{BASE_URL}/api/invoices",
            json={"tracking_id": weighted_parcel_id, "discount_percent": 10},
            headers=admin_headers,
        )
        assert r.status_code == 200, r.text
        inv = r.json()
        assert inv["tracking_id"] == weighted_parcel_id
        assert inv["invoice_number"].startswith("INV-")
        assert inv["status"] == "unpaid"
        assert inv["subtotal"] > 0
        assert inv["discount"] > 0
        assert inv["total"] > 0
        # subtotal - discount + vat == total (allow rounding)
        expected_total = round(inv["subtotal"] - inv["discount"] + inv["vat"], 2)
        assert abs(inv["total"] - expected_total) < 0.02
        # Parcel now INVOICED
        p = requests.get(f"{BASE_URL}/api/parcels/{weighted_parcel_id}").json()
        assert p["status"] == "INVOICED"
        # store for later
        pytest._invoice_number = inv["invoice_number"]
        pytest._invoice_total = inv["total"]
        pytest._invoiced_tid = weighted_parcel_id

    def test_invoice_reject_no_weight(self, admin_headers):
        # Create a parcel with no weight
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "TEST_NoW", "phone": "+339", "city": "Lodi"},
            "receiver": {"name": "TEST_NoWR", "phone": "+2379", "city": "Douala"},
            "content_description": "TEST no weight",
            "departure_date": "2026-02-15",
        }
        tid = requests.post(f"{BASE_URL}/api/parcels", json=payload).json()["tracking_id"]
        r = requests.post(
            f"{BASE_URL}/api/invoices",
            json={"tracking_id": tid},
            headers=admin_headers,
        )
        assert r.status_code == 400

    def test_invoice_duplicate_rejected(self, admin_headers):
        num = getattr(pytest, "_invoice_number", None)
        tid = getattr(pytest, "_invoiced_tid", None)
        assert num and tid
        r = requests.post(f"{BASE_URL}/api/invoices", json={"tracking_id": tid}, headers=admin_headers)
        assert r.status_code == 400

    def test_pay_invoice_marks_paid_and_updates_parcel(self, admin_headers):
        num = getattr(pytest, "_invoice_number", None)
        total = getattr(pytest, "_invoice_total", None)
        tid = getattr(pytest, "_invoiced_tid", None)
        assert num and total and tid
        r = requests.patch(f"{BASE_URL}/api/invoices/{num}/pay?amount={total}", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "paid"
        # Parcel now PAID
        p = requests.get(f"{BASE_URL}/api/parcels/{tid}").json()
        assert p["status"] == "PAID"

    def test_invoice_pdf(self, admin_headers):
        num = getattr(pytest, "_invoice_number", None)
        assert num
        r = requests.get(f"{BASE_URL}/api/invoices/{num}/pdf")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert len(r.content) > 500


# ---------- E-commerce integration ----------
class TestEcomIntegration:
    def test_no_api_key_returns_401(self):
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "Shop", "phone": "+391", "city": "Lodi"},
            "receiver": {"name": "Buyer", "phone": "+2371", "city": "Douala"},
            "content_description": "TEST no key",
            "weight_kg": 2.0,
        }
        r = requests.post(f"{BASE_URL}/api/integrations/shipments", json=payload)
        assert r.status_code == 401

    def test_invalid_api_key_returns_403(self):
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "Shop", "phone": "+391", "city": "Lodi"},
            "receiver": {"name": "Buyer", "phone": "+2371", "city": "Douala"},
            "content_description": "TEST bad key",
            "weight_kg": 2.0,
        }
        r = requests.post(
            f"{BASE_URL}/api/integrations/shipments",
            json=payload,
            headers={"X-API-Key": "sk_live_invalid"},
        )
        assert r.status_code == 403

    def test_create_key_and_create_shipment(self, admin_headers):
        r = requests.post(
            f"{BASE_URL}/api/integrations/keys",
            json={"label": f"TEST_key_{int(time.time())}"},
            headers=admin_headers,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["key"].startswith("sk_live_")
        assert data["active"] is True
        key = data["key"]

        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "TEST_Ecom_Shop", "phone": "+391111", "city": "Lodi"},
            "receiver": {"name": "TEST_Ecom_Buyer", "phone": "+2371111", "city": "Douala"},
            "content_description": "TEST e-commerce order",
            "weight_kg": 3.5,
            "external_order_id": "TEST-ORDER-001",
        }
        r2 = requests.post(
            f"{BASE_URL}/api/integrations/shipments",
            json=payload,
            headers={"X-API-Key": key},
        )
        assert r2.status_code == 200, r2.text
        d = r2.json()
        assert d["tracking_id"].startswith("LOGI-")
        assert d["status"] == "REGISTERED"

        # Verify the parcel is created & tracks correctly
        get = requests.get(f"{BASE_URL}/api/parcels/{d['tracking_id']}").json()
        assert get["source"] == "ecommerce" or get.get("external_order_id") == "TEST-ORDER-001"
        assert get["agency_origin"] == "AG-LODI"
        assert get["agency_destination"] == "AG-DOUALA"

        # Cleanup: revoke
        requests.delete(f"{BASE_URL}/api/integrations/keys/{key}", headers=admin_headers)


# ---------- Agency scoping ----------
class TestAgencyScoping:
    def test_admin_sees_all_parcels(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/parcels", headers=admin_headers)
        assert r.status_code == 200
        pytest._admin_parcel_count = len(r.json())
        assert pytest._admin_parcel_count > 0

    def test_supervisor_douala_sees_only_douala_parcels(self, supervisor_headers, admin_headers):
        r = requests.get(f"{BASE_URL}/api/parcels", headers=supervisor_headers)
        assert r.status_code == 200
        parcels = r.json()
        for p in parcels:
            assert p.get("agency_origin") == "AG-DOUALA" or p.get("agency_destination") == "AG-DOUALA", \
                f"Parcel {p['tracking_id']} outside AG-DOUALA: {p.get('agency_origin')}->{p.get('agency_destination')}"
        # And should be strict subset (not everything admin has, because some parcels only touch YAOUNDE/PARIS<->LODI)
        assert len(parcels) <= pytest._admin_parcel_count

    def test_supervisor_stats_scoped(self, supervisor_headers, admin_headers):
        s = requests.get(f"{BASE_URL}/api/stats", headers=supervisor_headers).json()
        a = requests.get(f"{BASE_URL}/api/stats", headers=admin_headers).json()
        assert s["total"] <= a["total"]


# ---------- Parcel lifecycle regression ----------
class TestParcelLifecycle:
    def test_status_update_appends_history(self, admin_headers):
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "TEST_Life", "phone": "+331", "city": "Lodi"},
            "receiver": {"name": "TEST_LifeR", "phone": "+237", "city": "Douala"},
            "content_description": "TEST lifecycle",
            "departure_date": "2026-02-05",
        }
        tid = requests.post(f"{BASE_URL}/api/parcels", json=payload).json()["tracking_id"]
        r = requests.patch(
            f"{BASE_URL}/api/parcels/{tid}/status",
            params={"status": "IN_TRANSIT"},
            headers=admin_headers,
        )
        assert r.status_code == 200
        got = requests.get(f"{BASE_URL}/api/parcels/{tid}").json()
        assert got["status"] == "IN_TRANSIT"
        assert got["history"][-1]["status"] == "IN_TRANSIT"


# ---------- User creation ----------
class TestUserCreate:
    def test_admin_can_create_user(self, admin_headers):
        uname = f"TEST_user_{int(time.time())}"
        r = requests.post(
            f"{BASE_URL}/api/users",
            json={"username": uname, "full_name": "TEST User", "role": "operator", "password": "test123"},
            headers=admin_headers,
        )
        assert r.status_code == 200
        lst = requests.get(f"{BASE_URL}/api/users", headers=admin_headers).json()
        assert any(u["username"] == uname for u in lst)

    def test_operator_forbidden_from_create_user(self, operator_headers):
        r = requests.post(
            f"{BASE_URL}/api/users",
            json={"username": "TEST_fail", "full_name": "X", "role": "operator", "password": "x"},
            headers=operator_headers,
        )
        assert r.status_code == 403
