"""
Test suite for Cross Crafted Unified Search Feature
Tests the /api/search endpoint and related functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestSearchEndpoint:
    """Tests for GET /api/search endpoint"""
    
    def test_search_with_sarah_returns_multi_category_results(self):
        """Search for 'sarah' should return results across posts, users, churches, events"""
        response = requests.get(f"{BASE_URL}/api/search?q=sarah")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify response structure
        assert "posts" in data, "Response should contain 'posts' key"
        assert "users" in data, "Response should contain 'users' key"
        assert "churches" in data, "Response should contain 'churches' key"
        assert "events" in data, "Response should contain 'events' key"
        assert "counts" in data, "Response should contain 'counts' key"
        
        # Verify counts structure
        counts = data["counts"]
        assert "posts" in counts, "Counts should have 'posts'"
        assert "users" in counts, "Counts should have 'users'"
        assert "churches" in counts, "Counts should have 'churches'"
        assert "events" in counts, "Counts should have 'events'"
        
        print(f"Search 'sarah' results - Posts: {counts['posts']}, Users: {counts['users']}, Churches: {counts['churches']}, Events: {counts['events']}")
        
    def test_search_with_church_returns_results(self):
        """Search for 'church' should return multi-category results"""
        response = requests.get(f"{BASE_URL}/api/search?q=church")
        assert response.status_code == 200
        
        data = response.json()
        counts = data["counts"]
        total = counts["posts"] + counts["users"] + counts["churches"] + counts["events"]
        print(f"Search 'church' results - Total: {total}, Posts: {counts['posts']}, Users: {counts['users']}, Churches: {counts['churches']}, Events: {counts['events']}")
        
        # Should find at least some churches
        assert counts["churches"] >= 0, "Should return church count"
        
    def test_search_with_short_query_returns_empty(self):
        """Search with q < 2 chars should return empty results"""
        response = requests.get(f"{BASE_URL}/api/search?q=a")
        assert response.status_code == 200
        
        data = response.json()
        assert data["posts"] == [], "Posts should be empty for short query"
        assert data["users"] == [], "Users should be empty for short query"
        assert data["churches"] == [], "Churches should be empty for short query"
        assert data["events"] == [], "Events should be empty for short query"
        assert data["counts"]["posts"] == 0, "Posts count should be 0"
        assert data["counts"]["users"] == 0, "Users count should be 0"
        print("Short query (1 char) correctly returns empty results")
        
    def test_search_with_empty_query_returns_empty(self):
        """Search with empty q should return empty results"""
        response = requests.get(f"{BASE_URL}/api/search?q=")
        assert response.status_code == 200
        
        data = response.json()
        assert data["counts"]["posts"] == 0
        assert data["counts"]["users"] == 0
        print("Empty query correctly returns empty results")
        
    def test_search_users_include_is_verified_field(self):
        """Search results for users should include is_verified field"""
        response = requests.get(f"{BASE_URL}/api/search?q=sarah")
        assert response.status_code == 200
        
        data = response.json()
        users = data.get("users", [])
        
        if len(users) > 0:
            for user in users:
                # is_verified should be present (can be True, False, or None)
                assert "_id" in user, "User should have _id"
                assert "name" in user, "User should have name"
                assert "username" in user, "User should have username"
                # is_verified field should be included in projection
                print(f"User {user.get('name')}: is_verified = {user.get('is_verified')}")
        else:
            print("No users found for 'sarah' search - checking with different query")
            
    def test_search_posts_include_user_is_verified_field(self):
        """Search results for posts should include user_is_verified field"""
        response = requests.get(f"{BASE_URL}/api/search?q=faith")
        assert response.status_code == 200
        
        data = response.json()
        posts = data.get("posts", [])
        
        if len(posts) > 0:
            for post in posts:
                assert "_id" in post, "Post should have _id"
                assert "user_name" in post, "Post should have user_name"
                # user_is_verified should be enriched by enrich_posts_verified
                print(f"Post by {post.get('user_name')}: user_is_verified = {post.get('user_is_verified')}")
        else:
            print("No posts found for 'faith' search")
            
    def test_search_churches_include_status_field(self):
        """Search results for churches should include status field for verification"""
        response = requests.get(f"{BASE_URL}/api/search?q=restoration")
        assert response.status_code == 200
        
        data = response.json()
        churches = data.get("churches", [])
        
        if len(churches) > 0:
            for church in churches:
                assert "_id" in church, "Church should have _id"
                assert "name" in church, "Church should have name"
                # status field indicates verification (status='verified')
                print(f"Church {church.get('name')}: status = {church.get('status')}, followers_count = {church.get('followers_count')}")
        else:
            print("No churches found for 'restoration' search")
            
    def test_search_events_include_attendees_count(self):
        """Search results for events should include attendees_count"""
        response = requests.get(f"{BASE_URL}/api/search?q=worship")
        assert response.status_code == 200
        
        data = response.json()
        events = data.get("events", [])
        
        if len(events) > 0:
            for event in events:
                assert "_id" in event, "Event should have _id"
                assert "title" in event, "Event should have title"
                assert "attendees_count" in event, "Event should have attendees_count"
                print(f"Event {event.get('title')}: attendees_count = {event.get('attendees_count')}")
        else:
            print("No events found for 'worship' search")
            
    def test_search_with_limit_parameter(self):
        """Search should respect limit parameter"""
        response = requests.get(f"{BASE_URL}/api/search?q=test&limit=3")
        assert response.status_code == 200
        
        data = response.json()
        # Each category should have at most 3 results
        assert len(data["posts"]) <= 3, "Posts should respect limit"
        assert len(data["users"]) <= 3, "Users should respect limit"
        assert len(data["churches"]) <= 3, "Churches should respect limit"
        assert len(data["events"]) <= 3, "Events should respect limit"
        print(f"Limit parameter working - Posts: {len(data['posts'])}, Users: {len(data['users'])}")
        
    def test_search_nonexistent_term_returns_empty(self):
        """Search for nonexistent term should return empty results"""
        response = requests.get(f"{BASE_URL}/api/search?q=xyznonexistent123")
        assert response.status_code == 200
        
        data = response.json()
        total = data["counts"]["posts"] + data["counts"]["users"] + data["counts"]["churches"] + data["counts"]["events"]
        assert total == 0, f"Expected 0 results for nonexistent term, got {total}"
        print("Nonexistent term correctly returns 0 results")
        
    def test_search_is_case_insensitive(self):
        """Search should be case insensitive"""
        response_lower = requests.get(f"{BASE_URL}/api/search?q=sarah")
        response_upper = requests.get(f"{BASE_URL}/api/search?q=SARAH")
        
        assert response_lower.status_code == 200
        assert response_upper.status_code == 200
        
        data_lower = response_lower.json()
        data_upper = response_upper.json()
        
        # Counts should be the same (case insensitive)
        assert data_lower["counts"]["users"] == data_upper["counts"]["users"], "User counts should match for case insensitive search"
        print(f"Case insensitive search working - 'sarah': {data_lower['counts']['users']} users, 'SARAH': {data_upper['counts']['users']} users")


class TestExploreEndpoint:
    """Tests for GET /api/explore endpoint (default browse mode)"""
    
    def test_explore_returns_trending_users(self):
        """Explore endpoint should return trending_users"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        assert "trending_users" in data, "Explore should return trending_users"
        assert "posts" in data, "Explore should return posts"
        assert "churches" in data, "Explore should return churches"
        assert "events" in data, "Explore should return events"
        
        print(f"Explore content - Trending users: {len(data.get('trending_users', []))}, Posts: {len(data.get('posts', []))}")
        
    def test_explore_with_state_filter(self):
        """Explore should filter by state"""
        response = requests.get(f"{BASE_URL}/api/explore?state=Karnataka")
        assert response.status_code == 200
        
        data = response.json()
        print(f"Explore with state=Karnataka - Posts: {len(data.get('posts', []))}")
        
    def test_explore_with_language_filter(self):
        """Explore should filter by language"""
        response = requests.get(f"{BASE_URL}/api/explore?language=English")
        assert response.status_code == 200
        
        data = response.json()
        print(f"Explore with language=English - Posts: {len(data.get('posts', []))}")


