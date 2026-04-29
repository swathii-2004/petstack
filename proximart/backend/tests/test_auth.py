import pytest
from app.utils.encryption import decrypt

@pytest.fixture(autouse=True)
def mock_cloudinary(monkeypatch):
    async def mock_upload(*args, **kwargs):
        return "https://res.cloudinary.com/demo/image/upload/sample.jpg"
    
    monkeypatch.setattr("app.services.auth_service.upload_to_cloudinary", mock_upload)

@pytest.mark.asyncio
async def test_signup_user(client, test_db):
    response = await client.post(
        "/auth/signup",
        json={
            "role": "user",
            "name": "Test User",
            "email": "test@user.com",
            "password": "password123",
            "phone": "1234567890"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@user.com"
    assert data["user"]["role"] == "user"
    assert data["user"]["status"] == "active"
    
    # Verify DB encryption
    user = await test_db.users.find_one({"email": "test@user.com"})
    assert user["phone"] != "1234567890"
    assert decrypt(user["phone"]) == "1234567890"

@pytest.mark.asyncio
async def test_signup_user_duplicate_email(client):
    response = await client.post(
        "/auth/signup",
        json={
            "role": "user",
            "name": "Test User 2",
            "email": "test@user.com", # already created in previous test
            "password": "password123",
            "phone": "0987654321"
        }
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_signup_vendor(client, test_db):
    # Form data for multipart request
    form_data = {
        "role": "vendor",
        "name": "Test Vendor",
        "email": "vendor@test.com",
        "password": "password123",
        "phone": "9876543210",
        "store_name": "Vendor Store",
        "gst_number": "GST12345",
        "city": "Test City"
    }
    
    # We need to simulate a file upload
    files = {"files": ("test.pdf", b"dummy content", "application/pdf")}
    
    response = await client.post("/auth/signup", data=form_data, files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "vendor"
    assert data["user"]["status"] == "pending"
    
    # Verify DB encryption
    vendor_profile = await test_db.vendor_profiles.find_one({"user_id": data["user"]["id"]})
    assert vendor_profile["gst_number"] != "GST12345"
    assert decrypt(vendor_profile["gst_number"]) == "GST12345"

@pytest.mark.asyncio
async def test_login_success(client):
    response = await client.post(
        "/auth/login",
        json={"email": "test@user.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    # Check if refresh token is in cookies
    assert "refresh_token" in response.cookies

@pytest.mark.asyncio
async def test_login_wrong_password(client):
    response = await client.post(
        "/auth/login",
        json={"email": "test@user.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_login_pending_vendor(client):
    response = await client.post(
        "/auth/login",
        json={"email": "vendor@test.com", "password": "password123"}
    )
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_refresh_token(client):
    # Login to get refresh token cookie
    login_res = await client.post(
        "/auth/login",
        json={"email": "test@user.com", "password": "password123"}
    )
    refresh_token = login_res.cookies.get("refresh_token")
    
    # Use refresh token cookie to get new access token
    response = await client.post("/auth/refresh", cookies={"refresh_token": refresh_token})
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_logout(client):
    response = await client.post("/auth/logout")
    assert response.status_code == 200
    # Cookie should be cleared
    assert not response.cookies.get("refresh_token")

@pytest.mark.asyncio
async def test_get_me_valid_token(client):
    login_res = await client.post(
        "/auth/login",
        json={"email": "test@user.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    
    response = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@user.com"
    # phone is decrypted before returning
    assert data["phone"] == "1234567890"

@pytest.mark.asyncio
async def test_get_me_no_token(client):
    response = await client.get("/users/me")
    assert response.status_code == 401
