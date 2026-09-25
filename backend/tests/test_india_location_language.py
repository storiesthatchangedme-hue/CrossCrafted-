"""
Test India-specific location and language support features.
Tests: state/city/languages fields for users, churches, events.
Tests: filtering by state/language/search on churches, events, explore endpoints.
Tests: profile update with location/language fields.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@crosscrafted.com"
ADMIN_PASSWORD = "Admin@123"
NON_ADMIN_EMAIL = "sarah@example.com"
NON_ADMIN_PASSWORD = "Faith@123"


class TestAuthMeReturnsLocationFields:
    """Test that /api/auth/me returns state, city, languages for logged-in user"""
    
    def test_auth_me_returns_location_fields(self):
        """Auth/me should return state, city, languages for logged-in user"""
        session = requests.Session()
        # Login as admin (who has Karnataka, Bangalore)
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        
        # Get /api/auth/me
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200, f"Auth/me failed: {me_resp.text}"
        
        user_data = me_resp.json()
        # Verify location fields exist
        assert "state" in user_data, "state field missing from auth/me response"
        assert "city" in user_data, "city field missing from auth/me response"
        assert "languages" in user_data, "languages field missing from auth/me response"
        
        # Verify data types
        assert isinstance(user_data.get("languages", []), list), "languages should be a list"
        print(f"Auth/me returned: state={user_data.get('state')}, city={user_data.get('city')}, languages={user_data.get('languages')}")


class TestChurchesFiltering:
    """Test churches filtering by state, language, and search"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        # Login
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
    
    def test_get_churches_by_state_karnataka(self):
        """GET /api/churches?state=Karnataka returns only Karnataka churches"""
        resp = self.session.get(f"{BASE_URL}/api/churches?state=Karnataka")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        
        churches = resp.json()
        assert isinstance(churches, list), "Response should be a list"
        
        # All returned churches should have state=Karnataka
        for church in churches:
            assert church.get("state") == "Karnataka", f"Church {church.get('name')} has state={church.get('state')}, expected Karnataka"
        
        print(f"Found {len(churches)} churches in Karnataka")
    
    def test_get_churches_by_language_tamil(self):
        """GET /api/churches?language=Tamil returns Tamil-language churches"""
        resp = self.session.get(f"{BASE_URL}/api/churches?language=Tamil")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        
        churches = resp.json()
        assert isinstance(churches, list), "Response should be a list"
        
        # All returned churches should have Tamil in languages
        for church in churches:
            languages = church.get("languages", [])
            assert "Tamil" in languages, f"Church {church.get('name')} doesn't have Tamil in languages: {languages}"
        
        print(f"Found {len(churches)} Tamil-language churches")
    
    def test_get_churches_by_search_mumbai(self):
        """GET /api/churches?search=Mumbai returns Mumbai churches"""
        resp = self.session.get(f"{BASE_URL}/api/churches?search=Mumbai")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        
        churches = resp.json()
        assert isinstance(churches, list), "Response should be a list"
        
        # All returned churches should have Mumbai in name, city, or state
        for church in churches:
            name = church.get("name", "").lower()
            city = church.get("city", "").lower()
            state = church.get("state", "").lower()
            assert "mumbai" in name or "mumbai" in city or "mumbai" in state, \
                f"Church {church.get('name')} doesn't match Mumbai search"
        
        print(f"Found {len(churches)} churches matching 'Mumbai' search")
    
    def test_churches_have_location_fields(self):
        """Churches should have state, city, languages fields"""
        resp = self.session.get(f"{BASE_URL}/api/churches")
        assert resp.status_code == 200
        
        churches = resp.json()
        if len(churches) > 0:
            church = churches[0]
            # Check fields exist (may be empty strings/lists)
            assert "state" in church, "state field missing from church"
            assert "city" in church, "city field missing from church"
            assert "languages" in church, "languages field missing from church"
            print(f"Church fields verified: state={church.get('state')}, city={church.get('city')}, languages={church.get('languages')}")


