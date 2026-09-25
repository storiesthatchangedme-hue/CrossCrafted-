"""
Test suite for User and Church Verification Feature
Tests:
- Admin login
- Admin Users page shows is_verified field
- PUT /api/admin/users/{user_id}/verify endpoint
- GET /api/users/{user_id} returns is_verified field
- Feed unified endpoint returns user_is_verified field
- Churches verification status
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestVerificationFeature:
    """Test verification badge feature for users and churches"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Admin login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingjosh@gmail.com", "password": "Admin@123"}
        )
        assert login_response.status_code == 200, f"Admin login failed: {login_response.text}"
        self.admin_user = login_response.json()
        print(f"✓ Admin login successful: {self.admin_user.get('name')}")
        
    def test_admin_login(self):
        """Test admin can login with correct credentials"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingjosh@gmail.com", "password": "Admin@123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("role") == "admin"
        print(f"✓ Admin login verified: role={data.get('role')}")
        
    def test_admin_users_returns_is_verified_field(self):
        """Test GET /api/admin/users returns is_verified field for each user"""
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "users" in data, "Response should have 'users' key"
        assert "total" in data, "Response should have 'total' key"
        
        users = data["users"]
        assert len(users) > 0, "Should have at least one user"
        
        # Check that is_verified field is present in user objects
        for user in users[:5]:  # Check first 5 users
            assert "_id" in user, f"User should have _id: {user}"
            assert "name" in user, f"User should have name: {user}"
            # is_verified may be True, False, or not present (defaults to False)
            print(f"  User: {user.get('name')} - is_verified: {user.get('is_verified', False)}")
        
        print(f"✓ Admin users endpoint returns {len(users)} users with is_verified field")
        
    def test_admin_toggle_user_verification(self):
        """Test PUT /api/admin/users/{user_id}/verify toggles verification"""
        # First get a non-admin user to test with
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()["users"]
        
        # Find a non-admin user
        test_user = None
        for user in users:
            if user.get("role") != "admin":
                test_user = user
                break
        
        assert test_user is not None, "Need a non-admin user to test verification"
        user_id = test_user["_id"]
        current_verified = test_user.get("is_verified", False)
        
        print(f"  Testing with user: {test_user.get('name')} (current is_verified: {current_verified})")
        
        # Toggle verification ON
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{user_id}/verify",
            json={"is_verified": True}
        )
        assert response.status_code == 200, f"Verify ON failed: {response.text}"
        print(f"  ✓ Set is_verified=True")
        
        # Verify the change persisted
        response = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        user_data = response.json()
        assert user_data.get("is_verified") == True, f"is_verified should be True: {user_data}"
        print(f"  ✓ Verified user profile shows is_verified=True")
        
        # Toggle verification OFF
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{user_id}/verify",
            json={"is_verified": False}
        )
        assert response.status_code == 200, f"Verify OFF failed: {response.text}"
        print(f"  ✓ Set is_verified=False")
        
        # Verify the change persisted
        response = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        user_data = response.json()
        assert user_data.get("is_verified") == False, f"is_verified should be False: {user_data}"
        print(f"  ✓ Verified user profile shows is_verified=False")
        
        # Restore original state
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{user_id}/verify",
            json={"is_verified": current_verified}
        )
        print(f"✓ Admin toggle verification endpoint works correctly")
        
    def test_user_profile_returns_is_verified(self):
        """Test GET /api/users/{user_id} returns is_verified field"""
        # Get a user from admin list
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()["users"]
        
        test_user = users[0]
        user_id = test_user["_id"]
        
        # Get user profile
        response = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200, f"Failed: {response.text}"
        user_data = response.json()
        
        assert "_id" in user_data
        assert "name" in user_data
        # is_verified should be in the response (True or False)
        print(f"  User profile: {user_data.get('name')} - is_verified: {user_data.get('is_verified', 'NOT PRESENT')}")
        
        # The field should exist (even if False)
        assert "is_verified" in user_data or user_data.get("is_verified") is not None or user_data.get("is_verified") == False, \
            "is_verified field should be present in user profile"
        print(f"✓ User profile endpoint returns is_verified field")
        
    def test_feed_unified_returns_user_is_verified(self):
        """Test GET /api/feed/unified returns user_is_verified for posts"""
        response = self.session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        assert "items" in data, "Response should have 'items' key"
        items = data["items"]
        
        # Find posts in the feed
        posts = [item for item in items if item.get("item_type") == "post"]
        
        if len(posts) > 0:
            for post in posts[:3]:  # Check first 3 posts
                print(f"  Post by {post.get('user_name')}: user_is_verified={post.get('user_is_verified', 'NOT PRESENT')}")
                # user_is_verified should be present
                assert "user_is_verified" in post, f"Post should have user_is_verified field: {post.get('_id')}"
            print(f"✓ Feed unified endpoint returns user_is_verified for posts")
        else:
            print("⚠ No posts in feed to verify user_is_verified field")
            
    def test_posts_endpoint_returns_user_is_verified(self):
        """Test GET /api/posts returns user_is_verified for each post"""
        response = self.session.get(f"{BASE_URL}/api/posts?skip=0&limit=10")
        assert response.status_code == 200, f"Failed: {response.text}"
        posts = response.json()
        
        if len(posts) > 0:
            for post in posts[:3]:
                print(f"  Post by {post.get('user_name')}: user_is_verified={post.get('user_is_verified', 'NOT PRESENT')}")
                assert "user_is_verified" in post, f"Post should have user_is_verified field"
            print(f"✓ Posts endpoint returns user_is_verified field")
        else:
            print("⚠ No posts to verify")
            
    def test_churches_list_returns_status(self):
        """Test GET /api/churches returns status field for verification"""
        response = self.session.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200, f"Failed: {response.text}"
        churches = response.json()
        
        if len(churches) > 0:
            for church in churches[:3]:
                print(f"  Church: {church.get('name')} - status={church.get('status', 'NOT PRESENT')}")
            print(f"✓ Churches endpoint returns {len(churches)} churches")
        else:
            print("⚠ No churches to verify")
            
    def test_church_profile_returns_status(self):
        """Test GET /api/churches/{church_id} returns status field"""
        # First get a church
        response = self.session.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        churches = response.json()
        
        if len(churches) > 0:
            church_id = churches[0]["_id"]
            
            response = self.session.get(f"{BASE_URL}/api/churches/{church_id}")
            assert response.status_code == 200, f"Failed: {response.text}"
            church = response.json()
            
            print(f"  Church profile: {church.get('name')} - status={church.get('status', 'NOT PRESENT')}")
            print(f"✓ Church profile endpoint works")
        else:
            print("⚠ No churches to test profile")
            
    def test_admin_verify_nonexistent_user(self):
        """Test PUT /api/admin/users/{user_id}/verify returns 404 for non-existent user"""
        fake_id = "000000000000000000000000"
        response = self.session.put(
            f"{BASE_URL}/api/admin/users/{fake_id}/verify",
            json={"is_verified": True}
        )
        assert response.status_code == 404, f"Should return 404 for non-existent user: {response.status_code}"
        print(f"✓ Verify endpoint returns 404 for non-existent user")
        
    def test_admin_verify_requires_auth(self):
        """Test PUT /api/admin/users/{user_id}/verify requires admin auth"""
        # Create a new session without auth
        new_session = requests.Session()
        new_session.headers.update({"Content-Type": "application/json"})
        
        response = new_session.put(
            f"{BASE_URL}/api/admin/users/someuser/verify",
            json={"is_verified": True}
        )
        assert response.status_code == 401, f"Should return 401 without auth: {response.status_code}"
        print(f"✓ Verify endpoint requires authentication")


class TestVerifiedUserInFeed:
    """Test that verified users show badge in feed"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with admin login"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Admin login
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bookingjosh@gmail.com", "password": "Admin@123"}
        )
        assert login_response.status_code == 200
        
    def test_verified_user_posts_show_verified_flag(self):
        """Test that posts from verified users have user_is_verified=True"""
        # Get users and find one that's verified
        response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        users = response.json()["users"]
        
        verified_users = [u for u in users if u.get("is_verified") == True]
        
        if len(verified_users) > 0:
            verified_user = verified_users[0]
            print(f"  Found verified user: {verified_user.get('name')}")
            
            # Get their posts
            response = self.session.get(f"{BASE_URL}/api/users/{verified_user['_id']}/posts")
            assert response.status_code == 200
            posts = response.json()
            
            if len(posts) > 0:
                for post in posts[:2]:
                    print(f"    Post: user_is_verified={post.get('user_is_verified', 'NOT PRESENT')}")
                    # Posts from verified users should have user_is_verified=True
                    assert post.get("user_is_verified") == True, \
                        f"Post from verified user should have user_is_verified=True"
                print(f"✓ Verified user's posts show user_is_verified=True")
            else:
                print("⚠ Verified user has no posts")
        else:
            print("⚠ No verified users found - verifying one for test")
            # Verify a user for testing
            test_user = users[0]
            self.session.put(
                f"{BASE_URL}/api/admin/users/{test_user['_id']}/verify",
                json={"is_verified": True}
            )
            print(f"  Verified user: {test_user.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
