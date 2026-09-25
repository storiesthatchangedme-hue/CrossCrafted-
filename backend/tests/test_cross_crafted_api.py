"""
Cross Crafted API Tests - Comprehensive test suite for all API endpoints
Tests: Auth, Posts, User Profile, Follow/Unfollow, Save/Unsave, Churches, Events, Explore
"""
import pytest
import requests
import os
from datetime import datetime
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://believer-hub-4.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@crosscrafted.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")


class TestAuthFlow:
    """Authentication endpoint tests - Register, Login, Me, Logout"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "email" in data
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "_id" in data
        
        # Verify cookies are set
        assert "access_token" in response.cookies or "access_token" in self.session.cookies
    
    def test_login_invalid_credentials(self):
        """Test login with wrong credentials returns 401"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
    
    def test_auth_me_returns_user_data(self):
        """Test /api/auth/me returns user data after login"""
        # First login
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200
        
        # Then check /auth/me
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 200
        
        data = me_response.json()
        assert data["email"] == ADMIN_EMAIL
        assert "_id" in data
        assert "name" in data
    
    def test_logout_clears_session(self):
        """Test logout clears cookies"""
        # Login first
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        # Logout
        logout_response = self.session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
        
        # Verify /auth/me now returns 401
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_response.status_code == 401
    
    def test_register_new_user(self):
        """Test user registration creates new user"""
        unique_id = uuid.uuid4().hex[:8]
        test_email = f"TEST_user_{unique_id}@example.com"
        test_username = f"TEST_user_{unique_id}"
        
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Test User",
            "username": test_username,
            "role": "user"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["email"] == test_email.lower()
        assert data["username"] == test_username.lower()
        assert data["name"] == "Test User"
        assert "_id" in data
    
    def test_register_duplicate_email_fails(self):
        """Test registering with existing email fails"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "TestPass123!",
            "name": "Duplicate User",
            "username": "duplicateuser"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data


class TestSocialFeed:
    """Social Feed tests - Posts CRUD, Like, Unlike, Comments"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
    
    def test_get_posts_returns_list(self):
        """Test GET /api/posts returns list of posts"""
        response = self.session.get(f"{BASE_URL}/api/posts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            post = data[0]
            assert "_id" in post
            assert "user_id" in post
            assert "content_text" in post
            assert "likes_count" in post
            assert "comments_count" in post
    
    def test_create_text_post(self):
        """Test POST /api/posts creates a text post"""
        unique_content = f"TEST_post_{uuid.uuid4().hex[:8]} - Testing post creation"
        
        response = self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": unique_content,
            "image_url": "",
            "video_url": ""
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["content_text"] == unique_content
        assert "_id" in data
        assert "user_id" in data
        assert "created_at" in data
        
        # Store for cleanup
        self.created_post_id = data["_id"]
        return data["_id"]
    
    def test_like_post(self):
        """Test POST /api/posts/{id}/like likes a post"""
        # First create a post
        create_response = self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": f"TEST_like_post_{uuid.uuid4().hex[:8]}"
        })
        post_id = create_response.json()["_id"]
        
        # Like the post
        like_response = self.session.post(f"{BASE_URL}/api/posts/{post_id}/like")
        assert like_response.status_code == 200
        
        # Verify like was added
        get_response = self.session.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_response.status_code == 200
        post_data = get_response.json()
        assert post_data["likes_count"] >= 1
    
    def test_unlike_post(self):
        """Test DELETE /api/posts/{id}/like unlikes a post"""
        # Create and like a post
        create_response = self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": f"TEST_unlike_post_{uuid.uuid4().hex[:8]}"
        })
        post_id = create_response.json()["_id"]
        self.session.post(f"{BASE_URL}/api/posts/{post_id}/like")
        
        # Unlike the post
        unlike_response = self.session.delete(f"{BASE_URL}/api/posts/{post_id}/like")
        assert unlike_response.status_code == 200
    
    def test_add_comment_to_post(self):
        """Test POST /api/posts/{id}/comments adds comment"""
        # Create a post
        create_response = self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": f"TEST_comment_post_{uuid.uuid4().hex[:8]}"
        })
        post_id = create_response.json()["_id"]
        
        # Add comment
        comment_response = self.session.post(f"{BASE_URL}/api/posts/{post_id}/comments", json={
            "content": "This is a test comment!"
        })
        assert comment_response.status_code == 200
        
        comment_data = comment_response.json()
        assert "id" in comment_data
        assert comment_data["content"] == "This is a test comment!"
    
    def test_get_comments_for_post(self):
        """Test GET /api/posts/{id}/comments returns comments"""
        # Create a post and add comment
        create_response = self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": f"TEST_get_comments_{uuid.uuid4().hex[:8]}"
        })
        post_id = create_response.json()["_id"]
        
        self.session.post(f"{BASE_URL}/api/posts/{post_id}/comments", json={
            "content": "Test comment for retrieval"
        })
        
        # Get comments
        comments_response = self.session.get(f"{BASE_URL}/api/posts/{post_id}/comments")
        assert comments_response.status_code == 200
        
        comments = comments_response.json()
        assert isinstance(comments, list)
        assert len(comments) >= 1


