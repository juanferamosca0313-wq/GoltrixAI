import pytest
import requests
import os

# Use the public URL that frontend uses
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', os.environ.get('EXPO_PACKAGER_HOSTNAME', 'https://shot-analyzer-pro-1.preview.emergentagent.com')).rstrip('/')

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_user_data():
    """Test user credentials"""
    return {
        "email": "test@test.com",
        "password": "test123",
        "name": "Test User"
    }

@pytest.fixture
def new_user_data():
    """New test user for registration"""
    import uuid
    return {
        "email": f"TEST_user_{uuid.uuid4().hex[:8]}@test.com",
        "password": "pass123",
        "name": "Test Player"
    }
