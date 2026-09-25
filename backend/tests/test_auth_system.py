"""
Test suite for Cross Crafted Authentication System
Tests: Login, Register with faith questions, Forgot Password, Admin Approvals
"""
import pytest
import requests
import os
import time
import random
import string

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from auth_testing.md
ADMIN_EMAIL = "admin@crosscrafted.com"
ADMIN_PASSWORD = "Admin@123"

def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health check passed")


class TestAdminLogin:
    """Admin login tests"""
    
    def test_admin_login_success(self):
        """Test admin can login with correct credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data.get("email") == ADMIN_EMAIL
        assert data.get("role") == "admin"
        assert data.get("status") == "active"
        print(f"✓ Admin login successful: {data.get('name')}")
    
    def test_login_invalid_credentials(self):
        """Test login fails with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "WrongPassword123"}
        )
        assert response.status_code == 401
        data = response.json()
        assert "Invalid credentials" in data.get("detail", "")
        print("✓ Invalid credentials rejected correctly")
    
    def test_login_nonexistent_user(self):
        """Test login fails for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "nonexistent@test.com", "password": "Test@123"}
        )
        assert response.status_code == 401
        print("✓ Non-existent user rejected correctly")


class TestRegistrationWithFaithQuestions:
    """Test registration flow with faith questions"""
    
    def test_register_new_user_with_faith_fields(self):
        """Test new user registration with faith_belief, faith_journey, church_member"""
        unique_id = random_string()
        test_email = f"TEST_faith_{unique_id}@test.com"
        test_username = f"test_faith_{unique_id}"
        
        payload = {
            "email": test_email,
            "password": "Test@123",
            "name": "Test Faith User",
            "username": test_username,
            "role": "user",
            "state": "Karnataka",
            "city": "Bangalore",
            "languages": ["English", "Hindi"],
            "faith_belief": "yes",
            "faith_journey": "christian",
            "church_member": "yes"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        # Verify user is created with pending_approval status
        assert data.get("status") == "pending_approval", f"Expected pending_approval, got {data.get('status')}"
        assert data.get("email") == test_email.lower()
        assert data.get("faith_belief") == "yes"
        assert data.get("faith_journey") == "christian"
        assert data.get("church_member") == "yes"
        assert data.get("state") == "Karnataka"
        assert data.get("city") == "Bangalore"
        
        print(f"✓ User registered with pending_approval status: {test_email}")
        print(f"  Faith fields: belief={data.get('faith_belief')}, journey={data.get('faith_journey')}, church={data.get('church_member')}")
        
        # Store user_id for cleanup
        return data.get("_id")
    
    def test_register_exploring_faith(self):
        """Test registration with 'exploring' faith options"""
        unique_id = random_string()
        test_email = f"TEST_exploring_{unique_id}@test.com"
        
        payload = {
            "email": test_email,
            "password": "Test@123",
            "name": "Exploring User",
            "username": f"exploring_{unique_id}",
            "faith_belief": "exploring",
            "faith_journey": "exploring_christianity",
            "church_member": "looking_for_one",
            "state": "Maharashtra",
            "city": "Mumbai",
            "languages": ["English"]
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("status") == "pending_approval"
        assert data.get("faith_belief") == "exploring"
        assert data.get("faith_journey") == "exploring_christianity"
        assert data.get("church_member") == "looking_for_one"
        
        print(f"✓ Exploring user registered: {test_email}")
    
    def test_register_duplicate_email_rejected(self):
        """Test duplicate email is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": ADMIN_EMAIL,  # Already exists
                "password": "Test@123",
                "name": "Duplicate",
                "username": f"dup_{random_string()}",
                "faith_belief": "yes",
                "faith_journey": "christian",
                "church_member": "yes",
                "state": "Karnataka",
                "city": "Bangalore",
                "languages": ["English"]
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
        print("✓ Duplicate email rejected correctly")


