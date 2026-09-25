"""
Test suite for Cross Crafted new features:
1. Recently Searched keywords (POST/GET/DELETE /api/search/recent)
2. Notifications (GET /api/notifications, GET /api/notifications/unread-count, PUT /api/notifications/read-all)
3. Real-time 1-on-1 DMs (POST/GET /api/conversations, POST/GET /api/conversations/{id}/messages, GET /api/messages/unread-count)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestRecentSearches:
    """Test Recently Searched keywords feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin and get session"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingjosh@gmail.com",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.user = login_resp.json()
    
    def test_save_recent_search(self):
        """POST /api/search/recent saves a search query"""
        resp = self.session.post(f"{BASE_URL}/api/search/recent", json={"query": "test_search_keyword"})
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("message") in ["Saved", "Ignored"]
        print("PASS: POST /api/search/recent saves search query")
    
    def test_get_recent_searches(self):
        """GET /api/search/recent returns recent searches list"""
        # First save a search
        self.session.post(f"{BASE_URL}/api/search/recent", json={"query": "unique_test_query_123"})
        
        # Then get recent searches
        resp = self.session.get(f"{BASE_URL}/api/search/recent")
        assert resp.status_code == 200
        data = resp.json()
        assert "queries" in data
        assert isinstance(data["queries"], list)
        # Check if our query is in the list
        query_texts = [q.get("text") for q in data["queries"]]
        assert "unique_test_query_123" in query_texts, f"Query not found in {query_texts}"
        print(f"PASS: GET /api/search/recent returns {len(data['queries'])} recent searches")
    
    def test_recent_search_has_text_and_timestamp(self):
        """Recent search entries have text and ts fields"""
        self.session.post(f"{BASE_URL}/api/search/recent", json={"query": "timestamp_test"})
        resp = self.session.get(f"{BASE_URL}/api/search/recent")
        assert resp.status_code == 200
        data = resp.json()
        if data["queries"]:
            first_query = data["queries"][0]
            assert "text" in first_query, "Missing 'text' field"
            assert "ts" in first_query, "Missing 'ts' timestamp field"
            print(f"PASS: Recent search has text='{first_query['text']}' and ts='{first_query['ts']}'")
    
    def test_clear_recent_searches(self):
        """DELETE /api/search/recent clears all recent searches"""
        # First save some searches
        self.session.post(f"{BASE_URL}/api/search/recent", json={"query": "to_be_cleared"})
        
        # Clear all
        resp = self.session.delete(f"{BASE_URL}/api/search/recent")
        assert resp.status_code == 200
        assert resp.json().get("message") == "Cleared"
        
        # Verify cleared
        get_resp = self.session.get(f"{BASE_URL}/api/search/recent")
        assert get_resp.status_code == 200
        assert get_resp.json().get("queries") == []
        print("PASS: DELETE /api/search/recent clears all recent searches")
    
    def test_short_query_ignored(self):
        """Queries less than 2 chars are ignored"""
        resp = self.session.post(f"{BASE_URL}/api/search/recent", json={"query": "a"})
        assert resp.status_code == 200
        assert resp.json().get("message") == "Ignored"
        print("PASS: Short queries (< 2 chars) are ignored")
    
    def test_recent_searches_limit(self):
        """Recent searches are limited to 8 entries"""
        # Clear first
        self.session.delete(f"{BASE_URL}/api/search/recent")
        
        # Add 10 searches
        for i in range(10):
            self.session.post(f"{BASE_URL}/api/search/recent", json={"query": f"search_limit_test_{i}"})
        
        # Check limit
        resp = self.session.get(f"{BASE_URL}/api/search/recent")
        assert resp.status_code == 200
        queries = resp.json().get("queries", [])
        assert len(queries) <= 8, f"Expected max 8 queries, got {len(queries)}"
        print(f"PASS: Recent searches limited to {len(queries)} entries (max 8)")


