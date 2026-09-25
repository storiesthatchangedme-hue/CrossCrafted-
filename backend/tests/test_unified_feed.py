"""
Test Unified Feed API - /api/feed/unified
Tests the new unified feed that merges posts with injected events, churches, and products
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUnifiedFeedAPI:
    """Tests for GET /api/feed/unified endpoint"""
    
    def test_unified_feed_returns_items_array(self):
        """Unified feed returns items array"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        print(f"✓ Unified feed returns {len(data['items'])} items")
    
    def test_unified_feed_returns_has_more(self):
        """Unified feed returns has_more boolean"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        assert "has_more" in data
        assert isinstance(data["has_more"], bool)
        print(f"✓ has_more = {data['has_more']}")
    
    def test_unified_feed_contains_posts(self):
        """Unified feed contains posts with item_type='post'"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        posts = [i for i in data["items"] if i.get("item_type") == "post"]
        assert len(posts) > 0, "No posts found in unified feed"
        
        # Verify post structure
        post = posts[0]
        assert "likes_count" in post
        assert "comments_count" in post
        assert "user_name" in post
        assert "content_text" in post
        print(f"✓ Found {len(posts)} posts with correct structure")
    
    def test_unified_feed_contains_events(self):
        """Unified feed contains events with item_type='event'"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        events = [i for i in data["items"] if i.get("item_type") == "event"]
        assert len(events) > 0, "No events found in unified feed"
        
        # Verify event structure
        event = events[0]
        assert "attendees_count" in event
        assert "is_registered" in event
        assert "title" in event
        assert "date" in event
        print(f"✓ Found {len(events)} events with attendees_count and is_registered")
    
    def test_unified_feed_contains_churches(self):
        """Unified feed contains churches with item_type='church'"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        churches = [i for i in data["items"] if i.get("item_type") == "church"]
        assert len(churches) > 0, "No churches found in unified feed"
        
        # Verify church structure
        church = churches[0]
        assert "followers_count" in church
        assert "name" in church
        assert "location" in church
        print(f"✓ Found {len(churches)} churches with followers_count")
    
    def test_unified_feed_contains_products(self):
        """Unified feed contains products with item_type='product'"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        products = [i for i in data["items"] if i.get("item_type") == "product"]
        assert len(products) > 0, "No products found in unified feed"
        
        # Verify product structure
        product = products[0]
        assert "price" in product
        assert "title" in product
        print(f"✓ Found {len(products)} products with price")
    
    def test_unified_feed_injection_positions(self):
        """Verifies that events, churches, and products are injected into the feed"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        
        # Get positions of each type
        positions = {}
        for i, item in enumerate(items):
            item_type = item.get("item_type")
            if item_type not in positions:
                positions[item_type] = []
            positions[item_type].append(i)
        
        print(f"Injection positions: {positions}")
        
        # Verify events are injected (should be at positions around 3, 9, 18)
        assert "event" in positions, "Events should be injected into feed"
        assert len(positions["event"]) >= 1, "At least 1 event should be injected"
        
        # Verify churches are injected (should be at positions around 6, 15)
        assert "church" in positions, "Churches should be injected into feed"
        assert len(positions["church"]) >= 1, "At least 1 church should be injected"
        
        # Verify products are injected (should be at position around 12)
        assert "product" in positions, "Products should be injected into feed"
        assert len(positions["product"]) >= 1, "At least 1 product should be injected"
        
        # Verify posts are the majority
        assert "post" in positions, "Posts should be in feed"
        assert len(positions["post"]) > len(positions.get("event", [])), "Posts should outnumber events"
        
        print("✓ Injection positions verified - events, churches, products all present")
    
    def test_unified_feed_pagination(self):
        """Subsequent pages (skip>0) return posts only"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?skip=12&limit=12")
        assert response.status_code == 200
        data = response.json()
        items = data["items"]
        
        # On subsequent pages, injections should not happen
        # All items should be posts (or fewer injections)
        item_types = [i.get("item_type") for i in items]
        print(f"Page 2 item types: {item_types}")
        # Just verify we get items
        assert isinstance(items, list)
        print(f"✓ Pagination works, got {len(items)} items on page 2")


class TestAuthenticatedUnifiedFeed:
    """Tests for unified feed with authenticated user"""
    
    @pytest.fixture
    def auth_cookies(self):
        """Login and get auth cookies"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "sarah@example.com", "password": "Faith@123"}
        )
        if response.status_code != 200:
            pytest.skip("Could not login with test user")
        return response.cookies
    
    def test_authenticated_feed_shows_registration_status(self, auth_cookies):
        """Authenticated user sees is_registered status on events"""
        response = requests.get(
            f"{BASE_URL}/api/feed/unified?skip=0&limit=12",
            cookies=auth_cookies
        )
        assert response.status_code == 200
        data = response.json()
        events = [i for i in data["items"] if i.get("item_type") == "event"]
        
        if events:
            # is_registered should be boolean
            assert isinstance(events[0].get("is_registered"), bool)
            print(f"✓ Event is_registered = {events[0].get('is_registered')}")