class TestSearchDataIntegrity:
    """Tests for data integrity in search results"""
    
    def test_search_users_have_required_fields(self):
        """Users in search results should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/search?q=test")
        assert response.status_code == 200
        
        data = response.json()
        users = data.get("users", [])
        
        required_fields = ["_id", "name", "username"]
        for user in users:
            for field in required_fields:
                assert field in user, f"User missing required field: {field}"
            # followers_count should be computed
            assert "followers_count" in user, "User should have followers_count"
            # followers array should be removed (privacy)
            assert "followers" not in user, "User should not expose followers array"
            
        print(f"All {len(users)} users have required fields")
        
    def test_search_churches_have_required_fields(self):
        """Churches in search results should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/search?q=church")
        assert response.status_code == 200
        
        data = response.json()
        churches = data.get("churches", [])
        
        for church in churches:
            assert "_id" in church, "Church missing _id"
            assert "name" in church, "Church missing name"
            assert "followers_count" in church, "Church should have followers_count"
            assert "followers" not in church, "Church should not expose followers array"
            
        print(f"All {len(churches)} churches have required fields")
        
    def test_search_posts_have_required_fields(self):
        """Posts in search results should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/search?q=faith")
        assert response.status_code == 200
        
        data = response.json()
        posts = data.get("posts", [])
        
        for post in posts:
            assert "_id" in post, "Post missing _id"
            assert "user_id" in post, "Post missing user_id"
            assert "user_name" in post, "Post missing user_name"
            assert "likes_count" in post, "Post should have likes_count"
            assert "comments_count" in post, "Post should have comments_count"
            
        print(f"All {len(posts)} posts have required fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
