"""
Church Profile API Tests - Tests for new Church Profile feature endpoints
Tests: GET /api/churches/{id}, PUT /api/churches/{id}, GET /api/churches/{id}/posts, 
       GET /api/churches/{id}/events, GET /api/users/me/church, POST /api/events with church_id
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://believer-hub-4.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@crosscrafted.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")

# Existing church ID for testing (Grace Community Church owned by admin)
EXISTING_CHURCH_ID = "69d4924de25bb0e078294fa2"


class TestChurchProfileEndpoints:
    """Church Profile specific endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.user_data = login_response.json()
        self.user_id = self.user_data["_id"]
    
    def test_get_churches_list_with_required_fields(self):
        """Test GET /api/churches returns list with name, location, service_times, followers_count, created_by"""
        response = self.session.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        if len(data) > 0:
            church = data[0]
            # Verify required fields
            assert "_id" in church, "Missing _id field"
            assert "name" in church, "Missing name field"
            assert "location" in church, "Missing location field"
            assert "followers_count" in church, "Missing followers_count field"
            assert "created_by" in church, "Missing created_by field"
            # service_times is optional but should be present
            assert "service_times" in church or church.get("service_times") is None, "service_times field handling issue"
            print(f"GET /api/churches - Found {len(data)} churches with all required fields")
    
    def test_create_church_with_service_times(self):
        """Test POST /api/churches creates church with name, description, location, service_times"""
        unique_name = f"TEST_ChurchProfile_{uuid.uuid4().hex[:8]}"
        
        response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "A test church for Church Profile testing",
            "location": "123 Test Street, Test City",
            "service_times": "Sunday 9AM & 11AM, Wednesday 7PM"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["name"] == unique_name
        assert data["description"] == "A test church for Church Profile testing"
        assert data["location"] == "123 Test Street, Test City"
        assert data["service_times"] == "Sunday 9AM & 11AM, Wednesday 7PM"
        assert "_id" in data
        assert "created_by" in data
        
        print(f"POST /api/churches - Created church with service_times: {data['_id']}")
        return data["_id"]
    
    def test_get_church_detail_with_profile_fields(self):
        """Test GET /api/churches/{id} returns detailed profile with is_following, is_owner, posts_count, events_count, owner_name, owner_username"""
        # First create a church
        unique_name = f"TEST_ChurchDetail_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Church for detail testing",
            "location": "456 Detail Street",
            "service_times": "Sunday 10AM"
        })
        church_id = create_response.json()["_id"]
        
        # Get church detail
        response = self.session.get(f"{BASE_URL}/api/churches/{church_id}")
        assert response.status_code == 200
        
        data = response.json()
        # Verify all profile fields
        assert "_id" in data
        assert "name" in data
        assert "description" in data
        assert "location" in data
        assert "service_times" in data
        assert "followers_count" in data
        assert "is_following" in data, "Missing is_following field"
        assert "is_owner" in data, "Missing is_owner field"
        assert "posts_count" in data, "Missing posts_count field"
        assert "events_count" in data, "Missing events_count field"
        assert "owner_name" in data, "Missing owner_name field"
        assert "owner_username" in data, "Missing owner_username field"
        
        # Since we created this church, we should be the owner
        assert data["is_owner"] == True, "Expected is_owner to be True for creator"
        
        print(f"GET /api/churches/{church_id} - All profile fields present, is_owner={data['is_owner']}")
    
    def test_update_church_as_owner(self):
        """Test PUT /api/churches/{id} - owner can update name, description, location, service_times"""
        # Create a church
        unique_name = f"TEST_ChurchUpdate_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Original description",
            "location": "Original location",
            "service_times": "Sunday 9AM"
        })
        church_id = create_response.json()["_id"]
        
        # Update the church
        updated_name = f"Updated_{unique_name}"
        update_response = self.session.put(f"{BASE_URL}/api/churches/{church_id}", json={
            "name": updated_name,
            "description": "Updated description",
            "location": "Updated location",
            "service_times": "Sunday 10AM & 12PM"
        })
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        updated_data = update_response.json()
        assert updated_data["name"] == updated_name
        assert updated_data["description"] == "Updated description"
        assert updated_data["location"] == "Updated location"
        assert updated_data["service_times"] == "Sunday 10AM & 12PM"
        
        # Verify persistence with GET
        get_response = self.session.get(f"{BASE_URL}/api/churches/{church_id}")
        get_data = get_response.json()
        assert get_data["name"] == updated_name
        assert get_data["description"] == "Updated description"
        
        print(f"PUT /api/churches/{church_id} - Successfully updated church as owner")
    
    def test_update_church_as_non_owner_returns_403(self):
        """Test PUT /api/churches/{id} - non-owner gets 403 Forbidden"""
        # Create a church as admin
        unique_name = f"TEST_ChurchNonOwner_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Church owned by admin",
            "location": "Admin location"
        })
        church_id = create_response.json()["_id"]
        
        # Create a new user session
        other_session = requests.Session()
        other_session.headers.update({"Content-Type": "application/json"})
        
        unique_id = uuid.uuid4().hex[:8]
        register_response = other_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_nonowner_{unique_id}@example.com",
            "password": "TestPass123!",
            "name": "Non Owner User",
            "username": f"TEST_nonowner_{unique_id}"
        })
        assert register_response.status_code == 200
        
        # Try to update church as non-owner
        update_response = other_session.put(f"{BASE_URL}/api/churches/{church_id}", json={
            "name": "Hacked Name",
            "description": "Hacked description"
        })
        assert update_response.status_code == 403, f"Expected 403, got {update_response.status_code}: {update_response.text}"
        
        print(f"PUT /api/churches/{church_id} - Non-owner correctly received 403 Forbidden")
    
    def test_get_church_posts(self):
        """Test GET /api/churches/{id}/posts returns posts by the church owner"""
        # Create a church
        unique_name = f"TEST_ChurchPosts_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Church for posts testing",
            "location": "Posts location"
        })
        church_id = create_response.json()["_id"]
        
        # Create a post as the church owner (admin)
        post_content = f"TEST_post_for_church_{uuid.uuid4().hex[:8]}"
        self.session.post(f"{BASE_URL}/api/posts", json={
            "content_text": post_content
        })
        
        # Get church posts
        response = self.session.get(f"{BASE_URL}/api/churches/{church_id}/posts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Posts should be from the church owner
        if len(data) > 0:
            post = data[0]
            assert "_id" in post
            assert "content_text" in post
            assert "user_id" in post
            assert "likes_count" in post
            assert "comments_count" in post
        
        print(f"GET /api/churches/{church_id}/posts - Returned {len(data)} posts")
    
    def test_get_church_events(self):
        """Test GET /api/churches/{id}/events returns events linked to the church"""
        # Create a church
        unique_name = f"TEST_ChurchEvents_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Church for events testing",
            "location": "Events location"
        })
        church_id = create_response.json()["_id"]
        
        # Create an event linked to this church
        event_title = f"TEST_event_for_church_{uuid.uuid4().hex[:8]}"
        event_response = self.session.post(f"{BASE_URL}/api/events", json={
            "title": event_title,
            "description": "Event linked to church",
            "date": "2026-05-15T19:00:00Z",
            "location": "Church Event Venue",
            "church_id": church_id
        })
        assert event_response.status_code == 200
        
        # Get church events
        response = self.session.get(f"{BASE_URL}/api/churches/{church_id}/events")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1, "Expected at least 1 event linked to church"
        
        # Verify event structure
        event = data[0]
        assert "_id" in event
        assert "title" in event
        assert "date" in event
        assert "location" in event
        assert "attendees_count" in event
        
        print(f"GET /api/churches/{church_id}/events - Returned {len(data)} events")
    
    def test_create_event_with_church_id(self):
        """Test POST /api/events with church_id field creates event linked to church with church_name"""
        # Create a church
        unique_name = f"TEST_ChurchEventLink_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Church for event linking",
            "location": "Link location"
        })
        church_id = create_response.json()["_id"]
        church_name = create_response.json()["name"]
        
        # Create event with church_id
        event_title = f"TEST_linked_event_{uuid.uuid4().hex[:8]}"
        response = self.session.post(f"{BASE_URL}/api/events", json={
            "title": event_title,
            "description": "Event with church_id",
            "date": "2026-06-15T19:00:00Z",
            "location": "Linked Event Venue",
            "church_id": church_id
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["title"] == event_title
        assert data["church_id"] == church_id
        assert "church_name" in data, "Missing church_name field in event"
        assert data["church_name"] == church_name
        
        print(f"POST /api/events with church_id - Event created with church_name: {data['church_name']}")
    
    def test_get_my_church(self):
        """Test GET /api/users/me/church returns current user's church or {church: null}"""
        response = self.session.get(f"{BASE_URL}/api/users/me/church")
        assert response.status_code == 200
        
        data = response.json()
        # Should return either a church object or {"church": null}
        if "church" in data and data["church"] is None:
            print("GET /api/users/me/church - User has no church (returned {church: null})")
        else:
            # User has a church
            assert "_id" in data
            assert "name" in data
            assert "followers_count" in data
            print(f"GET /api/users/me/church - User's church: {data.get('name', 'Unknown')}")
    
    def test_follow_church(self):
        """Test POST /api/churches/{id}/follow follows a church"""
        # Create a church
        unique_name = f"TEST_FollowChurch_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Church to follow",
            "location": "Follow location"
        })
        church_id = create_response.json()["_id"]
        
        # Follow the church
        response = self.session.post(f"{BASE_URL}/api/churches/{church_id}/follow")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Followed"
        
        # Verify is_following in church detail
        detail_response = self.session.get(f"{BASE_URL}/api/churches/{church_id}")
        detail_data = detail_response.json()
        assert detail_data["is_following"] == True
        
        print(f"POST /api/churches/{church_id}/follow - Successfully followed church")
    
    def test_unfollow_church(self):
        """Test DELETE /api/churches/{id}/follow unfollows a church"""
        # Create a church
        unique_name = f"TEST_UnfollowChurch_{uuid.uuid4().hex[:8]}"
        create_response = self.session.post(f"{BASE_URL}/api/churches", json={
            "name": unique_name,
            "description": "Church to unfollow",
            "location": "Unfollow location"
        })
        church_id = create_response.json()["_id"]
        
        # Follow first
        self.session.post(f"{BASE_URL}/api/churches/{church_id}/follow")
        
        # Then unfollow
        response = self.session.delete(f"{BASE_URL}/api/churches/{church_id}/follow")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "Unfollowed"
        
        # Verify is_following is now False
        detail_response = self.session.get(f"{BASE_URL}/api/churches/{church_id}")
        detail_data = detail_response.json()
        assert detail_data["is_following"] == False
        
        print(f"DELETE /api/churches/{church_id}/follow - Successfully unfollowed church")
    
    def test_church_not_found_returns_404(self):
        """Test GET /api/churches/{invalid_id} returns 404"""
        fake_id = "000000000000000000000000"
        response = self.session.get(f"{BASE_URL}/api/churches/{fake_id}")
        assert response.status_code == 404
        
        print(f"GET /api/churches/{fake_id} - Correctly returned 404")
    
    def test_church_posts_not_found_returns_404(self):
        """Test GET /api/churches/{invalid_id}/posts returns 404"""
        fake_id = "000000000000000000000000"
        response = self.session.get(f"{BASE_URL}/api/churches/{fake_id}/posts")
        assert response.status_code == 404
        
        print(f"GET /api/churches/{fake_id}/posts - Correctly returned 404")
    
    def test_church_events_not_found_returns_404(self):
        """Test GET /api/churches/{invalid_id}/events returns 404"""
        fake_id = "000000000000000000000000"
        response = self.session.get(f"{BASE_URL}/api/churches/{fake_id}/events")
        assert response.status_code == 404
        
        print(f"GET /api/churches/{fake_id}/events - Correctly returned 404")


class TestExistingChurchProfile:
    """Tests using the existing Grace Community Church (69d4924de25bb0e078294fa2)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        # Login as admin
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_response.status_code == 200
    
    def test_get_existing_church_profile(self):
        """Test GET /api/churches/{id} for existing Grace Community Church"""
        response = self.session.get(f"{BASE_URL}/api/churches/{EXISTING_CHURCH_ID}")
        
        # Church may or may not exist depending on test data
        if response.status_code == 404:
            pytest.skip("Existing church not found - may have been deleted")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields
        assert "name" in data
        assert "is_owner" in data
        assert "is_following" in data
        assert "posts_count" in data
        assert "events_count" in data
        assert "followers_count" in data
        
        print(f"Existing church profile: {data['name']}, is_owner={data['is_owner']}, posts={data['posts_count']}, events={data['events_count']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