class TestUserProfile:
    """User Profile tests - GET profile, posts, saved, events, follow/unfollow"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.user_data = login_response.json()
        self.user_id = self.user_data["_id"]
    
    def test_get_user_profile(self):
        """Test GET /api/users/{user_id} returns profile with counts"""
        response = self.session.get(f"{BASE_URL}/api/users/{self.user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "_id" in data
        assert "name" in data
        assert "email" in data
        assert "followers_count" in data
        assert "following_count" in data
        assert "is_following" in data
        assert "posts_count" in data
    
    def test_get_user_posts(self):
        """Test GET /api/users/{user_id}/posts returns user's posts"""
        response = self.session.get(f"{BASE_URL}/api/users/{self.user_id}/posts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_saved_posts_own_profile(self):
        """Test GET /api/users/{user_id}/saved returns saved posts for own profile"""
        response = self.session.get(f"{BASE_URL}/api/users/{self.user_id}/saved")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_saved_posts_other_profile_forbidden(self):
        """Test GET /api/users/{other_id}/saved returns 403 for other users"""
        # Create another user
        unique_id = uuid.uuid4().hex[:8]
        other_session = requests.Session()
        other_session.headers.update({"Content-Type": "application/json"})
        
        register_response = other_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_other_{unique_id}@example.com",
            "password": "TestPass123!",
            "name": "Other User",
            "username": f"TEST_other_{unique_id}"
        })
        other_user_id = register_response.json()["_id"]
        
        # Try to access other user's saved posts
        response = self.session.get(f"{BASE_URL}/api/users/{other_user_id}/saved")
        assert response.status_code == 403
    
    def test_get_user_events(self):
        """Test GET /api/users/{user_id}/events returns {created:[], attending:[]}"""
        response = self.session.get(f"{BASE_URL}/api/users/{self.user_id}/events")
        assert response.status_code == 200
        
        data = response.json()
        assert "created" in data
        assert "attending" in data
        assert isinstance(data["created"], list)
        assert isinstance(data["attending"], list)


class TestFollowUnfollow:
    """Follow/Unfollow tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.user_id = login_response.json()["_id"]
        
        # Create a user to follow
        unique_id = uuid.uuid4().hex[:8]
        other_session = requests.Session()
        other_session.headers.update({"Content-Type": "application/json"})
        register_response = other_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_follow_{unique_id}@example.com",
            "password": "TestPass123!",
            "name": "Follow Target",
            "username": f"TEST_follow_{unique_id}"
        })
        self.target_user_id = register_response.json()["_id"]
    
    def test_follow_user(self):
        """Test POST /api/users/{user_id}/follow follows a user"""
        response = self.session.post(f"{BASE_URL}/api/users/{self.target_user_id}/follow")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Followed"
        
        # Verify follow was recorded
        profile_response = self.session.get(f"{BASE_URL}/api/users/{self.target_user_id}")
        profile_data = profile_response.json()
        assert profile_data["is_following"] == True
    
    def test_unfollow_user(self):
        """Test DELETE /api/users/{user_id}/follow unfollows a user"""
        # First follow
        self.session.post(f"{BASE_URL}/api/users/{self.target_user_id}/follow")
        
        # Then unfollow
        response = self.session.delete(f"{BASE_URL}/api/users/{self.target_user_id}/follow")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Unfollowed"
    
    def test_cannot_follow_self(self):
        """Test following yourself returns 400"""
        response = self.session.post(f"{BASE_URL}/api/users/{self.user_id}/follow")
        assert response.status_code == 400


class TestSaveUnsavePosts:
    """Save/Unsave Posts tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.user_id = login_response.json()["_id"]
        
        # Create a post to save
        post_response = self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": f"TEST_save_post_{uuid.uuid4().hex[:8]}"
        })
        self.post_id = post_response.json()["_id"]
    
    def test_save_post(self):
        """Test POST /api/posts/{post_id}/save saves a post"""
        response = self.session.post(f"{BASE_URL}/api/posts/{self.post_id}/save")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Post saved"
    
    def test_unsave_post(self):
        """Test DELETE /api/posts/{post_id}/save unsaves a post"""
        # First save
        self.session.post(f"{BASE_URL}/api/posts/{self.post_id}/save")
        
        # Then unsave
        response = self.session.delete(f"{BASE_URL}/api/posts/{self.post_id}/save")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Post unsaved"


