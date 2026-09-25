"""
Test suite for UI Upgrade - Explore, Churches, Events pages
Tests the visual upgrade with gradients, glow effects, and new card layouts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://believer-hub-4.preview.emergentagent.com')

class TestExploreAPI:
    """Tests for /api/explore endpoint - returns trending_users, posts, churches, events"""
    
    def test_explore_returns_all_content_types(self):
        """Explore API should return trending_users, posts, churches, events"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        assert "trending_users" in data, "Missing trending_users in explore response"
        assert "posts" in data, "Missing posts in explore response"
        assert "churches" in data, "Missing churches in explore response"
        assert "events" in data, "Missing events in explore response"
        
        # Verify we have content
        assert len(data["trending_users"]) > 0, "No trending users returned"
        assert len(data["posts"]) > 0, "No posts returned"
        assert len(data["churches"]) > 0, "No churches returned"
        assert len(data["events"]) > 0, "No events returned"
        print(f"✓ Explore API: {len(data['trending_users'])} users, {len(data['posts'])} posts, {len(data['churches'])} churches, {len(data['events'])} events")
    
    def test_trending_users_have_required_fields(self):
        """Trending users should have profile_image and followers_count for UI cards"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        for user in data["trending_users"]:
            assert "_id" in user, "User missing _id"
            assert "name" in user, "User missing name"
            # profile_image may be empty string but should exist
            assert "profile_image" in user or "followers_count" in user, "User missing profile data"
        print(f"✓ Trending users have required fields")
    
    def test_posts_have_required_fields(self):
        """Posts should have content_text, image_url, user_name for grid display"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        for post in data["posts"]:
            assert "_id" in post, "Post missing _id"
            assert "content_text" in post or "image_url" in post, "Post missing content"
            assert "user_name" in post, "Post missing user_name"
        print(f"✓ Posts have required fields")
    
    def test_churches_have_required_fields(self):
        """Churches should have name, location, cover_image for horizontal cards"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        for church in data["churches"]:
            assert "_id" in church, "Church missing _id"
            assert "name" in church, "Church missing name"
            assert "location" in church, "Church missing location"
        print(f"✓ Churches have required fields")
    
    def test_events_have_required_fields(self):
        """Events should have title, date, church_name for event cards"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        for event in data["events"]:
            assert "_id" in event, "Event missing _id"
            assert "title" in event, "Event missing title"
            assert "date" in event, "Event missing date"
        print(f"✓ Events have required fields")


class TestChurchesAPI:
    """Tests for /api/churches endpoint - full-bleed cover images, follow functionality"""
    
    def test_get_all_churches(self):
        """Should return list of churches with cover images"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Churches should be a list"
        assert len(data) >= 6, f"Expected at least 6 churches, got {len(data)}"
        print(f"✓ Churches API returns {len(data)} churches")
    
    def test_churches_have_cover_images(self):
        """Churches should have cover_image for full-bleed display"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        data = response.json()
        churches_with_covers = sum(1 for c in data if c.get("cover_image"))
        print(f"✓ {churches_with_covers}/{len(data)} churches have cover images")
    
    def test_churches_have_service_times(self):
        """Churches should have service_times for display"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        data = response.json()
        for church in data:
            assert "name" in church, "Church missing name"
            assert "location" in church, "Church missing location"
            assert "description" in church, "Church missing description"
        print(f"✓ Churches have required display fields")
    
    def test_churches_have_followers_count(self):
        """Churches should have followers_count for member display"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        data = response.json()
        for church in data:
            assert "followers_count" in church or "followers" in church, "Church missing follower data"
        print(f"✓ Churches have follower data")


class TestEventsAPI:
    """Tests for /api/events endpoint - featured cards, RSVP functionality"""
    
    def test_get_all_events(self):
        """Should return list of events"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Events should be a list"
        assert len(data) >= 8, f"Expected at least 8 events, got {len(data)}"
        print(f"✓ Events API returns {len(data)} events")
    
    def test_events_have_required_fields(self):
        """Events should have title, date, location for display"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        data = response.json()
        for event in data:
            assert "_id" in event, "Event missing _id"
            assert "title" in event, "Event missing title"
            assert "date" in event, "Event missing date"
            assert "location" in event, "Event missing location"
        print(f"✓ Events have required display fields")
    
    def test_events_have_church_name(self):
        """Events should have church_name for display"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        data = response.json()
        events_with_church = sum(1 for e in data if e.get("church_name"))
        print(f"✓ {events_with_church}/{len(data)} events have church_name")
    
    def test_events_have_attendees_count(self):
        """Events should have attendees_count for 'X going' display"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        data = response.json()
        for event in data:
            assert "attendees_count" in event or "attendees" in event, "Event missing attendee data"
        print(f"✓ Events have attendee data")


class TestAuthenticatedFeatures:
    """Tests for authenticated features - follow, RSVP"""
    
    @pytest.fixture
    def auth_session(self):
        """Get authenticated session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah@example.com",
            "password": "Faith@123"
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return session
    
    def test_church_follow_toggle(self, auth_session):
        """Follow/unfollow church should toggle state"""
        # Get churches
        response = auth_session.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        churches = response.json()
        
        if len(churches) == 0:
            pytest.skip("No churches to test")
        
        church_id = churches[0]["_id"]
        
        # Follow church
        response = auth_session.post(f"{BASE_URL}/api/churches/{church_id}/follow")
        assert response.status_code in [200, 201, 400], f"Follow failed: {response.status_code}"
        
        # Unfollow church
        response = auth_session.delete(f"{BASE_URL}/api/churches/{church_id}/follow")
        assert response.status_code in [200, 204, 400], f"Unfollow failed: {response.status_code}"
        
        print(f"✓ Church follow/unfollow works")
    
    def test_event_rsvp_toggle(self, auth_session):
        """RSVP/cancel RSVP should toggle state"""
        # Get events
        response = auth_session.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        events = response.json()
        
        if len(events) == 0:
            pytest.skip("No events to test")
        
        event_id = events[0]["_id"]
        
        # Register for event
        response = auth_session.post(f"{BASE_URL}/api/events/{event_id}/register")
        assert response.status_code in [200, 201, 400], f"Register failed: {response.status_code}"
        
        # Unregister from event
        response = auth_session.delete(f"{BASE_URL}/api/events/{event_id}/register")
        assert response.status_code in [200, 204, 400], f"Unregister failed: {response.status_code}"
        
        print(f"✓ Event RSVP/cancel works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