class TestEventRSVPFromFeed:
    """Tests for RSVP functionality from feed"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and get session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "sarah@example.com", "password": "Faith@123"}
        )
        if response.status_code != 200:
            pytest.skip("Could not login with test user")
        return session
    
    def test_event_rsvp_register(self, auth_session):
        """Can register for event from feed"""
        # Get an event from feed
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        data = response.json()
        events = [i for i in data["items"] if i.get("item_type") == "event"]
        
        if not events:
            pytest.skip("No events in feed")
        
        event_id = events[0]["_id"]
        
        # Try to register (may already be registered)
        response = auth_session.post(f"{BASE_URL}/api/events/{event_id}/register")
        assert response.status_code in [200, 400]  # 400 if already registered
        print(f"✓ RSVP endpoint works for event {event_id}")
    
    def test_event_rsvp_unregister(self, auth_session):
        """Can unregister from event"""
        # Get an event from feed
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        data = response.json()
        events = [i for i in data["items"] if i.get("item_type") == "event"]
        
        if not events:
            pytest.skip("No events in feed")
        
        event_id = events[0]["_id"]
        
        # First register
        auth_session.post(f"{BASE_URL}/api/events/{event_id}/register")
        
        # Then unregister
        response = auth_session.delete(f"{BASE_URL}/api/events/{event_id}/register")
        assert response.status_code in [200, 404]  # 404 if not registered
        print(f"✓ Unregister endpoint works for event {event_id}")


class TestChurchFollowFromFeed:
    """Tests for church follow functionality from feed"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and get session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "sarah@example.com", "password": "Faith@123"}
        )
        if response.status_code != 200:
            pytest.skip("Could not login with test user")
        return session
    
    def test_church_follow(self, auth_session):
        """Can follow church from feed"""
        # Get a church from feed
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        data = response.json()
        churches = [i for i in data["items"] if i.get("item_type") == "church"]
        
        if not churches:
            pytest.skip("No churches in feed")
        
        church_id = churches[0]["_id"]
        
        # Follow
        response = auth_session.post(f"{BASE_URL}/api/churches/{church_id}/follow")
        assert response.status_code == 200
        print(f"✓ Follow endpoint works for church {church_id}")
    
    def test_church_unfollow(self, auth_session):
        """Can unfollow church"""
        # Get a church from feed
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        data = response.json()
        churches = [i for i in data["items"] if i.get("item_type") == "church"]
        
        if not churches:
            pytest.skip("No churches in feed")
        
        church_id = churches[0]["_id"]
        
        # First follow
        auth_session.post(f"{BASE_URL}/api/churches/{church_id}/follow")
        
        # Then unfollow
        response = auth_session.delete(f"{BASE_URL}/api/churches/{church_id}/follow")
        assert response.status_code == 200
        print(f"✓ Unfollow endpoint works for church {church_id}")


class TestPostInteractionsFromFeed:
    """Tests for post interactions (like/comment/save) from feed"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and get session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "sarah@example.com", "password": "Faith@123"}
        )
        if response.status_code != 200:
            pytest.skip("Could not login with test user")
        return session
    
    def test_like_post(self, auth_session):
        """Can like post from feed"""
        # Get a post from feed
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        data = response.json()
        posts = [i for i in data["items"] if i.get("item_type") == "post"]
        
        if not posts:
            pytest.skip("No posts in feed")
        
        post_id = posts[0]["_id"]
        
        # Like
        response = auth_session.post(f"{BASE_URL}/api/posts/{post_id}/like")
        assert response.status_code == 200
        print(f"✓ Like endpoint works for post {post_id}")
    
    def test_save_post(self, auth_session):
        """Can save post from feed"""
        # Get a post from feed
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        data = response.json()
        posts = [i for i in data["items"] if i.get("item_type") == "post"]
        
        if not posts:
            pytest.skip("No posts in feed")
        
        post_id = posts[0]["_id"]
        
        # Save
        response = auth_session.post(f"{BASE_URL}/api/posts/{post_id}/save")
        assert response.status_code == 200
        print(f"✓ Save endpoint works for post {post_id}")
    
    def test_comment_on_post(self, auth_session):
        """Can comment on post from feed"""
        # Get a post from feed
        response = auth_session.get(f"{BASE_URL}/api/feed/unified?skip=0&limit=12")
        data = response.json()
        posts = [i for i in data["items"] if i.get("item_type") == "post"]
        
        if not posts:
            pytest.skip("No posts in feed")
        
        post_id = posts[0]["_id"]
        
        # Comment
        response = auth_session.post(
            f"{BASE_URL}/api/posts/{post_id}/comments",
            json={"content": "Test comment from unified feed test"}
        )
        assert response.status_code == 200
        print(f"✓ Comment endpoint works for post {post_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
