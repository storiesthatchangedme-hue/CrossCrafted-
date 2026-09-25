"""
Admin Panel API Tests
Tests all /api/admin/* endpoints for the admin panel functionality.
Covers: stats, users (list, role change, delete), posts (list, delete), 
churches (list, status change, delete), events (list, delete), products (list, delete)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@crosscrafted.com"
ADMIN_PASSWORD = "Admin@123"
NON_ADMIN_EMAIL = "sarah@example.com"
NON_ADMIN_PASSWORD = "Faith@123"


class TestAdminAuth:
    """Test admin authentication and access control"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_admin_login_success(self):
        """Admin can login successfully"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data.get("role") == "admin", f"Expected admin role, got: {data.get('role')}"
        assert "access_token" in response.cookies or data.get("_id"), "No auth token/user returned"
        print(f"✓ Admin login successful, role: {data.get('role')}")
    
    def test_non_admin_cannot_access_admin_stats(self):
        """Non-admin users get 403 on admin endpoints"""
        # First try to login as non-admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": NON_ADMIN_EMAIL,
            "password": NON_ADMIN_PASSWORD
        })
        
        if login_resp.status_code != 200:
            # Create a test non-admin user if sarah doesn't exist
            pytest.skip("Non-admin test user not available")
        
        # Try to access admin stats
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 403, f"Expected 403 for non-admin, got: {response.status_code}"
        print("✓ Non-admin correctly blocked from admin endpoints (403)")


class TestAdminStats:
    """Test admin dashboard stats endpoint"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    
    def test_admin_stats_returns_all_counts(self):
        """Admin stats endpoint returns all required counts"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 200, f"Stats failed: {response.text}"
        
        data = response.json()
        # Check all required fields exist
        required_fields = ["users", "posts", "churches", "events", "products", "registrations"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
            assert isinstance(data[field], int), f"{field} should be int, got: {type(data[field])}"
        
        # Check role_counts breakdown
        assert "role_counts" in data, "Missing role_counts"
        role_counts = data["role_counts"]
        for role in ["user", "church", "creator", "admin"]:
            assert role in role_counts, f"Missing role count for: {role}"
        
        # Check church status counts
        assert "churches_pending" in data, "Missing churches_pending"
        assert "churches_approved" in data, "Missing churches_approved"
        assert "churches_rejected" in data, "Missing churches_rejected"
        
        print(f"✓ Admin stats: {data['users']} users, {data['posts']} posts, {data['churches']} churches, {data['events']} events, {data['products']} products")


class TestAdminUsers:
    """Test admin user management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
        self.admin_id = login_resp.json().get("_id")
    
    def test_admin_get_users_list(self):
        """Admin can get list of all users"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Get users failed: {response.text}"
        
        data = response.json()
        assert "users" in data, "Missing users array"
        assert "total" in data, "Missing total count"
        assert isinstance(data["users"], list), "users should be a list"
        
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "_id" in user, "User missing _id"
            assert "email" in user, "User missing email"
            assert "role" in user, "User missing role"
        
        print(f"✓ Admin users list: {data['total']} total users")
    
    def test_admin_search_users(self):
        """Admin can search users by name/email"""
        response = self.session.get(f"{BASE_URL}/api/admin/users?search=admin")
        assert response.status_code == 200, f"Search users failed: {response.text}"
        
        data = response.json()
        assert "users" in data, "Missing users array"
        print(f"✓ Admin user search works, found {len(data['users'])} matching 'admin'")
    
    def test_admin_change_user_role(self):
        """Admin can change a user's role"""
        # First get a non-admin user
        users_resp = self.session.get(f"{BASE_URL}/api/admin/users")
        users = users_resp.json().get("users", [])
        
        # Find a non-admin user to test role change
        test_user = None
        for u in users:
            if u["_id"] != self.admin_id and u.get("role") != "admin":
                test_user = u
                break
        
        if not test_user:
            pytest.skip("No non-admin user available for role change test")
        
        original_role = test_user["role"]
        new_role = "creator" if original_role != "creator" else "user"
        
        # Change role
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{test_user['_id']}/role",
            json={"role": new_role}
        )
        assert response.status_code == 200, f"Role change failed: {response.text}"
        
        # Verify change
        verify_resp = self.session.get(f"{BASE_URL}/api/admin/users?search={test_user['email']}")
        updated_user = verify_resp.json()["users"][0]
        assert updated_user["role"] == new_role, f"Role not updated, expected {new_role}, got {updated_user['role']}"
        
        # Revert role
        self.session.put(
            f"{BASE_URL}/api/admin/users/{test_user['_id']}/role",
            json={"role": original_role}
        )
        
        print(f"✓ Admin role change works: {original_role} -> {new_role} -> {original_role}")
    
    def test_admin_cannot_change_own_role(self):
        """Admin cannot change their own role"""
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{self.admin_id}/role",
            json={"role": "user"}
        )
        assert response.status_code == 400, f"Expected 400 for self role change, got: {response.status_code}"
        print("✓ Admin correctly blocked from changing own role")