class TestProfileEdit:
    """Profile Edit tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
    
    def test_update_profile_name_and_bio(self):
        """Test PUT /api/users/me updates name and bio"""
        new_name = f"Updated Admin {uuid.uuid4().hex[:4]}"
        new_bio = "Updated bio for testing"
        
        response = self.session.put(f"{BASE_URL}/api/users/me", json={
            "name": new_name,
            "bio": new_bio
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == new_name
        
        # Verify persistence
        me_response = self.session.get(f"{BASE_URL}/api/auth/me")
        me_data = me_response.json()
        assert me_data["name"] == new_name


class TestChurchesAPI:
    """Churches API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
    
    def test_get_churches(self):
        """Test GET /api/churches returns list"""
        response = self.session.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_church(self):
        """Test POST /api/churches creates a church"""
        unique_name = f"TEST_Church_{uuid.uuid4().hex[:8]}"
        
        response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "A test church for testing",
            "location": "123 Test Street"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == unique_name
        assert "_id" in data
        
        self.church_id = data["_id"]
        return data["_id"]
    
    def test_follow_church(self):
        """Test POST /api/churches/{id}/follow follows a church"""
        # Create a church first
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": f"TEST_FollowChurch_{uuid.uuid4().hex[:8]}",
            "description": "Church to follow",
            "location": "456 Follow Street"
        })
        church_id = create_response.json()["_id"]
        
        # Follow the church
        follow_response = self.session.post(f"{BASE_URL}/api/churches/{church_id}/follow")
        assert follow_response.status_code == 200
        
        data = follow_response.json()
        assert data["message"] == "Followed"


class TestEventsAPI:
    """Events API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
    
    def test_get_events(self):
        """Test GET /api/events returns list"""
        response = self.session.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_event(self):
        """Test POST /api/events creates an event"""
        unique_title = f"TEST_Event_{uuid.uuid4().hex[:8]}"
        
        response = self.session.post(f"{BASE_URL}/api/events", json={
            "title": unique_title,
            "description": "A test event for testing",
            "date": "2026-03-15T19:00:00Z",
            "location": "Test Venue"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == unique_title
        assert "_id" in data
        
        self.event_id = data["_id"]
        return data["_id"]
    
    def test_register_for_event(self):
        """Test POST /api/events/{id}/register registers for event"""
        # Create an event first
        create_response = self.session.post(f"{BASE_URL}/api/events", json={
            "title": f"TEST_RegisterEvent_{uuid.uuid4().hex[:8]}",
            "description": "Event to register for",
            "date": "2026-04-15T19:00:00Z",
            "location": "Registration Venue"
        })
        event_id = create_response.json()["_id"]
        
        # Register for the event
        register_response = self.session.post(f"{BASE_URL}/api/events/{event_id}/register")
        assert register_response.status_code == 200
        
        data = register_response.json()
        assert data["message"] == "Registration successful"


class TestExploreAPI:
    """Explore API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
    
    def test_get_explore_content(self):
        """Test GET /api/explore returns {posts, churches, events, products, trending_users}"""
        response = self.session.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        assert "posts" in data
        assert "churches" in data
        assert "events" in data
        assert "products" in data
        assert "trending_users" in data
        
        assert isinstance(data["posts"], list)
        assert isinstance(data["churches"], list)
        assert isinstance(data["events"], list)
        assert isinstance(data["products"], list)
        assert isinstance(data["trending_users"], list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