class TestAdminPendingUsers:
    """Test admin pending users endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        """Get admin session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, "Admin login failed"
        return session
    
    def test_get_pending_users(self, admin_session):
        """Test GET /api/admin/pending-users returns pending users with faith fields"""
        response = admin_session.get(f"{BASE_URL}/api/admin/pending-users")
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        
        print(f"✓ Found {len(data)} pending users")
        
        # Check that pending users have faith fields
        for user in data[:3]:  # Check first 3
            assert user.get("status") == "pending_approval"
            print(f"  - {user.get('email')}: belief={user.get('faith_belief')}, journey={user.get('faith_journey')}")
    
    def test_approve_user(self, admin_session):
        """Test approving a user sets status to 'active'"""
        # First create a test user
        unique_id = random_string()
        test_email = f"TEST_approve_{unique_id}@test.com"
        
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "Test@123",
                "name": "To Approve",
                "username": f"approve_{unique_id}",
                "faith_belief": "yes",
                "faith_journey": "christian",
                "church_member": "yes",
                "state": "Karnataka",
                "city": "Bangalore",
                "languages": ["English"]
            }
        )
        assert reg_response.status_code == 200
        user_id = reg_response.json().get("_id")
        
        # Now approve the user
        approve_response = admin_session.put(
            f"{BASE_URL}/api/admin/users/{user_id}/status",
            json={"status": "active"}
        )
        assert approve_response.status_code == 200, f"Approve failed: {approve_response.text}"
        
        # Verify user is no longer in pending list
        pending_response = admin_session.get(f"{BASE_URL}/api/admin/pending-users")
        pending_users = pending_response.json()
        pending_ids = [u.get("_id") for u in pending_users]
        assert user_id not in pending_ids, "User still in pending list after approval"
        
        print(f"✓ User {test_email} approved successfully")
        
        # Cleanup - delete the test user
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
    
    def test_reject_user(self, admin_session):
        """Test rejecting a user sets status to 'rejected'"""
        unique_id = random_string()
        test_email = f"TEST_reject_{unique_id}@test.com"
        
        reg_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "Test@123",
                "name": "To Reject",
                "username": f"reject_{unique_id}",
                "faith_belief": "not_sure",
                "faith_journey": "other",
                "church_member": "no",
                "state": "Delhi",
                "city": "New Delhi",
                "languages": ["Hindi"]
            }
        )
        assert reg_response.status_code == 200
        user_id = reg_response.json().get("_id")
        
        # Reject the user
        reject_response = admin_session.put(
            f"{BASE_URL}/api/admin/users/{user_id}/status",
            json={"status": "rejected"}
        )
        assert reject_response.status_code == 200
        
        print(f"✓ User {test_email} rejected successfully")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")


class TestForgotPassword:
    """Test forgot password flow"""
    
    def test_forgot_password_existing_email(self):
        """Test forgot password with existing email returns success message"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": ADMIN_EMAIL}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "reset link" in data.get("message", "").lower() or "email" in data.get("message", "").lower()
        print("✓ Forgot password request accepted for existing email")
    
    def test_forgot_password_nonexistent_email(self):
        """Test forgot password with non-existent email still returns success (security)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/forgot-password",
            json={"email": "nonexistent@test.com"}
        )
        # Should return 200 for security (don't reveal if email exists)
        assert response.status_code == 200
        print("✓ Forgot password handles non-existent email securely")


class TestResetPassword:
    """Test reset password flow"""
    
    def test_reset_password_invalid_token(self):
        """Test reset password with invalid token fails"""
        response = requests.post(
            f"{BASE_URL}/api/auth/reset-password",
            json={"token": "invalid_token_12345", "new_password": "NewPass@123"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "invalid" in data.get("detail", "").lower() or "expired" in data.get("detail", "").lower()
        print("✓ Invalid reset token rejected correctly")


class TestGoogleOAuthCallback:
    """Test Google OAuth callback endpoint"""
    
    def test_google_callback_missing_session_id(self):
        """Test Google callback rejects missing session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google/callback",
            json={}
        )
        assert response.status_code == 400
        assert "session_id" in response.json().get("detail", "").lower()
        print("✓ Google callback rejects missing session_id")
    
    def test_google_callback_invalid_session_id(self):
        """Test Google callback rejects invalid session_id"""
        response = requests.post(
            f"{BASE_URL}/api/auth/google/callback",
            json={"session_id": "invalid_session_12345"}
        )
        assert response.status_code == 400
        print("✓ Google callback rejects invalid session_id")


class TestAdminStats:
    """Test admin stats endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_admin_stats_includes_pending_count(self, admin_session):
        """Test admin stats includes pending_users count"""
        response = admin_session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "pending_users" in data
        assert isinstance(data["pending_users"], int)
        print(f"✓ Admin stats shows {data['pending_users']} pending users")


class TestAuthMe:
    """Test /auth/me endpoint"""
    
    def test_auth_me_unauthenticated(self):
        """Test /auth/me returns 401 when not authenticated"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me returns 401 for unauthenticated request")
    
    def test_auth_me_authenticated(self):
        """Test /auth/me returns user data when authenticated"""
        session = requests.Session()
        login_response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        
        me_response = session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        data = me_response.json()
        assert data.get("email") == ADMIN_EMAIL
        assert "password_hash" not in data  # Should not expose password
        print(f"✓ /auth/me returns user data: {data.get('name')}")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return session
    
    def test_cleanup_test_users(self, admin_session):
        """Clean up TEST_ prefixed users"""
        # Get all users
        response = admin_session.get(f"{BASE_URL}/api/admin/users?limit=100")
        if response.status_code != 200:
            print("⚠ Could not fetch users for cleanup")
            return
        
        data = response.json()
        users = data.get("users", [])
        
        deleted = 0
        for user in users:
            email = user.get("email", "")
            if email.startswith("TEST_") or email.startswith("test_"):
                user_id = user.get("_id")
                del_response = admin_session.delete(f"{BASE_URL}/api/admin/users/{user_id}")
                if del_response.status_code == 200:
                    deleted += 1
        
        print(f"✓ Cleaned up {deleted} test users")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
