"""
Test Admin Activity Logs Feature
- GET /api/admin/logs returns logs sorted newest first
- GET /api/admin/logs?action_type=ROLE_CHANGE filters correctly
- GET /api/admin/logs?date_from=YYYY-MM-DD filters by date
- Role change creates a ROLE_CHANGE log entry
- Delete post creates a DELETE_POST log entry
- Church approve creates a CHURCH_APPROVED log entry
- Church reject creates a CHURCH_REJECTED log entry
- Delete event creates a DELETE_EVENT log entry
- Delete product creates a DELETE_PRODUCT log entry
- Non-admin cannot access /api/admin/logs (403)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@crosscrafted.com"
ADMIN_PASSWORD = "Admin@123"
NON_ADMIN_EMAIL = "sarah@example.com"
NON_ADMIN_PASSWORD = "Faith@123"


class TestAdminLogsAPI:
    """Test Admin Activity Logs API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def admin_login(self):
        """Login as admin and return session"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return self.session
    
    def non_admin_login(self):
        """Login as non-admin user"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": NON_ADMIN_EMAIL, "password": NON_ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Non-admin login failed: {response.text}"
        return self.session
    
    # ============ ACCESS CONTROL TESTS ============
    
    def test_non_admin_cannot_access_logs(self):
        """Non-admin user should get 403 when accessing /api/admin/logs"""
        self.non_admin_login()
        response = self.session.get(f"{BASE_URL}/api/admin/logs")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-admin correctly blocked from /api/admin/logs (403)")
    
    def test_unauthenticated_cannot_access_logs(self):
        """Unauthenticated request should get 401"""
        response = requests.get(f"{BASE_URL}/api/admin/logs")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Unauthenticated request correctly blocked (401)")
    
    # ============ GET LOGS TESTS ============
    
    def test_admin_can_get_logs(self):
        """Admin should be able to fetch activity logs"""
        self.admin_login()
        response = self.session.get(f"{BASE_URL}/api/admin/logs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "logs" in data, "Response should contain 'logs' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["logs"], list), "logs should be a list"
        print(f"✓ Admin can fetch logs - found {data['total']} total logs")
        return data
    
    def test_logs_sorted_newest_first(self):
        """Logs should be sorted by timestamp descending (newest first)"""
        self.admin_login()
        response = self.session.get(f"{BASE_URL}/api/admin/logs?limit=50")
        assert response.status_code == 200
        
        data = response.json()
        logs = data["logs"]
        
        if len(logs) >= 2:
            # Check that timestamps are in descending order
            for i in range(len(logs) - 1):
                ts1 = logs[i]["timestamp"]
                ts2 = logs[i + 1]["timestamp"]
                assert ts1 >= ts2, f"Logs not sorted: {ts1} should be >= {ts2}"
            print(f"✓ Logs are sorted newest first ({len(logs)} logs checked)")
        else:
            print(f"✓ Only {len(logs)} log(s) found - sorting check skipped")
    
    def test_logs_have_required_fields(self):
        """Each log entry should have required fields"""
        self.admin_login()
        response = self.session.get(f"{BASE_URL}/api/admin/logs")
        assert response.status_code == 200
        
        data = response.json()
        logs = data["logs"]
        
        required_fields = ["admin_id", "admin_name", "action_type", "target_type", "target_id", "description", "timestamp"]
        
        for log in logs[:5]:  # Check first 5 logs
            for field in required_fields:
                assert field in log, f"Log missing required field: {field}"
            # Verify _id is NOT in response (excluded via projection)
            assert "_id" not in log, "Log should not contain _id field"
        
        print(f"✓ Logs have all required fields, _id excluded")
    
    # ============ FILTER TESTS ============
    
    def test_filter_by_action_type(self):
        """Filter logs by action_type should work"""
        self.admin_login()
        
        # First get all logs to find an action type that exists
        all_response = self.session.get(f"{BASE_URL}/api/admin/logs")
        all_data = all_response.json()
        
        if all_data["total"] > 0:
            # Get the first action type
            action_type = all_data["logs"][0]["action_type"]
            
            # Filter by that action type
            filtered_response = self.session.get(f"{BASE_URL}/api/admin/logs?action_type={action_type}")
            assert filtered_response.status_code == 200
            
            filtered_data = filtered_response.json()
            
            # All returned logs should have the filtered action type
            for log in filtered_data["logs"]:
                assert log["action_type"] == action_type, f"Expected {action_type}, got {log['action_type']}"
            
            print(f"✓ Filter by action_type={action_type} works ({filtered_data['total']} logs)")
        else:
            print("✓ No logs to filter - skipping action_type filter test")
    
    def test_filter_by_date_from(self):
        """Filter logs by date_from should work"""
        self.admin_login()
        
        # Use today's date
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = self.session.get(f"{BASE_URL}/api/admin/logs?date_from={today}")
        assert response.status_code == 200
        
        data = response.json()
        
        # All returned logs should have timestamp >= date_from
        for log in data["logs"]:
            log_date = log["timestamp"][:10]  # Extract YYYY-MM-DD
            assert log_date >= today, f"Log date {log_date} should be >= {today}"
        
        print(f"✓ Filter by date_from={today} works ({data['total']} logs)")
    
    def test_filter_by_date_to(self):
        """Filter logs by date_to should work"""
        self.admin_login()
        
        # Use tomorrow's date to include today's logs
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        response = self.session.get(f"{BASE_URL}/api/admin/logs?date_to={tomorrow}")
        assert response.status_code == 200
        
        data = response.json()
        print(f"✓ Filter by date_to={tomorrow} works ({data['total']} logs)")
    
    def test_combined_filters(self):
        """Multiple filters should work together"""
        self.admin_login()
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = self.session.get(
            f"{BASE_URL}/api/admin/logs?action_type=ROLE_CHANGE&date_from={today}"
        )
        assert response.status_code == 200
        
        data = response.json()
        
        for log in data["logs"]:
            assert log["action_type"] == "ROLE_CHANGE"
            assert log["timestamp"][:10] >= today
        
        print(f"✓ Combined filters work ({data['total']} ROLE_CHANGE logs from {today})")


