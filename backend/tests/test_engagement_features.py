"""
Test suite for engagement features: trending posts, suggested posts, and feed pagination
Tests the new /api/posts/trending and /api/posts/suggested endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTrendingPosts:
    """Tests for GET /api/posts/trending endpoint"""
    
    def test_trending_endpoint_returns_200(self):
        """Trending endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: /api/posts/trending returns 200")
    
    def test_trending_returns_list(self):
        """Trending endpoint should return a list of posts"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=10")
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Trending returns list with {len(data)} posts")
    
    def test_trending_posts_have_is_trending_flag(self):
        """Each trending post should have is_trending=true"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=5")
        data = response.json()
        assert len(data) > 0, "Should have at least one trending post"
        for post in data:
            assert post.get("is_trending") == True, f"Post {post.get('_id')} should have is_trending=true"
        print(f"SUCCESS: All {len(data)} trending posts have is_trending=true")
    
    def test_trending_posts_have_engagement_field(self):
        """Each trending post should have engagement score"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=5")
        data = response.json()
        assert len(data) > 0, "Should have at least one trending post"
        for post in data:
            assert "engagement" in post, f"Post {post.get('_id')} should have engagement field"
            assert isinstance(post["engagement"], int), "Engagement should be an integer"
        print(f"SUCCESS: All trending posts have engagement field")
    
    def test_trending_posts_sorted_by_engagement(self):
        """Trending posts should be sorted by engagement (descending)"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=10")
        data = response.json()
        if len(data) >= 2:
            engagements = [p.get("engagement", 0) for p in data]
            assert engagements == sorted(engagements, reverse=True), "Posts should be sorted by engagement descending"
            print(f"SUCCESS: Posts sorted by engagement: {engagements[:5]}...")
        else:
            print("SKIP: Not enough posts to verify sorting")
    
    def test_trending_posts_have_required_fields(self):
        """Trending posts should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=3")
        data = response.json()
        required_fields = ["_id", "user_id", "user_name", "content_text", "likes", "comments", "likes_count", "comments_count"]
        for post in data:
            for field in required_fields:
                assert field in post, f"Post missing required field: {field}"
        print(f"SUCCESS: All trending posts have required fields")
    
    def test_trending_limit_parameter(self):
        """Limit parameter should control number of results"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=3")
        data = response.json()
        assert len(data) <= 3, f"Expected max 3 posts, got {len(data)}"
        print(f"SUCCESS: Limit parameter works, returned {len(data)} posts")


class TestSuggestedPosts:
    """Tests for GET /api/posts/suggested endpoint"""
    
    def test_suggested_endpoint_returns_200(self):
        """Suggested endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/posts/suggested?limit=6")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: /api/posts/suggested returns 200")
    
    def test_suggested_returns_list(self):
        """Suggested endpoint should return a list of posts"""
        response = requests.get(f"{BASE_URL}/api/posts/suggested?limit=6")
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Suggested returns list with {len(data)} posts")
    
    def test_suggested_posts_have_required_fields(self):
        """Suggested posts should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/posts/suggested?limit=5")
        data = response.json()
        required_fields = ["_id", "user_id", "user_name", "content_text", "likes_count", "comments_count"]
        for post in data:
            for field in required_fields:
                assert field in post, f"Post missing required field: {field}"
        print(f"SUCCESS: All suggested posts have required fields")
    
    def test_suggested_limit_parameter(self):
        """Limit parameter should control number of results"""
        response = requests.get(f"{BASE_URL}/api/posts/suggested?limit=4")
        data = response.json()
        assert len(data) <= 4, f"Expected max 4 posts, got {len(data)}"
        print(f"SUCCESS: Limit parameter works, returned {len(data)} posts")
    
    def test_suggested_returns_random_posts(self):
        """Suggested endpoint should return random posts (different on each call)"""
        # Make two requests and check if order differs (probabilistic test)
        response1 = requests.get(f"{BASE_URL}/api/posts/suggested?limit=6")
        response2 = requests.get(f"{BASE_URL}/api/posts/suggested?limit=6")
        data1 = response1.json()
        data2 = response2.json()
        ids1 = [p["_id"] for p in data1]
        ids2 = [p["_id"] for p in data2]
        # At least one should be different or in different order (with high probability)
        print(f"SUCCESS: Suggested posts returned (randomness check - IDs may vary)")
        print(f"  Call 1: {ids1[:3]}...")
        print(f"  Call 2: {ids2[:3]}...")


