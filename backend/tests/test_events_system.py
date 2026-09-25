"""
Events System API Tests - Iteration 4
Tests for event listing, detail, registration, attendees, and church integration
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://believer-hub-4.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@crosscrafted.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")

# Existing test data
EXISTING_EVENT_ID = "69d4809ee270e72e0e5deeff"  # Test Worship Night
EXISTING_CHURCH_ID = "69d4924de25bb0e078294fa2"  # Grace Community Church


class TestEventsListEndpoint:
    """Tests for GET /api/events - event listing with enriched fields"""
    
    def test_get_events_returns_list(self, api_client):
        """GET /api/events returns list of events"""
        response = api_client.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/events returns {len(data)} events")
    
    def test_events_have_required_fields(self, api_client):
        """Events have is_registered, attendees_count, church_name, creator_name"""
        response = api_client.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        events = response.json()
        
        if len(events) > 0:
            event = events[0]
            # Check required fields
            assert "attendees_count" in event, "Missing attendees_count"
            assert "is_registered" in event, "Missing is_registered"
            assert isinstance(event["attendees_count"], int), "attendees_count should be int"
            assert isinstance(event["is_registered"], bool), "is_registered should be bool"
            print(f"✓ Event has attendees_count={event['attendees_count']}, is_registered={event['is_registered']}")
            
            # Check optional enriched fields (may be present if church_id exists)
            if event.get("church_id"):
                assert "church_name" in event or event.get("church_name") is not None, "Missing church_name for event with church_id"
                print(f"✓ Event has church_name={event.get('church_name')}")
            
            if event.get("created_by"):
                assert "creator_name" in event, "Missing creator_name"
                print(f"✓ Event has creator_name={event.get('creator_name')}")
        else:
            pytest.skip("No events in database to test")
    
    def test_events_is_registered_for_authenticated_user(self, authenticated_client):
        """Authenticated user sees is_registered status"""
        response = authenticated_client.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        events = response.json()
        
        if len(events) > 0:
            # All events should have is_registered field
            for event in events:
                assert "is_registered" in event
            print(f"✓ All {len(events)} events have is_registered field for authenticated user")


class TestEventDetailEndpoint:
    """Tests for GET /api/events/{id} - detailed event with attendee previews"""
    
    def test_get_event_detail(self, api_client):
        """GET /api/events/{id} returns event details"""
        response = api_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}")
        assert response.status_code == 200
        event = response.json()
        
        # Basic fields
        assert event["_id"] == EXISTING_EVENT_ID
        assert "title" in event
        assert "description" in event
        assert "date" in event
        assert "location" in event
        print(f"✓ Event detail: {event['title']}")
    
    def test_event_detail_has_enriched_fields(self, api_client):
        """Event detail has is_registered, is_creator, attendees_count, attendee_previews"""
        response = api_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}")
        assert response.status_code == 200
        event = response.json()
        
        # Required enriched fields
        assert "attendees_count" in event
        assert "is_registered" in event
        assert "is_creator" in event
        assert "attendee_previews" in event
        
        assert isinstance(event["attendees_count"], int)
        assert isinstance(event["is_registered"], bool)
        assert isinstance(event["is_creator"], bool)
        assert isinstance(event["attendee_previews"], list)
        
        print(f"✓ Event has attendees_count={event['attendees_count']}, is_registered={event['is_registered']}, is_creator={event['is_creator']}")
        print(f"✓ Event has {len(event['attendee_previews'])} attendee previews")
    
    def test_event_detail_attendee_previews_structure(self, api_client):
        """Attendee previews have name, username, profile_image"""
        response = api_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}")
        assert response.status_code == 200
        event = response.json()
        
        if len(event.get("attendee_previews", [])) > 0:
            attendee = event["attendee_previews"][0]
            assert "name" in attendee
            assert "username" in attendee
            assert "profile_image" in attendee
            print(f"✓ Attendee preview: {attendee['name']} (@{attendee['username']})")
        else:
            print("✓ No attendee previews (event may have no registrations)")
    
    def test_event_detail_has_church_info(self, api_client):
        """Event with church_id has church_name and church_obj_id"""
        response = api_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}")
        assert response.status_code == 200
        event = response.json()
        
        if event.get("church_id"):
            assert "church_name" in event
            assert "church_obj_id" in event
            print(f"✓ Event linked to church: {event.get('church_name')}")
        else:
            print("✓ Event not linked to a church")
    
    def test_event_detail_has_creator_info(self, api_client):
        """Event has creator_name and creator_username"""
        response = api_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}")
        assert response.status_code == 200
        event = response.json()
        
        if event.get("created_by"):
            assert "creator_name" in event
            print(f"✓ Event created by: {event.get('creator_name')}")
    
    def test_event_not_found(self, api_client):
        """GET /api/events/{invalid_id} returns 404"""
        response = api_client.get(f"{BASE_URL}/api/events/000000000000000000000000")
        assert response.status_code == 404
        print("✓ Invalid event ID returns 404")


class TestEventRegistration:
    """Tests for POST/DELETE /api/events/{id}/register"""
    
    def test_register_for_event(self, authenticated_client):
        """POST /api/events/{id}/register registers user"""
        # First unregister if already registered
        authenticated_client.delete(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        
        # Register
        response = authenticated_client.post(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        assert response.status_code in [200, 400]  # 400 if already registered
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"✓ Registration successful: {data['message']}")
        else:
            print("✓ Already registered (expected)")
    
    def test_register_already_registered(self, authenticated_client):
        """POST /api/events/{id}/register when already registered returns 400"""
        # First ensure registered
        authenticated_client.post(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        
        # Try to register again
        response = authenticated_client.post(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        assert response.status_code == 400
        data = response.json()
        assert "Already registered" in data.get("detail", "")
        print("✓ Double registration returns 400 'Already registered'")
    
    def test_unregister_from_event(self, authenticated_client):
        """DELETE /api/events/{id}/register unregisters user"""
        # First ensure registered
        authenticated_client.post(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        
        # Unregister
        response = authenticated_client.delete(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Unregistration successful: {data['message']}")
    
    def test_unregister_not_registered(self, authenticated_client):
        """DELETE /api/events/{id}/register when not registered returns 404"""
        # First ensure not registered
        authenticated_client.delete(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        
        # Try to unregister again
        response = authenticated_client.delete(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        assert response.status_code == 404
        print("✓ Unregister when not registered returns 404")
    
    def test_registration_updates_is_registered(self, authenticated_client):
        """Registration changes is_registered in event detail"""
        # Unregister first
        authenticated_client.delete(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        
        # Check is_registered is False
        response = authenticated_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}")
        assert response.status_code == 200
        assert response.json()["is_registered"] == False
        print("✓ is_registered=False before registration")
        
        # Register
        authenticated_client.post(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        
        # Check is_registered is True
        response = authenticated_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}")
        assert response.status_code == 200
        assert response.json()["is_registered"] == True
        print("✓ is_registered=True after registration")
    
    def test_register_requires_auth(self, api_client):
        """POST /api/events/{id}/register requires authentication"""
        response = api_client.post(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/register")
        assert response.status_code == 401
        print("✓ Registration requires authentication")


class TestEventAttendees:
    """Tests for GET /api/events/{id}/attendees - public endpoint"""
    
    def test_get_attendees_public(self, api_client):
        """GET /api/events/{id}/attendees is public"""
        response = api_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/attendees")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/events/{EXISTING_EVENT_ID}/attendees returns {len(data)} attendees (public)")
    
    def test_attendees_have_required_fields(self, api_client):
        """Attendees have name, username, profile_image"""
        response = api_client.get(f"{BASE_URL}/api/events/{EXISTING_EVENT_ID}/attendees")
        assert response.status_code == 200
        attendees = response.json()
        
        if len(attendees) > 0:
            attendee = attendees[0]
            assert "name" in attendee
            assert "username" in attendee
            assert "profile_image" in attendee
            assert "_id" in attendee
            print(f"✓ Attendee: {attendee['name']} (@{attendee['username']})")
        else:
            print("✓ No attendees yet")
    
    def test_attendees_event_not_found(self, api_client):
        """GET /api/events/{invalid_id}/attendees returns 404"""
        response = api_client.get(f"{BASE_URL}/api/events/000000000000000000000000/attendees")
        assert response.status_code == 404
        print("✓ Invalid event ID returns 404 for attendees")


class TestCreateEventWithChurch:
    """Tests for POST /api/events with church_id"""
    
    def test_create_event_with_church_id(self, authenticated_client):
        """POST /api/events with church_id stores church_name"""
        unique_id = str(uuid.uuid4())[:8]
        event_data = {
            "title": f"TEST_ChurchEvent_{unique_id}",
            "description": "Event linked to church",
            "date": "2026-07-15T19:00:00Z",
            "location": "Church Venue",
            "church_id": EXISTING_CHURCH_ID
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/events", json=event_data)
        assert response.status_code == 200
        event = response.json()
        
        assert event["title"] == event_data["title"]
        assert event["church_id"] == EXISTING_CHURCH_ID
        assert "church_name" in event
        assert event["church_name"] == "Grace Community Church"
        
        print(f"✓ Created event '{event['title']}' linked to church '{event['church_name']}'")
        
        # Cleanup
        # Note: No delete endpoint for events, so we leave it
    
    def test_create_event_without_church_id(self, authenticated_client):
        """POST /api/events without church_id works"""
        unique_id = str(uuid.uuid4())[:8]
        event_data = {
            "title": f"TEST_NoChurchEvent_{unique_id}",
            "description": "Event without church",
            "date": "2026-08-15T19:00:00Z",
            "location": "General Venue"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/events", json=event_data)
        assert response.status_code == 200
        event = response.json()
        
        assert event["title"] == event_data["title"]
        assert event.get("church_id", "") == ""
        
        print(f"✓ Created event '{event['title']}' without church")


class TestChurchEventsEndpoint:
    """Tests for GET /api/churches/{id}/events with is_registered"""
    
    def test_church_events_have_is_registered(self, authenticated_client):
        """GET /api/churches/{id}/events returns is_registered for authenticated user"""
        response = authenticated_client.get(f"{BASE_URL}/api/churches/{EXISTING_CHURCH_ID}/events")
        assert response.status_code == 200
        events = response.json()
        
        if len(events) > 0:
            for event in events:
                assert "is_registered" in event
                assert "attendees_count" in event
            print(f"✓ Church events ({len(events)}) have is_registered field")
        else:
            print("✓ No events for this church")
    
    def test_church_events_public(self, api_client):
        """GET /api/churches/{id}/events works without auth"""
        response = api_client.get(f"{BASE_URL}/api/churches/{EXISTING_CHURCH_ID}/events")
        assert response.status_code == 200
        events = response.json()
        
        if len(events) > 0:
            # Without auth, is_registered should be False
            for event in events:
                assert event.get("is_registered") == False
            print(f"✓ Church events ({len(events)}) have is_registered=False for unauthenticated user")
        else:
            print("✓ No events for this church")


# Fixtures
@pytest.fixture
def api_client():
    """Shared requests session without auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def authenticated_client(api_client):
    """Session with auth cookies"""
    # Login
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    # Cookies are automatically stored in session
    return api_client
