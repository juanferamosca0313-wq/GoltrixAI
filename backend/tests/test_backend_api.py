import pytest
import requests
import os

# Use the public URL that frontend uses
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', os.environ.get('EXPO_PACKAGER_HOSTNAME', 'https://shot-analyzer-pro-1.preview.emergentagent.com')).rstrip('/')

class TestHealth:
    """Health check endpoint"""
    
    def test_health_check(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"
        print("✓ Health check passed")


class TestAuth:
    """Authentication endpoints"""
    
    def test_login_existing_user(self, api_client, test_user_data):
        """Test login with existing user test@test.com"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "user" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == test_user_data["email"]
        print(f"✓ Login successful for {test_user_data['email']}")
    
    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid login correctly rejected")
    
    def test_register_new_user(self, api_client, new_user_data):
        """Test user registration with new user"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=new_user_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert "user" in data
        assert data["user"]["email"] == new_user_data["email"]
        assert data["user"]["name"] == new_user_data["name"]
        assert data["user"]["language"] == "es"  # Default language
        print(f"✓ Registration successful for {new_user_data['email']}")
        
        # Verify user can login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": new_user_data["email"],
            "password": new_user_data["password"]
        })
        assert login_response.status_code == 200
        print("✓ New user can login successfully")
    
    def test_register_duplicate_email(self, api_client, test_user_data):
        """Test registration with already registered email"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=test_user_data)
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print("✓ Duplicate email registration correctly rejected")
    
    def test_get_user_info(self, api_client, test_user_data):
        """Test GET /api/auth/me with Bearer token"""
        # First login to get token
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get user info
        headers = {"Authorization": f"Bearer {token}"}
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert "language" in data
        assert data["email"] == test_user_data["email"]
        assert "password" not in data
        assert "password_hash" not in data
        print("✓ Get user info successful")
    
    def test_get_user_info_no_token(self, api_client):
        """Test GET /api/auth/me without token"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 403  # HTTPBearer returns 403 for missing auth
        print("✓ No token correctly rejected")
    
    def test_update_language(self, api_client, test_user_data):
        """Test PUT /api/auth/language"""
        # Login to get token
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user_data["email"],
            "password": test_user_data["password"]
        })
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Update to English
        response = api_client.put(f"{BASE_URL}/api/auth/language", 
                                  json={"language": "en"}, 
                                  headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "en"
        
        # Verify language was updated
        me_response = api_client.get(f"{BASE_URL}/api/auth/me", headers=headers)
        me_data = me_response.json()
        assert me_data["language"] == "en"
        print("✓ Language update successful")
        
        # Update back to Spanish
        response = api_client.put(f"{BASE_URL}/api/auth/language", 
                                  json={"language": "es"}, 
                                  headers=headers)
        assert response.status_code == 200
        print("✓ Language update back to Spanish successful")


class TestAnalyses:
    """Analyses endpoints"""
    
    def test_get_analyses_empty_for_new_user(self, api_client, new_user_data):
        """Test GET /api/analyses returns empty list for new user"""
        # Register new user
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json=new_user_data)
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get analyses
        response = api_client.get(f"{BASE_URL}/api/analyses", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        print("✓ New user has empty analyses list")
    
    def test_get_analyses_requires_auth(self, api_client):
        """Test GET /api/analyses without token"""
        response = api_client.get(f"{BASE_URL}/api/analyses")
        assert response.status_code == 403
        print("✓ Analyses endpoint requires authentication")


class TestProgress:
    """Progress endpoint"""
    
    def test_get_progress_zero_for_new_user(self, api_client, new_user_data):
        """Test GET /api/progress shows 0 for new user"""
        # Register new user
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json=new_user_data)
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get progress
        response = api_client.get(f"{BASE_URL}/api/progress", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "total_analyses" in data
        assert "average_score" in data
        assert "best_score" in data
        assert "recent_scores" in data
        assert "technique_averages" in data
        assert "improvement" in data
        
        assert data["total_analyses"] == 0
        assert data["average_score"] == 0
        assert data["best_score"] == 0
        assert len(data["recent_scores"]) == 0
        print("✓ New user has zero progress")
    
    def test_get_progress_requires_auth(self, api_client):
        """Test GET /api/progress without token"""
        response = api_client.get(f"{BASE_URL}/api/progress")
        assert response.status_code == 403
        print("✓ Progress endpoint requires authentication")


class TestTips:
    """Tips endpoint"""
    
    def test_get_tips_default_for_new_user(self, api_client, new_user_data):
        """Test GET /api/tips shows default tips for new user"""
        # Register new user
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json=new_user_data)
        token = reg_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get tips
        response = api_client.get(f"{BASE_URL}/api/tips", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "personalized_tips" in data
        assert "personalized_exercises" in data
        assert "weak_areas" in data
        
        assert isinstance(data["personalized_tips"], list)
        assert len(data["personalized_tips"]) > 0
        assert isinstance(data["personalized_exercises"], list)
        assert len(data["personalized_exercises"]) > 0
        assert isinstance(data["weak_areas"], list)
        assert len(data["weak_areas"]) == 0  # No analyses yet
        print("✓ New user gets default tips")
    
    def test_get_tips_requires_auth(self, api_client):
        """Test GET /api/tips without token"""
        response = api_client.get(f"{BASE_URL}/api/tips")
        assert response.status_code == 403
        print("✓ Tips endpoint requires authentication")