class TestEventsFiltering:
    """Test events filtering by state, language, and search"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
    
    def test_get_events_by_state_kerala(self):
        """GET /api/events?state=Kerala returns Kerala events only"""
        resp = self.session.get(f"{BASE_URL}/api/events?state=Kerala")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        
        events = resp.json()
        assert isinstance(events, list), "Response should be a list"
        
        # All returned events should have state=Kerala
        for event in events:
            assert event.get("state") == "Kerala", f"Event {event.get('title')} has state={event.get('state')}, expected Kerala"
        
        print(f"Found {len(events)} events in Kerala")
    
    def test_get_events_by_language_english(self):
        """GET /api/events?language=English returns English events"""
        resp = self.session.get(f"{BASE_URL}/api/events?language=English")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        
        events = resp.json()
        assert isinstance(events, list), "Response should be a list"
        
        # All returned events should have English in languages
        for event in events:
            languages = event.get("languages", [])
            assert "English" in languages, f"Event {event.get('title')} doesn't have English in languages: {languages}"
        
        print(f"Found {len(events)} English-language events")
    
    def test_events_have_location_fields(self):
        """Events should have state, city, languages fields"""
        resp = self.session.get(f"{BASE_URL}/api/events")
        assert resp.status_code == 200
        
        events = resp.json()
        if len(events) > 0:
            event = events[0]
            assert "state" in event, "state field missing from event"
            assert "city" in event, "city field missing from event"
            assert "languages" in event, "languages field missing from event"
            print(f"Event fields verified: state={event.get('state')}, city={event.get('city')}, languages={event.get('languages')}")


class TestExploreFiltering:
    """Test explore endpoint filtering by state, language, search"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
    
    def test_explore_by_state_karnataka(self):
        """GET /api/explore?state=Karnataka returns filtered content"""
        resp = self.session.get(f"{BASE_URL}/api/explore?state=Karnataka")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        
        data = resp.json()
        assert "churches" in data, "churches missing from explore response"
        assert "events" in data, "events missing from explore response"
        
        # Churches should be filtered by Karnataka
        for church in data.get("churches", []):
            assert church.get("state") == "Karnataka", f"Church {church.get('name')} not in Karnataka"
        
        # Events should be filtered by Karnataka
        for event in data.get("events", []):
            assert event.get("state") == "Karnataka", f"Event {event.get('title')} not in Karnataka"
        
        print(f"Explore Karnataka: {len(data.get('churches', []))} churches, {len(data.get('events', []))} events")
    
    def test_explore_by_language(self):
        """GET /api/explore?language=Hindi returns filtered content"""
        resp = self.session.get(f"{BASE_URL}/api/explore?language=Hindi")
        assert resp.status_code == 200, f"Failed: {resp.text}"
        
        data = resp.json()
        # Churches should have Hindi in languages
        for church in data.get("churches", []):
            languages = church.get("languages", [])
            assert "Hindi" in languages, f"Church {church.get('name')} doesn't have Hindi"
        
        print(f"Explore Hindi: {len(data.get('churches', []))} churches, {len(data.get('events', []))} events")
    
    def test_explore_returns_expected_structure(self):
        """Explore endpoint returns posts, churches, events, trending_users"""
        resp = self.session.get(f"{BASE_URL}/api/explore")
        assert resp.status_code == 200
        
        data = resp.json()
        assert "posts" in data, "posts missing"
        assert "churches" in data, "churches missing"
        assert "events" in data, "events missing"
        assert "trending_users" in data, "trending_users missing"
        print(f"Explore structure verified: posts={len(data.get('posts', []))}, churches={len(data.get('churches', []))}, events={len(data.get('events', []))}")