class TestLogCreationOnAdminActions:
    """Test that admin actions create appropriate log entries"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session for each test"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def admin_login(self):
        """Login as admin"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        return self.session
    
    def get_latest_log(self, action_type=None):
        """Get the most recent log entry"""
        params = "?limit=1"
        if action_type:
            params += f"&action_type={action_type}"
        response = self.session.get(f"{BASE_URL}/api/admin/logs{params}")
        if response.status_code == 200:
            data = response.json()
            if data["logs"]:
                return data["logs"][0]
        return None
    
    def test_role_change_creates_log(self):
        """Changing a user's role should create a ROLE_CHANGE log"""
        self.admin_login()
        
        # Get a non-admin user to change role
        users_response = self.session.get(f"{BASE_URL}/api/admin/users")
        assert users_response.status_code == 200
        users = users_response.json()["users"]
        
        # Find a non-admin user
        target_user = None
        for user in users:
            if user["role"] != "admin":
                target_user = user
                break
        
        if not target_user:
            pytest.skip("No non-admin user found to test role change")
        
        original_role = target_user["role"]
        new_role = "creator" if original_role != "creator" else "user"
        
        # Change the role
        change_response = self.session.put(
            f"{BASE_URL}/api/admin/users/{target_user['_id']}/role",
            json={"role": new_role}
        )
        assert change_response.status_code == 200, f"Role change failed: {change_response.text}"
        
        # Check that a ROLE_CHANGE log was created
        log = self.get_latest_log("ROLE_CHANGE")
        assert log is not None, "No ROLE_CHANGE log found"
        assert log["action_type"] == "ROLE_CHANGE"
        assert log["target_type"] == "user"
        assert log["target_id"] == target_user["_id"]
        assert new_role in log["description"]
        
        print(f"✓ Role change created ROLE_CHANGE log: {log['description']}")
        
        # Revert the role change
        self.session.put(
            f"{BASE_URL}/api/admin/users/{target_user['_id']}/role",
            json={"role": original_role}
        )
    
    def test_delete_post_creates_log(self):
        """Deleting a post should create a DELETE_POST log"""
        self.admin_login()
        
        # First create a test post
        create_response = self.session.post(
            f"{BASE_URL}/api/posts",
            json={"content_text": "TEST_LOG_POST - This post will be deleted for testing"}
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create test post")
        
        post_id = create_response.json()["_id"]
        
        # Delete the post via admin endpoint
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/posts/{post_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Check that a DELETE_POST log was created
        log = self.get_latest_log("DELETE_POST")
        assert log is not None, "No DELETE_POST log found"
        assert log["action_type"] == "DELETE_POST"
        assert log["target_type"] == "post"
        assert log["target_id"] == post_id
        
        print(f"✓ Delete post created DELETE_POST log: {log['description']}")
    
    def test_church_approve_creates_log(self):
        """Approving a church should create a CHURCH_APPROVED log"""
        self.admin_login()
        
        # Get a church to approve
        churches_response = self.session.get(f"{BASE_URL}/api/admin/churches")
        assert churches_response.status_code == 200
        churches = churches_response.json()["churches"]
        
        if not churches:
            pytest.skip("No churches found to test approval")
        
        target_church = churches[0]
        
        # Approve the church
        approve_response = self.session.put(
            f"{BASE_URL}/api/admin/churches/{target_church['_id']}/status",
            json={"status": "approved"}
        )
        assert approve_response.status_code == 200
        
        # Check that a CHURCH_APPROVED log was created
        log = self.get_latest_log("CHURCH_APPROVED")
        assert log is not None, "No CHURCH_APPROVED log found"
        assert log["action_type"] == "CHURCH_APPROVED"
        assert log["target_type"] == "church"
        assert log["target_id"] == target_church["_id"]
        
        print(f"✓ Church approve created CHURCH_APPROVED log: {log['description']}")
    
    def test_church_reject_creates_log(self):
        """Rejecting a church should create a CHURCH_REJECTED log"""
        self.admin_login()
        
        # Get a church to reject
        churches_response = self.session.get(f"{BASE_URL}/api/admin/churches")
        assert churches_response.status_code == 200
        churches = churches_response.json()["churches"]
        
        if not churches:
            pytest.skip("No churches found to test rejection")
        
        target_church = churches[0]
        
        # Reject the church
        reject_response = self.session.put(
            f"{BASE_URL}/api/admin/churches/{target_church['_id']}/status",
            json={"status": "rejected"}
        )
        assert reject_response.status_code == 200
        
        # Check that a CHURCH_REJECTED log was created
        log = self.get_latest_log("CHURCH_REJECTED")
        assert log is not None, "No CHURCH_REJECTED log found"
        assert log["action_type"] == "CHURCH_REJECTED"
        assert log["target_type"] == "church"
        assert log["target_id"] == target_church["_id"]
        
        print(f"✓ Church reject created CHURCH_REJECTED log: {log['description']}")
        
        # Revert to approved
        self.session.put(
            f"{BASE_URL}/api/admin/churches/{target_church['_id']}/status",
            json={"status": "approved"}
        )
    
    def test_delete_event_creates_log(self):
        """Deleting an event should create a DELETE_EVENT log"""
        self.admin_login()
        
        # First create a test event
        create_response = self.session.post(
            f"{BASE_URL}/api/events",
            json={
                "title": "TEST_LOG_EVENT - Will be deleted",
                "description": "Test event for log testing",
                "date": "2026-12-31T18:00:00",
                "location": "Test Location"
            }
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create test event")
        
        event_id = create_response.json()["_id"]
        
        # Delete the event via admin endpoint
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/events/{event_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Check that a DELETE_EVENT log was created
        log = self.get_latest_log("DELETE_EVENT")
        assert log is not None, "No DELETE_EVENT log found"
        assert log["action_type"] == "DELETE_EVENT"
        assert log["target_type"] == "event"
        assert log["target_id"] == event_id
        
        print(f"✓ Delete event created DELETE_EVENT log: {log['description']}")
    
    def test_delete_product_creates_log(self):
        """Deleting a product should create a DELETE_PRODUCT log"""
        self.admin_login()
        
        # First create a test product
        create_response = self.session.post(
            f"{BASE_URL}/api/products",
            json={
                "title": "TEST_LOG_PRODUCT - Will be deleted",
                "description": "Test product for log testing",
                "price": 9.99
            }
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create test product")
        
        product_id = create_response.json()["_id"]
        
        # Delete the product via admin endpoint
        delete_response = self.session.delete(f"{BASE_URL}/api/admin/products/{product_id}")
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Check that a DELETE_PRODUCT log was created
        log = self.get_latest_log("DELETE_PRODUCT")
        assert log is not None, "No DELETE_PRODUCT log found"
        assert log["action_type"] == "DELETE_PRODUCT"
        assert log["target_type"] == "product"
        assert log["target_id"] == product_id
        
        print(f"✓ Delete product created DELETE_PRODUCT log: {log['description']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