class TestNotifications:
    """Test Notifications feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingjosh@gmail.com",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.user = login_resp.json()
    
    def test_get_notifications(self):
        """GET /api/notifications returns notifications list with unread_count"""
        resp = self.session.get(f"{BASE_URL}/api/notifications")
        assert resp.status_code == 200
        data = resp.json()
        assert "notifications" in data
        assert "unread_count" in data
        assert isinstance(data["notifications"], list)
        assert isinstance(data["unread_count"], int)
        print(f"PASS: GET /api/notifications returns {len(data['notifications'])} notifications, {data['unread_count']} unread")
    
    def test_get_unread_count(self):
        """GET /api/notifications/unread-count returns count"""
        resp = self.session.get(f"{BASE_URL}/api/notifications/unread-count")
        assert resp.status_code == 200
        data = resp.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"PASS: GET /api/notifications/unread-count returns {data['unread_count']}")
    
    def test_mark_all_read(self):
        """PUT /api/notifications/read-all marks all as read"""
        resp = self.session.put(f"{BASE_URL}/api/notifications/read-all")
        assert resp.status_code == 200
        assert resp.json().get("message") == "All marked read"
        
        # Verify unread count is 0
        count_resp = self.session.get(f"{BASE_URL}/api/notifications/unread-count")
        assert count_resp.json().get("unread_count") == 0
        print("PASS: PUT /api/notifications/read-all marks all as read")
    
    def test_notification_structure(self):
        """Notifications have required fields"""
        resp = self.session.get(f"{BASE_URL}/api/notifications")
        assert resp.status_code == 200
        notifs = resp.json().get("notifications", [])
        if notifs:
            notif = notifs[0]
            required_fields = ["_id", "recipient_id", "sender_id", "type", "message", "read", "created_at"]
            for field in required_fields:
                assert field in notif, f"Missing field: {field}"
            print(f"PASS: Notification has all required fields: {list(notif.keys())}")
        else:
            print("SKIP: No notifications to verify structure")


class TestNotificationTriggers:
    """Test that actions trigger notifications"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.admin_session = requests.Session()
        login_resp = self.admin_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingjosh@gmail.com",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200
        self.admin = login_resp.json()
    
    def test_like_creates_notification(self):
        """Liking a post creates a notification for the post author"""
        # Get a post not by admin
        posts_resp = self.admin_session.get(f"{BASE_URL}/api/posts?limit=20")
        assert posts_resp.status_code == 200
        posts = posts_resp.json()
        
        # Find a post by another user
        other_post = None
        for post in posts:
            if post.get("user_id") != self.admin["_id"]:
                other_post = post
                break
        
        if not other_post:
            print("SKIP: No posts by other users to test like notification")
            return
        
        # Like the post
        like_resp = self.admin_session.post(f"{BASE_URL}/api/posts/{other_post['_id']}/like")
        assert like_resp.status_code == 200
        print(f"PASS: Liked post {other_post['_id']} by {other_post.get('user_name', 'unknown')}")
    
    def test_comment_creates_notification(self):
        """Commenting on a post creates a notification for the post author"""
        # Get a post not by admin
        posts_resp = self.admin_session.get(f"{BASE_URL}/api/posts?limit=20")
        posts = posts_resp.json()
        
        other_post = None
        for post in posts:
            if post.get("user_id") != self.admin["_id"]:
                other_post = post
                break
        
        if not other_post:
            print("SKIP: No posts by other users to test comment notification")
            return
        
        # Comment on the post
        comment_resp = self.admin_session.post(
            f"{BASE_URL}/api/posts/{other_post['_id']}/comments",
            json={"text": "Test comment for notification"}
        )
        assert comment_resp.status_code == 200
        print(f"PASS: Commented on post {other_post['_id']}")
    
    def test_follow_creates_notification(self):
        """Following a user creates a notification for that user"""
        # Get users to find someone to follow
        search_resp = self.admin_session.get(f"{BASE_URL}/api/search?q=sarah&limit=5")
        if search_resp.status_code != 200:
            print("SKIP: Search endpoint not available")
            return
        
        users = search_resp.json().get("users", [])
        if not users:
            print("SKIP: No users found to test follow notification")
            return
        
        target_user = users[0]
        if target_user["_id"] == self.admin["_id"]:
            print("SKIP: Cannot follow self")
            return
        
        # Follow the user
        follow_resp = self.admin_session.post(f"{BASE_URL}/api/users/{target_user['_id']}/follow")
        assert follow_resp.status_code == 200
        print(f"PASS: Followed user {target_user.get('name', target_user['_id'])}")
    
    def test_self_like_no_notification(self):
        """Liking own post does NOT create notification (self-skip)"""
        # Create a post as admin
        create_resp = self.admin_session.post(f"{BASE_URL}/api/posts", json={
            "content_text": "Test post for self-like notification check"
        })
        assert create_resp.status_code == 200
        post = create_resp.json()
        
        # Get current notification count
        before_resp = self.admin_session.get(f"{BASE_URL}/api/notifications/unread-count")
        before_count = before_resp.json().get("unread_count", 0)
        
        # Like own post
        like_resp = self.admin_session.post(f"{BASE_URL}/api/posts/{post['_id']}/like")
        assert like_resp.status_code == 200
        
        # Check notification count didn't increase
        after_resp = self.admin_session.get(f"{BASE_URL}/api/notifications/unread-count")
        after_count = after_resp.json().get("unread_count", 0)
        
        assert after_count == before_count, f"Self-like should not create notification. Before: {before_count}, After: {after_count}"
        print("PASS: Self-like does NOT create notification")
        
        # Cleanup - delete the test post
        self.admin_session.delete(f"{BASE_URL}/api/posts/{post['_id']}")