class TestUserProfileUpdate:
    """Test PUT /api/users/me with state/city/languages updates profile"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
    
    def test_update_profile_with_location_and_languages(self):
        """PUT /api/users/me with state/city/languages updates profile"""
        # Get current profile
        me_resp = self.session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        original_data = me_resp.json()
        
        # Update with new location/languages
        update_data = {
            "state": "Tamil Nadu",
            "city": "Chennai",
            "languages": ["Tamil", "English"]
        }
        
        update_resp = self.session.put(f"{BASE_URL}/api/users/me", json=update_data)
        assert update_resp.status_code == 200, f"Update failed: {update_resp.text}"
        
        updated_user = update_resp.json()
        assert updated_user.get("state") == "Tamil Nadu", f"State not updated: {updated_user.get('state')}"
        assert updated_user.get("city") == "Chennai", f"City not updated: {updated_user.get('city')}"
        assert "Tamil" in updated_user.get("languages", []), "Tamil not in languages"
        assert "English" in updated_user.get("languages", []), "English not in languages"
        
        # Verify via GET /api/auth/me
        verify_resp = self.session.get(f"{BASE_URL}/api/auth/me")
        assert verify_resp.status_code == 200
        verified_user = verify_resp.json()
        assert verified_user.get("state") == "Tamil Nadu"
        assert verified_user.get("city") == "Chennai"
        
        # Restore original values
        restore_data = {
            "state": original_data.get("state", "Karnataka"),
            "city": original_data.get("city", "Bangalore"),
            "languages": original_data.get("languages", ["English", "Kannada"])
        }
        self.session.put(f"{BASE_URL}/api/users/me", json=restore_data)
        
        print("Profile update with location/languages verified successfully")


class TestChurchCreateWithLocation:
    """Test church creation with state/city/languages fields"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.created_church_id = None
    
    def test_create_church_with_location_fields(self):
        """POST /api/churches with state/city/languages creates church correctly"""
        unique_name = f"TEST_Church_{uuid.uuid4().hex[:8]}"
        church_data = {
            "name": unique_name,
            "description": "Test church with India location",
            "location": "123 Test Street, Hyderabad",
            "service_times": "Sunday 10AM",
            "state": "Telangana",
            "city": "Hyderabad",
            "languages": ["Telugu", "English"]
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/churches", json=church_data)
        assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
        
        created = create_resp.json()
        self.created_church_id = created.get("_id")
        
        assert created.get("state") == "Telangana", f"State mismatch: {created.get('state')}"
        assert created.get("city") == "Hyderabad", f"City mismatch: {created.get('city')}"
        assert "Telugu" in created.get("languages", []), "Telugu not in languages"
        assert "English" in created.get("languages", []), "English not in languages"
        
        # Verify via GET
        get_resp = self.session.get(f"{BASE_URL}/api/churches/{self.created_church_id}")
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched.get("state") == "Telangana"
        assert fetched.get("city") == "Hyderabad"
        
        print(f"Church created with location fields: {unique_name}")
    
    def teardown_method(self, method):
        """Cleanup created test church"""
        if self.created_church_id:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/churches/{self.created_church_id}")
            except:
                pass


class TestEventCreateWithLocation:
    """Test event creation with state/city/languages fields"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        self.created_event_id = None
    
    def test_create_event_with_location_fields(self):
        """POST /api/events with state/city/languages creates event correctly"""
        unique_title = f"TEST_Event_{uuid.uuid4().hex[:8]}"
        event_data = {
            "title": unique_title,
            "description": "Test event with India location",
            "date": "2026-03-15T10:00:00",
            "location": "Convention Center, Kochi",
            "state": "Kerala",
            "city": "Kochi",
            "languages": ["Malayalam", "English"]
        }
        
        create_resp = self.session.post(f"{BASE_URL}/api/events", json=event_data)
        assert create_resp.status_code == 200, f"Create failed: {create_resp.text}"
        
        created = create_resp.json()
        self.created_event_id = created.get("_id")
        
        assert created.get("state") == "Kerala", f"State mismatch: {created.get('state')}"
        assert created.get("city") == "Kochi", f"City mismatch: {created.get('city')}"
        assert "Malayalam" in created.get("languages", []), "Malayalam not in languages"
        assert "English" in created.get("languages", []), "English not in languages"
        
        # Verify via GET
        get_resp = self.session.get(f"{BASE_URL}/api/events/{self.created_event_id}")
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched.get("state") == "Kerala"
        assert fetched.get("city") == "Kochi"
        
        print(f"Event created with location fields: {unique_title}")
    
    def teardown_method(self, method):
        """Cleanup created test event"""
        if self.created_event_id:
            try:
                self.session.delete(f"{BASE_URL}/api/admin/events/{self.created_event_id}")
            except:
                pass


class TestRegistrationWithLocation:
    """Test user registration with state/city/languages (required fields)"""
    
    def test_register_with_location_fields(self):
        """POST /api/auth/register with state/city/languages creates user correctly"""
        session = requests.Session()
        unique_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
        
        register_data = {
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Test User India",
            "username": unique_username,
            "role": "user",
            "state": "Maharashtra",
            "city": "Pune",
            "languages": ["Marathi", "Hindi", "English"]
        }
        
        register_resp = session.post(f"{BASE_URL}/api/auth/register", json=register_data)
        assert register_resp.status_code == 200, f"Register failed: {register_resp.text}"
        
        user = register_resp.json()
        assert user.get("state") == "Maharashtra", f"State mismatch: {user.get('state')}"
        assert user.get("city") == "Pune", f"City mismatch: {user.get('city')}"
        assert "Marathi" in user.get("languages", []), "Marathi not in languages"
        assert "Hindi" in user.get("languages", []), "Hindi not in languages"
        
        # Verify via auth/me
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        me_data = me_resp.json()
        assert me_data.get("state") == "Maharashtra"
        assert me_data.get("city") == "Pune"
        
        print(f"User registered with location fields: {unique_email}")
        
        # Cleanup - delete the test user (admin only)
        admin_session = requests.Session()
        admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        try:
            admin_session.delete(f"{BASE_URL}/api/admin/users/{user.get('_id')}")
        except:
            pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