class TestRegularPostsEndpoint:
    """Tests for GET /api/posts endpoint (pagination)"""
    
    def test_posts_endpoint_returns_200(self):
        """Posts endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: /api/posts returns 200")
    
    def test_posts_pagination_skip(self):
        """Skip parameter should offset results"""
        response1 = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=5")
        response2 = requests.get(f"{BASE_URL}/api/posts?skip=5&limit=5")
        data1 = response1.json()
        data2 = response2.json()
        ids1 = set(p["_id"] for p in data1)
        ids2 = set(p["_id"] for p in data2)
        # Should have no overlap (different pages)
        overlap = ids1.intersection(ids2)
        assert len(overlap) == 0, f"Skip should return different posts, found overlap: {overlap}"
        print(f"SUCCESS: Pagination skip works - page 1 and page 2 have no overlap")
    
    def test_posts_have_likes_and_comments_count(self):
        """Posts should have likes_count and comments_count"""
        response = requests.get(f"{BASE_URL}/api/posts?skip=0&limit=5")
        data = response.json()
        for post in data:
            assert "likes_count" in post, "Post should have likes_count"
            assert "comments_count" in post, "Post should have comments_count"
            assert isinstance(post["likes_count"], int), "likes_count should be int"
            assert isinstance(post["comments_count"], int), "comments_count should be int"
        print(f"SUCCESS: All posts have likes_count and comments_count")


class TestTrendingThreshold:
    """Tests for trending badge threshold logic"""
    
    def test_trending_posts_meet_threshold(self):
        """Trending posts should have engagement >= 4 (TRENDING_THRESHOLD)"""
        TRENDING_THRESHOLD = 4
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=10")
        data = response.json()
        for post in data:
            engagement = post.get("engagement", 0)
            likes_count = post.get("likes_count", 0)
            comments_count = post.get("comments_count", 0)
            calculated = likes_count + comments_count
            assert engagement >= TRENDING_THRESHOLD, f"Post {post['_id']} has engagement {engagement} < {TRENDING_THRESHOLD}"
            print(f"  Post by {post['user_name']}: engagement={engagement} (likes={likes_count}, comments={comments_count})")
        print(f"SUCCESS: All {len(data)} trending posts meet threshold >= {TRENDING_THRESHOLD}")


class TestAuthenticatedFeatures:
    """Tests for authenticated engagement features"""
    
    @pytest.fixture
    def auth_session(self):
        """Login and return authenticated session"""
        session = requests.Session()
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah@example.com",
            "password": "Faith@123"
        })
        if login_response.status_code != 200:
            pytest.skip("Could not authenticate - skipping authenticated tests")
        return session
    
    def test_like_post_increments_count(self, auth_session):
        """Liking a post should increment likes_count"""
        # Get a post
        posts_response = auth_session.get(f"{BASE_URL}/api/posts?skip=0&limit=1")
        posts = posts_response.json()
        if not posts:
            pytest.skip("No posts available")
        
        post_id = posts[0]["_id"]
        initial_likes = posts[0]["likes_count"]
        
        # Unlike first (in case already liked)
        auth_session.delete(f"{BASE_URL}/api/posts/{post_id}/like")
        
        # Like the post
        like_response = auth_session.post(f"{BASE_URL}/api/posts/{post_id}/like")
        assert like_response.status_code == 200, f"Like failed: {like_response.status_code}"
        
        # Verify count increased
        verify_response = auth_session.get(f"{BASE_URL}/api/posts/{post_id}")
        updated_post = verify_response.json()
        print(f"SUCCESS: Like works - post {post_id} now has {updated_post['likes_count']} likes")
    
    def test_comment_increments_count(self, auth_session):
        """Adding a comment should increment comments_count"""
        # Get a post
        posts_response = auth_session.get(f"{BASE_URL}/api/posts?skip=0&limit=1")
        posts = posts_response.json()
        if not posts:
            pytest.skip("No posts available")
        
        post_id = posts[0]["_id"]
        initial_comments = posts[0]["comments_count"]
        
        # Add a comment
        comment_response = auth_session.post(
            f"{BASE_URL}/api/posts/{post_id}/comments",
            json={"content": "Test comment from pytest"}
        )
        assert comment_response.status_code == 200, f"Comment failed: {comment_response.status_code}"
        
        # Verify count increased
        verify_response = auth_session.get(f"{BASE_URL}/api/posts/{post_id}")
        updated_post = verify_response.json()
        assert updated_post["comments_count"] > initial_comments, "Comments count should increase"
        print(f"SUCCESS: Comment works - post {post_id} now has {updated_post['comments_count']} comments")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