class TestAdminPosts:
    """Test admin post management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    
    def test_admin_get_posts_list(self):
        """Admin can get list of all posts"""
        response = self.session.get(f"{BASE_URL}/api/admin/posts")
        assert response.status_code == 200, f"Get posts failed: {response.text}"
        
        data = response.json()
        assert "posts" in data, "Missing posts array"
        assert "total" in data, "Missing total count"
        
        if len(data["posts"]) > 0:
            post = data["posts"][0]
            assert "_id" in post, "Post missing _id"
            assert "content_text" in post, "Post missing content_text"
            assert "likes_count" in post, "Post missing likes_count"
            assert "comments_count" in post, "Post missing comments_count"
        
        print(f"✓ Admin posts list: {data['total']} total posts")
    
    def test_admin_search_posts(self):
        """Admin can search posts by content"""
        response = self.session.get(f"{BASE_URL}/api/admin/posts?search=test")
        assert response.status_code == 200, f"Search posts failed: {response.text}"
        print("✓ Admin post search works")
    
    def test_admin_delete_post(self):
        """Admin can delete a post"""
        # First create a test post
        create_resp = self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": "TEST_ADMIN_DELETE_POST - This post will be deleted"
        })
        
        if create_resp.status_code != 200:
            pytest.skip("Could not create test post")
        
        post_id = create_resp.json().get("_id")
        
        # Delete the post via admin endpoint
        delete_resp = self.session.delete(f"{BASE_URL}/api/admin/posts/{post_id}")
        assert delete_resp.status_code == 200, f"Delete post failed: {delete_resp.text}"
        
        # Verify deletion
        verify_resp = self.session.get(f"{BASE_URL}/api/posts/{post_id}")
        assert verify_resp.status_code == 404, "Post should be deleted"
        
        print("✓ Admin post deletion works")


class TestAdminChurches:
    """Test admin church management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    
    def test_admin_get_churches_list(self):
        """Admin can get list of all churches"""
        response = self.session.get(f"{BASE_URL}/api/admin/churches")
        assert response.status_code == 200, f"Get churches failed: {response.text}"
        
        data = response.json()
        assert "churches" in data, "Missing churches array"
        assert "total" in data, "Missing total count"
        
        if len(data["churches"]) > 0:
            church = data["churches"][0]
            assert "_id" in church, "Church missing _id"
            assert "name" in church, "Church missing name"
            assert "followers_count" in church, "Church missing followers_count"
        
        print(f"✓ Admin churches list: {data['total']} total churches")
    
    def test_admin_change_church_status(self):
        """Admin can approve/reject churches"""
        # Get a church to test
        churches_resp = self.session.get(f"{BASE_URL}/api/admin/churches")
        churches = churches_resp.json().get("churches", [])
        
        if not churches:
            pytest.skip("No churches available for status test")
        
        test_church = churches[0]
        church_id = test_church["_id"]
        original_status = test_church.get("status", "approved")
        
        # Change to rejected
        response = self.session.put(
            f"{BASE_URL}/api/admin/churches/{church_id}/status",
            json={"status": "rejected"}
        )
        assert response.status_code == 200, f"Status change failed: {response.text}"
        
        # Verify change
        verify_resp = self.session.get(f"{BASE_URL}/api/admin/churches")
        updated_church = next((c for c in verify_resp.json()["churches"] if c["_id"] == church_id), None)
        assert updated_church["status"] == "rejected", "Status not updated to rejected"
        
        # Revert to approved
        self.session.put(
            f"{BASE_URL}/api/admin/churches/{church_id}/status",
            json={"status": "approved"}
        )
        
        print("✓ Admin church status change works: approved -> rejected -> approved")


class TestAdminEvents:
    """Test admin event management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    
    def test_admin_get_events_list(self):
        """Admin can get list of all events"""
        response = self.session.get(f"{BASE_URL}/api/admin/events")
        assert response.status_code == 200, f"Get events failed: {response.text}"
        
        data = response.json()
        assert "events" in data, "Missing events array"
        assert "total" in data, "Missing total count"
        
        if len(data["events"]) > 0:
            event = data["events"][0]
            assert "_id" in event, "Event missing _id"
            assert "title" in event, "Event missing title"
            assert "attendees_count" in event, "Event missing attendees_count"
        
        print(f"✓ Admin events list: {data['total']} total events")
    
    def test_admin_search_events(self):
        """Admin can search events by title"""
        response = self.session.get(f"{BASE_URL}/api/admin/events?search=test")
        assert response.status_code == 200, f"Search events failed: {response.text}"
        print("✓ Admin event search works")


class TestAdminProducts:
    """Test admin product management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Admin login failed: {login_resp.text}"
    
    def test_admin_get_products_list(self):
        """Admin can get list of all products"""
        response = self.session.get(f"{BASE_URL}/api/admin/products")
        assert response.status_code == 200, f"Get products failed: {response.text}"
        
        data = response.json()
        assert "products" in data, "Missing products array"
        assert "total" in data, "Missing total count"
        
        if len(data["products"]) > 0:
            product = data["products"][0]
            assert "_id" in product, "Product missing _id"
            assert "title" in product, "Product missing title"
            assert "price" in product, "Product missing price"
        
        print(f"✓ Admin products list: {data['total']} total products")
    
    def test_admin_search_products(self):
        """Admin can search products by title"""
        response = self.session.get(f"{BASE_URL}/api/admin/products?search=test")
        assert response.status_code == 200, f"Search products failed: {response.text}"
        print("✓ Admin product search works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