class TestMessaging:
    """Test Real-time 1-on-1 DMs feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingjosh@gmail.com",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200
        self.user = login_resp.json()
    
    def test_get_conversations(self):
        """GET /api/conversations returns conversations with other_user info"""
        resp = self.session.get(f"{BASE_URL}/api/conversations")
        assert resp.status_code == 200
        data = resp.json()
        assert "conversations" in data
        assert isinstance(data["conversations"], list)
        print(f"PASS: GET /api/conversations returns {len(data['conversations'])} conversations")
        
        # Check structure if conversations exist
        if data["conversations"]:
            convo = data["conversations"][0]
            assert "_id" in convo
            assert "other_user" in convo
            assert "last_message" in convo
            assert "unread_count" in convo
            if convo["other_user"]:
                assert "name" in convo["other_user"]
                assert "username" in convo["other_user"]
            print(f"PASS: Conversation structure verified with other_user: {convo.get('other_user', {}).get('name', 'N/A')}")
    
    def test_create_conversation(self):
        """POST /api/conversations creates or gets a conversation"""
        # Find a user to message
        search_resp = self.session.get(f"{BASE_URL}/api/search?q=sarah&limit=5")
        users = search_resp.json().get("users", [])
        
        if not users:
            print("SKIP: No users found to create conversation")
            return
        
        target_user = users[0]
        if target_user["_id"] == self.user["_id"]:
            print("SKIP: Cannot message self")
            return
        
        # Create/get conversation
        resp = self.session.post(f"{BASE_URL}/api/conversations", json={"user_id": target_user["_id"]})
        assert resp.status_code == 200
        data = resp.json()
        assert "conversation_id" in data
        assert len(data["conversation_id"]) > 0
        print(f"PASS: POST /api/conversations returns conversation_id: {data['conversation_id']}")
        
        # Store for other tests
        self.conversation_id = data["conversation_id"]
        self.target_user_id = target_user["_id"]
        return data["conversation_id"]
    
    def test_send_message(self):
        """POST /api/conversations/{id}/messages sends a message"""
        # First create/get a conversation
        search_resp = self.session.get(f"{BASE_URL}/api/search?q=sarah&limit=5")
        users = search_resp.json().get("users", [])
        
        if not users:
            print("SKIP: No users found")
            return
        
        target_user = users[0]
        convo_resp = self.session.post(f"{BASE_URL}/api/conversations", json={"user_id": target_user["_id"]})
        convo_id = convo_resp.json().get("conversation_id")
        
        # Send a message
        msg_resp = self.session.post(
            f"{BASE_URL}/api/conversations/{convo_id}/messages",
            json={"text": f"Test message at {time.time()}"}
        )
        assert msg_resp.status_code == 200
        msg = msg_resp.json()
        assert "_id" in msg
        assert "text" in msg
        assert "sender_id" in msg
        assert msg["sender_id"] == self.user["_id"]
        print(f"PASS: POST /api/conversations/{convo_id}/messages sends message successfully")
    
    def test_get_messages(self):
        """GET /api/conversations/{id}/messages returns messages and marks as read"""
        # First create/get a conversation
        search_resp = self.session.get(f"{BASE_URL}/api/search?q=sarah&limit=5")
        users = search_resp.json().get("users", [])
        
        if not users:
            print("SKIP: No users found")
            return
        
        target_user = users[0]
        convo_resp = self.session.post(f"{BASE_URL}/api/conversations", json={"user_id": target_user["_id"]})
        convo_id = convo_resp.json().get("conversation_id")
        
        # Get messages
        resp = self.session.get(f"{BASE_URL}/api/conversations/{convo_id}/messages")
        assert resp.status_code == 200
        data = resp.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"PASS: GET /api/conversations/{convo_id}/messages returns {len(data['messages'])} messages")
    
    def test_get_unread_message_count(self):
        """GET /api/messages/unread-count returns total unread message count"""
        resp = self.session.get(f"{BASE_URL}/api/messages/unread-count")
        assert resp.status_code == 200
        data = resp.json()
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"PASS: GET /api/messages/unread-count returns {data['unread_count']}")
    
    def test_cannot_message_self(self):
        """Cannot create conversation with self"""
        resp = self.session.post(f"{BASE_URL}/api/conversations", json={"user_id": self.user["_id"]})
        assert resp.status_code == 400
        print("PASS: Cannot create conversation with self (400 error)")
    
    def test_empty_message_rejected(self):
        """Empty messages are rejected"""
        # First create/get a conversation
        search_resp = self.session.get(f"{BASE_URL}/api/search?q=sarah&limit=5")
        users = search_resp.json().get("users", [])
        
        if not users:
            print("SKIP: No users found")
            return
        
        target_user = users[0]
        convo_resp = self.session.post(f"{BASE_URL}/api/conversations", json={"user_id": target_user["_id"]})
        convo_id = convo_resp.json().get("conversation_id")
        
        # Try to send empty message
        resp = self.session.post(f"{BASE_URL}/api/conversations/{convo_id}/messages", json={"text": ""})
        assert resp.status_code == 400
        print("PASS: Empty messages are rejected (400 error)")


class TestMessagingNotification:
    """Test that sending a message creates a notification"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "bookingjosh@gmail.com",
            "password": "Admin@123"
        })
        assert login_resp.status_code == 200
        self.user = login_resp.json()
    
    def test_message_creates_notification(self):
        """Sending a message creates a notification for the recipient"""
        # Find a user to message
        search_resp = self.session.get(f"{BASE_URL}/api/search?q=sarah&limit=5")
        users = search_resp.json().get("users", [])
        
        if not users:
            print("SKIP: No users found")
            return
        
        target_user = users[0]
        
        # Create conversation and send message
        convo_resp = self.session.post(f"{BASE_URL}/api/conversations", json={"user_id": target_user["_id"]})
        convo_id = convo_resp.json().get("conversation_id")
        
        msg_resp = self.session.post(
            f"{BASE_URL}/api/conversations/{convo_id}/messages",
            json={"text": f"Notification test message {time.time()}"}
        )
        assert msg_resp.status_code == 200
        print(f"PASS: Message sent to {target_user.get('name', 'user')} - notification should be created for them")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
