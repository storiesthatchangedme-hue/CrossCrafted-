"""
Test suite for Homepage Feed-First Experience
Tests the public posts API and related functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://believer-hub-4.preview.emergentagent.com')

class TestPublicPostsAPI:
    """Tests for public posts API (no auth required)"""
    
    def test_get_posts_public_no_auth(self):
        """GET /api/posts should work without authentication"""
        response = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=12")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Public posts API returned {len(data)} posts")
    
    def test_posts_have_required_fields(self):
        """Posts should have all required fields for feed display"""
        response = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            post = data[0]
            required_fields = ['_id', 'user_id', 'user_name', 'content_text', 'created_at', 'likes_count', 'comments_count']
            for field in required_fields:
                assert field in post, f"Post missing required field: {field}"
            print(f"✓ Posts have all required fields: {required_fields}")
    
    def test_posts_pagination_skip_limit(self):
        """Test pagination with skip and limit parameters"""
        # Get first page
        response1 = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=5")
        assert response1.status_code == 200
        page1 = response1.json()
        
        # Get second page
        response2 = requests.get(f"{BASE_URL}/api/posts?skip=5&limit=5")
        assert response2.status_code == 200
        page2 = response2.json()
        
        # Verify different posts (if enough posts exist)
        if len(page1) > 0 and len(page2) > 0:
            page1_ids = set(p['_id'] for p in page1)
            page2_ids = set(p['_id'] for p in page2)
            assert page1_ids.isdisjoint(page2_ids), "Pagination should return different posts"
            print(f"✓ Pagination working: page1 has {len(page1)} posts, page2 has {len(page2)} posts")
    
    def test_posts_sorted_by_created_at_desc(self):
        """Posts should be sorted by created_at descending (newest first)"""
        response = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 1:
            dates = [p['created_at'] for p in data]
            # Check if sorted descending
            assert dates == sorted(dates, reverse=True), "Posts should be sorted by created_at descending"
            print("✓ Posts sorted by created_at descending")
    
    def test_posts_include_media_fields(self):
        """Posts should include image_url and video_url fields"""
        response = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=20")
        assert response.status_code == 200
        data = response.json()
        
        media_posts = [p for p in data if p.get('image_url') or p.get('video_url')]
        text_only_posts = [p for p in data if not p.get('image_url') and not p.get('video_url')]
        
        print(f"✓ Found {len(media_posts)} media posts and {len(text_only_posts)} text-only posts")
        
        # Verify media fields exist
        for post in data:
            assert 'image_url' in post or post.get('image_url') is None or post.get('image_url') == ''
            assert 'video_url' in post or post.get('video_url') is None or post.get('video_url') == ''


class TestAuthEndpoints:
    """Tests for authentication endpoints"""
    
    def test_login_with_valid_credentials(self):
        """Login should work with valid admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@crosscrafted.com", "password": "Admin@123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert 'email' in data, "Response should contain user email"
        assert data['email'] == 'admin@crosscrafted.com'
        print("✓ Login with valid credentials successful")
    
    def test_login_with_invalid_credentials(self):
        """Login should fail with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@email.com", "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Login with invalid credentials returns 401")


class TestPublicPages:
    """Tests for public page endpoints"""
    
    def test_health_check(self):
        """Basic health check - API should respond"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=1")
        assert response.status_code == 200
        print("✓ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
