"""LOGILINK GLOBAL - Backend E2E test suite
Tests: Auth/RBAC, Public endpoints, Stats aggregation, Parcel lifecycle/history.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://package-tracker-eu.preview.emergentagent.com").rstrip("/")


# ------- Fixtures -------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "admin", "password": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "admin"
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    return data["access_token"]


@pytest.fixture(scope="session")
def operator_token():
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "operateur", "password": "op123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert r.status_code == 200, f"Operator login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["role"] == "operator"
    return data["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def operator_headers(operator_token):
    return {"Authorization": f"Bearer {operator_token}"}


@pytest.fixture(scope="session")
def sample_tracking_id(admin_headers):
    r = requests.get(f"{BASE_URL}/api/parcels", headers=admin_headers)
    assert r.status_code == 200
    parcels = r.json()
    assert len(parcels) > 0
    return parcels[0]["tracking_id"]


# ------- AUTH tests -------
class TestAuth:
    def test_login_admin_success(self, admin_token):
        assert admin_token is not None

    def test_login_operator_success(self, operator_token):
        assert operator_token is not None

    def test_login_wrong_password(self):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            data={"username": "admin", "password": "wrong"},
        )
        assert r.status_code == 400


# ------- Protected endpoints require token -------
class TestProtectedRoutes:
    def test_parcels_list_401_without_token(self):
        r = requests.get(f"{BASE_URL}/api/parcels")
        assert r.status_code == 401

    def test_stats_401_without_token(self):
        r = requests.get(f"{BASE_URL}/api/stats")
        assert r.status_code == 401

    def test_users_401_without_token(self):
        r = requests.get(f"{BASE_URL}/api/users")
        assert r.status_code == 401

    def test_audit_401_without_token(self):
        r = requests.get(f"{BASE_URL}/api/audit")
        assert r.status_code == 401

    def test_parcels_200_with_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/parcels", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_stats_200_with_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/stats", headers=admin_headers)
        assert r.status_code == 200

    def test_users_200_with_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/users", headers=admin_headers)
        assert r.status_code == 200

    def test_audit_200_with_admin(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/audit", headers=admin_headers)
        assert r.status_code == 200


# ------- RBAC role enforcement -------
class TestRBAC:
    def test_operator_can_access_parcels(self, operator_headers):
        r = requests.get(f"{BASE_URL}/api/parcels", headers=operator_headers)
        assert r.status_code == 200

    def test_operator_can_access_stats(self, operator_headers):
        r = requests.get(f"{BASE_URL}/api/stats", headers=operator_headers)
        assert r.status_code == 200

    def test_operator_forbidden_from_users(self, operator_headers):
        r = requests.get(f"{BASE_URL}/api/users", headers=operator_headers)
        assert r.status_code == 403

    def test_operator_forbidden_from_audit(self, operator_headers):
        r = requests.get(f"{BASE_URL}/api/audit", headers=operator_headers)
        assert r.status_code == 403


# ------- PUBLIC endpoints -------
class TestPublicEndpoints:
    def test_public_create_parcel_no_token(self):
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "TEST_Public_Sender", "phone": "+3312345", "city": "Lodi"},
            "receiver": {"name": "TEST_Public_Receiver", "phone": "+23799999", "city": "Douala"},
            "content_description": "TEST public parcel",
            "departure_date": "2026-02-01",
        }
        r = requests.post(f"{BASE_URL}/api/parcels", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["tracking_id"].startswith("LOGI-")
        assert data["status"] == "REGISTERED"
        assert len(data["history"]) == 1
        assert data["history"][0]["status"] == "REGISTERED"

    def test_public_get_parcel_no_token(self, sample_tracking_id):
        r = requests.get(f"{BASE_URL}/api/parcels/{sample_tracking_id}")
        assert r.status_code == 200
        assert r.json()["tracking_id"] == sample_tracking_id

    def test_public_pdf_no_token(self, sample_tracking_id):
        r = requests.get(f"{BASE_URL}/api/parcels/{sample_tracking_id}/pdf")
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert len(r.content) > 500

    def test_public_get_invalid_id(self):
        r = requests.get(f"{BASE_URL}/api/parcels/LOGI-XXXXXX")
        assert r.status_code == 404


# ------- Stats -------
class TestStats:
    def test_stats_shape(self, admin_headers):
        r = requests.get(f"{BASE_URL}/api/stats", headers=admin_headers)
        assert r.status_code == 200
        s = r.json()
        for k in [
            "total", "revenue_collected", "revenue_pending", "total_weight", "total_volume",
            "clients", "senders", "receivers", "direction_counts", "success_rate",
            "avg_delivery_days", "daily_activity", "monthly_activity", "status_counts",
        ]:
            assert k in s, f"Missing stats key: {k}"
        assert len(s["daily_activity"]) == 14
        # 17 statuses (14 STATUS_FLOW + 3 EXCEPTION)
        assert len(s["status_counts"]) == 17
        assert "EU_TO_CM" in s["direction_counts"]
        assert "CM_TO_EU" in s["direction_counts"]


# ------- Parcel lifecycle -------
class TestParcelLifecycle:
    def test_status_update_appends_history(self, admin_headers):
        # Create a parcel to update
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "TEST_Life_Sender", "phone": "+331", "city": "Lodi"},
            "receiver": {"name": "TEST_Life_Recv", "phone": "+237", "city": "Douala"},
            "content_description": "TEST lifecycle",
            "departure_date": "2026-02-05",
        }
        create = requests.post(f"{BASE_URL}/api/parcels", json=payload)
        assert create.status_code == 200
        tid = create.json()["tracking_id"]
        initial_hist_len = len(create.json()["history"])

        # PATCH status
        r = requests.patch(
            f"{BASE_URL}/api/parcels/{tid}/status",
            params={"status": "IN_TRANSIT"},
            headers=admin_headers,
        )
        assert r.status_code == 200

        # GET to verify persistence
        got = requests.get(f"{BASE_URL}/api/parcels/{tid}")
        assert got.status_code == 200
        data = got.json()
        assert data["status"] == "IN_TRANSIT"
        assert len(data["history"]) == initial_hist_len + 1
        last = data["history"][-1]
        assert last["status"] == "IN_TRANSIT"
        assert last["author"]  # non-empty
        assert last["timestamp"]

    def test_patch_updates_fields_and_appends_history_on_status_change(self, admin_headers):
        payload = {
            "direction": "CM_TO_EU",
            "sender": {"name": "TEST_Patch_Sender", "phone": "+237", "city": "Douala"},
            "receiver": {"name": "TEST_Patch_Recv", "phone": "+39", "city": "Lodi"},
            "content_description": "TEST patch fields",
            "departure_date": "2026-02-10",
        }
        create = requests.post(f"{BASE_URL}/api/parcels", json=payload)
        tid = create.json()["tracking_id"]
        prev_len = len(create.json()["history"])

        r = requests.patch(
            f"{BASE_URL}/api/parcels/{tid}",
            json={"weight_kg": 12.5, "final_price": 99.9, "status": "WEIGHED"},
            headers=admin_headers,
        )
        assert r.status_code == 200

        got = requests.get(f"{BASE_URL}/api/parcels/{tid}").json()
        assert got["weight_kg"] == 12.5
        assert got["final_price"] == 99.9
        assert got["status"] == "WEIGHED"
        assert len(got["history"]) == prev_len + 1

    def test_patch_status_no_change_no_history(self, admin_headers):
        # if same status re-sent, no new history entry
        payload = {
            "direction": "EU_TO_CM",
            "sender": {"name": "TEST_NoChg", "phone": "+33", "city": "Paris"},
            "receiver": {"name": "TEST_NoChgR", "phone": "+237", "city": "Douala"},
            "content_description": "TEST no change",
            "departure_date": "2026-02-11",
        }
        create = requests.post(f"{BASE_URL}/api/parcels", json=payload)
        tid = create.json()["tracking_id"]
        prev_len = len(create.json()["history"])
        # Same status via PATCH body
        r = requests.patch(
            f"{BASE_URL}/api/parcels/{tid}",
            json={"status": "REGISTERED"},
            headers=admin_headers,
        )
        assert r.status_code == 200
        got = requests.get(f"{BASE_URL}/api/parcels/{tid}").json()
        assert len(got["history"]) == prev_len  # unchanged


# ------- User creation (admin only) -------
class TestUserCreate:
    def test_admin_can_create_user(self, admin_headers):
        import time
        uname = f"TEST_user_{int(time.time())}"
        r = requests.post(
            f"{BASE_URL}/api/users",
            json={"username": uname, "full_name": "TEST User", "role": "operator", "password": "test123"},
            headers=admin_headers,
        )
        assert r.status_code == 200
        # verify listable
        lst = requests.get(f"{BASE_URL}/api/users", headers=admin_headers).json()
        assert any(u["username"] == uname for u in lst)

    def test_operator_forbidden_from_create_user(self, operator_headers):
        r = requests.post(
            f"{BASE_URL}/api/users",
            json={"username": "TEST_should_fail", "full_name": "X", "role": "operator", "password": "x"},
            headers=operator_headers,
        )
        assert r.status_code == 403
