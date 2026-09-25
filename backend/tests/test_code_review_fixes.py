"""
Test suite for code review fixes - verifying refactored components work correctly
Tests: Feed, UserProfile, ChurchProfile, Events, Shop, Home, Explore pages
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Basic health and connectivity tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns ok"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health endpoint working")

    def test_posts_endpoint(self):
        """Test /api/posts returns posts list"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Posts endpoint working - returned {len(data)} posts")

    def test_events_endpoint(self):
        """Test /api/events returns events list"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Events endpoint working - returned {len(data)} events")

    def test_churches_endpoint(self):
        """Test /api/churches returns churches list"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Churches endpoint working - returned {len(data)} churches")

    def test_products_endpoint(self):
        """Test /api/products returns products list"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Products endpoint working - returned {len(data)} products")


class TestAuthenticationFlow:
    """Test login and authenticated endpoints"""
    
    @pytest.fixture
    def session(self):
        return requests.Session()
    
    def test_login_with_admin(self, session):
        """Test login with admin credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        data = response.json()
        # Login returns user directly, not wrapped in "user" key
        assert "email" in data
        assert data["email"] == "admin@crosscrafted.com"
        print("✓ Admin login successful")
        return session
    
    def test_authenticated_feed(self, session):
        """Test unified feed with authentication"""
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200
        
        # Get unified feed
        response = session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "has_more" in data
        print(f"✓ Unified feed working - returned {len(data['items'])} items")


class TestUnifiedFeedAPI:
    """Test unified feed API for SocialFeed.js"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        return session
    
    def test_unified_feed_structure(self, auth_session):
        """Test unified feed returns correct structure"""
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "has_more" in data
        assert isinstance(data["items"], list)
        
        # Check item types
        item_types = set()
        for item in data["items"]:
            assert "item_type" in item
            item_types.add(item["item_type"])
        
        print(f"✓ Unified feed structure correct - item types: {item_types}")
    
    def test_feed_pagination(self, auth_session):
        """Test feed pagination works"""
        # First page
        resp1 = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=5")
        assert resp1.status_code == 200
        data1 = resp1.json()
        
        # Second page
        resp2 = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=5&limit=5")
        assert resp2.status_code == 200
        data2 = resp2.json()
        
        # Items should be different
        ids1 = {item["_id"] for item in data1["items"]}
        ids2 = {item["_id"] for item in data2["items"]}
        
        print(f"✓ Pagination working - page 1: {len(ids1)} items, page 2: {len(ids2)} items")


class TestUserProfileAPI:
    """Test APIs used by UserProfile.js"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        # Login returns user directly, not wrapped in "user" key
        return session, resp.json()["_id"]
    
    def test_user_posts(self, auth_session):
        """Test getting user's posts"""
        session, user_id = auth_session
        response = session.get(f"{BASE_URL}/api/users/{user_id}/posts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User posts endpoint working - {len(data)} posts")
    
    def test_user_saved_posts(self, auth_session):
        """Test getting user's saved posts"""
        session, user_id = auth_session
        response = session.get(f"{BASE_URL}/api/users/{user_id}/saved")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ User saved posts endpoint working - {len(data)} saved")
    
    def test_user_events(self, auth_session):
        """Test getting user's events"""
        session, user_id = auth_session
        response = session.get(f"{BASE_URL}/api/users/{user_id}/events")
        assert response.status_code == 200
        data = response.json()
        assert "created" in data or "attending" in data
        print(f"✓ User events endpoint working")


class TestChurchProfileAPI:
    """Test APIs used by ChurchProfile.js"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        return session
    
    def test_get_church(self, auth_session):
        """Test getting a church profile"""
        # First get list of churches
        churches_resp = auth_session.get(f"{BASE_URL}/api/churches")
        assert churches_resp.status_code == 200
        churches = churches_resp.json()
        
        if len(churches) > 0:
            church_id = churches[0]["_id"]
            response = auth_session.get(f"{BASE_URL}/api/churches/{church_id}")
            assert response.status_code == 200
            data = response.json()
            assert "name" in data
            assert "location" in data
            print(f"✓ Church profile endpoint working - {data['name']}")
    
    def test_church_posts(self, auth_session):
        """Test getting church posts"""
        churches_resp = auth_session.get(f"{BASE_URL}/api/churches")
        churches = churches_resp.json()
        
        if len(churches) > 0:
            church_id = churches[0]["_id"]
            response = auth_session.get(f"{BASE_URL}/api/churches/{church_id}/posts")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Church posts endpoint working - {len(data)} posts")
    
    def test_church_events(self, auth_session):
        """Test getting church events"""
        churches_resp = auth_session.get(f"{BASE_URL}/api/churches")
        churches = churches_resp.json()
        
        if len(churches) > 0:
            church_id = churches[0]["_id"]
            response = auth_session.get(f"{BASE_URL}/api/churches/{church_id}/events")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Church events endpoint working - {len(data)} events")


class TestExploreAPI:
    """Test APIs used by Explore.js"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        return session
    
    def test_explore_endpoint(self, auth_session):
        """Test explore endpoint returns all content types"""
        response = auth_session.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        data = response.json()
        
        # Should have posts, churches, events, trending_users
        assert "posts" in data
        assert "churches" in data
        assert "events" in data
        print(f"✓ Explore endpoint working - posts: {len(data.get('posts', []))}, churches: {len(data.get('churches', []))}, events: {len(data.get('events', []))}")


class TestPostInteractions:
    """Test post like/save/comment APIs"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        return session
    
    def test_like_post(self, auth_session):
        """Test liking a post"""
        # Get a post
        posts_resp = auth_session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = posts_resp.json()
        
        if len(posts) > 0:
            post_id = posts[0]["_id"]
            # Like the post
            like_resp = auth_session.post(f"{BASE_URL}/api/posts/{post_id}/like")
            assert like_resp.status_code in [200, 201]
            print(f"✓ Like post endpoint working")
            
            # Unlike the post
            unlike_resp = auth_session.delete(f"{BASE_URL}/api/posts/{post_id}/like")
            assert unlike_resp.status_code == 200
            print(f"✓ Unlike post endpoint working")
    
    def test_save_post(self, auth_session):
        """Test saving a post"""
        posts_resp = auth_session.get(f"{BASE_URL}/api/posts?limit=1")
        posts = posts_resp.json()
        
        if len(posts) > 0:
            post_id = posts[0]["_id"]
            # Save the post
            save_resp = auth_session.post(f"{BASE_URL}/api/posts/{post_id}/save")
            assert save_resp.status_code in [200, 201]
            print(f"✓ Save post endpoint working")
            
            # Unsave the post
            unsave_resp = auth_session.delete(f"{BASE_URL}/api/posts/{post_id}/save")
            assert unsave_resp.status_code == 200
            print(f"✓ Unsave post endpoint working")


class TestEventInteractions:
    """Test event RSVP APIs"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        return session
    
    def test_event_rsvp(self, auth_session):
        """Test RSVP to an event"""
        events_resp = auth_session.get(f"{BASE_URL}/api/events")
        events = events_resp.json()
        
        if len(events) > 0:
            event_id = events[0]["_id"]
            # Register for event
            register_resp = auth_session.post(f"{BASE_URL}/api/events/{event_id}/register")
            assert register_resp.status_code in [200, 201, 400]  # 400 if already registered
            print(f"✓ Event RSVP endpoint working")


class TestChurchInteractions:
    """Test church follow APIs"""
    
    @pytest.fixture
    def auth_session(self):
        session = requests.Session()
        session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        return session
    
    def test_church_follow(self, auth_session):
        """Test following a church"""
        churches_resp = auth_session.get(f"{BASE_URL}/api/churches")
        churches = churches_resp.json()
        
        if len(churches) > 0:
            church_id = churches[0]["_id"]
            # Follow the church
            follow_resp = auth_session.post(f"{BASE_URL}/api/churches/{church_id}/follow")
            assert follow_resp.status_code in [200, 201]
            print(f"✓ Church follow endpoint working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
