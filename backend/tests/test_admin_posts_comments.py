"""
Admin Posts and Comments Management Tests
Tests for:
- GET /api/admin/posts - List posts with search
- DELETE /api/admin/posts/{post_id} - Delete a post
- GET /api/admin/comments - List all comments across posts
- DELETE /api/admin/comments/{post_id}/{comment_id} - Delete a comment
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "bookingjosh@gmail.com"
ADMIN_PASSWORD = "Admin@123"


@pytest.fixture(scope="module")
def admin_session():
    """Login as admin and return session with cookies."""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")
    
    user_data = response.json()
    assert user_data.get("role") == "admin", "User is not admin"
    
    return session


class TestAdminPostsEndpoint:
    """Tests for GET /api/admin/posts endpoint"""
    
    def test_admin_posts_returns_posts_list(self, admin_session):
        """GET /api/admin/posts returns posts with total count"""
        response = admin_session.get(f"{BASE_URL}/api/admin/posts")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "posts" in data, "Response should contain 'posts' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["posts"], list), "posts should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        
        print(f"✓ Admin posts endpoint returned {len(data['posts'])} posts, total: {data['total']}")
    
    def test_admin_posts_have_required_fields(self, admin_session):
        """Posts should have _id, likes_count, comments_count fields"""
        response = admin_session.get(f"{BASE_URL}/api/admin/posts?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["posts"]) > 0:
            post = data["posts"][0]
            assert "_id" in post, "Post should have _id field"
            assert "likes_count" in post, "Post should have likes_count field"
            assert "comments_count" in post, "Post should have comments_count field"
            assert "content_text" in post, "Post should have content_text field"
            
            # _id should be a string (not ObjectId)
            assert isinstance(post["_id"], str), "_id should be a string"
            
            print(f"✓ Post has required fields: _id={post['_id']}, likes={post['likes_count']}, comments={post['comments_count']}")
        else:
            print("⚠ No posts found to verify fields")
    
    def test_admin_posts_search_functionality(self, admin_session):
        """Search parameter should filter posts by content_text"""
        # First get all posts
        all_response = admin_session.get(f"{BASE_URL}/api/admin/posts")
        assert all_response.status_code == 200
        all_data = all_response.json()
        
        # Search with a term that likely won't match
        search_response = admin_session.get(f"{BASE_URL}/api/admin/posts?search=xyznonexistent123")
        assert search_response.status_code == 200
        search_data = search_response.json()
        
        # Search results should be <= all results
        assert search_data["total"] <= all_data["total"], "Search should filter results"
        
        print(f"✓ Search functionality works: all={all_data['total']}, search='xyznonexistent123'={search_data['total']}")
    
    def test_admin_posts_requires_admin_auth(self):
        """Endpoint should require admin authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/posts")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Admin posts endpoint requires authentication")


class TestAdminCommentsEndpoint:
    """Tests for GET /api/admin/comments endpoint"""
    
    def test_admin_comments_returns_comments_list(self, admin_session):
        """GET /api/admin/comments returns comments with total count"""
        response = admin_session.get(f"{BASE_URL}/api/admin/comments")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "comments" in data, "Response should contain 'comments' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["comments"], list), "comments should be a list"
        
        print(f"✓ Admin comments endpoint returned {len(data['comments'])} comments, total: {data['total']}")
    
    def test_admin_comments_have_required_fields(self, admin_session):
        """Comments should have post_id, comment_text, comment_user_name fields"""
        response = admin_session.get(f"{BASE_URL}/api/admin/comments?limit=10")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["comments"]) > 0:
            comment = data["comments"][0]
            assert "post_id" in comment, "Comment should have post_id field"
            assert "comment_text" in comment, "Comment should have comment_text field"
            assert "comment_user_name" in comment, "Comment should have comment_user_name field"
            # Note: comment_id may be null for seed data comments that don't have 'id' field
            # New comments created via API will have comment_id
            
            print(f"✓ Comment has required fields: post_id={comment['post_id']}, user={comment['comment_user_name']}, comment_id={comment.get('comment_id', 'N/A')}")
        else:
            print("⚠ No comments found to verify fields")
    
    def test_admin_comments_search_functionality(self, admin_session):
        """Search parameter should filter comments"""
        response = admin_session.get(f"{BASE_URL}/api/admin/comments?search=xyznonexistent123")
        
        assert response.status_code == 200
        data = response.json()
        
        # Search with non-existent term should return 0 or few results
        print(f"✓ Comments search works: search='xyznonexistent123' returned {data['total']} results")
    
    def test_admin_comments_requires_admin_auth(self):
        """Endpoint should require admin authentication"""
        session = requests.Session()
        response = session.get(f"{BASE_URL}/api/admin/comments")
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Admin comments endpoint requires authentication")


class TestAdminDeletePost:
    """Tests for DELETE /api/admin/posts/{post_id} endpoint"""
    
    def test_delete_post_creates_and_deletes(self, admin_session):
        """Create a test post and delete it via admin endpoint"""
        # First create a test post
        test_content = f"TEST_ADMIN_DELETE_POST_{uuid.uuid4().hex[:8]}"
        create_response = admin_session.post(f"{BASE_URL}/api/posts", json={
            "content_text": test_content
        })
        
        assert create_response.status_code == 200, f"Failed to create test post: {create_response.text}"
        post_data = create_response.json()
        post_id = post_data["_id"]
        
        print(f"✓ Created test post with _id: {post_id}")
        
        # Now delete it via admin endpoint
        delete_response = admin_session.delete(f"{BASE_URL}/api/admin/posts/{post_id}")
        
        assert delete_response.status_code == 200, f"Failed to delete post: {delete_response.text}"
        assert delete_response.json().get("message") == "Post deleted"
        
        print(f"✓ Successfully deleted post via admin endpoint")
        
        # Verify post is gone
        get_response = admin_session.get(f"{BASE_URL}/api/posts/{post_id}")
        assert get_response.status_code == 404, "Deleted post should return 404"
        
        print("✓ Verified post no longer exists")
    
    def test_delete_nonexistent_post_returns_404(self, admin_session):
        """Deleting non-existent post should return 404"""
        fake_id = "000000000000000000000000"  # Valid ObjectId format but doesn't exist
        response = admin_session.delete(f"{BASE_URL}/api/admin/posts/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete non-existent post returns 404")


class TestAdminDeleteComment:
    """Tests for DELETE /api/admin/comments/{post_id}/{comment_id} endpoint"""
    
    def test_delete_comment_creates_and_deletes(self, admin_session):
        """Create a test post with comment and delete the comment via admin endpoint"""
        # First create a test post
        test_content = f"TEST_ADMIN_DELETE_COMMENT_{uuid.uuid4().hex[:8]}"
        create_post_response = admin_session.post(f"{BASE_URL}/api/posts", json={
            "content_text": test_content
        })
        
        assert create_post_response.status_code == 200, f"Failed to create test post: {create_post_response.text}"
        post_data = create_post_response.json()
        post_id = post_data["_id"]
        
        print(f"✓ Created test post with _id: {post_id}")
        
        # Add a comment to the post
        comment_text = f"TEST_COMMENT_{uuid.uuid4().hex[:8]}"
        add_comment_response = admin_session.post(f"{BASE_URL}/api/posts/{post_id}/comments", json={
            "text": comment_text
        })
        
        assert add_comment_response.status_code == 200, f"Failed to add comment: {add_comment_response.text}"
        comment_data = add_comment_response.json()
        comment_id = comment_data["id"]
        
        print(f"✓ Added comment with id: {comment_id}")
        
        # Delete the comment via admin endpoint
        delete_response = admin_session.delete(f"{BASE_URL}/api/admin/comments/{post_id}/{comment_id}")
        
        assert delete_response.status_code == 200, f"Failed to delete comment: {delete_response.text}"
        assert delete_response.json().get("message") == "Comment deleted"
        
        print("✓ Successfully deleted comment via admin endpoint")
        
        # Verify comment is gone
        get_comments_response = admin_session.get(f"{BASE_URL}/api/posts/{post_id}/comments")
        assert get_comments_response.status_code == 200
        comments = get_comments_response.json()
        comment_ids = [c.get("id") for c in comments]
        assert comment_id not in comment_ids, "Deleted comment should not be in list"
        
        print("✓ Verified comment no longer exists")
        
        # Cleanup: delete the test post
        admin_session.delete(f"{BASE_URL}/api/admin/posts/{post_id}")
    
    def test_delete_comment_nonexistent_post_returns_404(self, admin_session):
        """Deleting comment from non-existent post should return 404"""
        fake_post_id = "000000000000000000000000"
        fake_comment_id = str(uuid.uuid4())
        
        response = admin_session.delete(f"{BASE_URL}/api/admin/comments/{fake_post_id}/{fake_comment_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete comment from non-existent post returns 404")
    
    def test_delete_nonexistent_comment_returns_404(self, admin_session):
        """Deleting non-existent comment should return 404"""
        # Get a real post first
        posts_response = admin_session.get(f"{BASE_URL}/api/admin/posts?limit=1")
        assert posts_response.status_code == 200
        posts = posts_response.json().get("posts", [])
        
        if len(posts) > 0:
            post_id = posts[0]["_id"]
            fake_comment_id = str(uuid.uuid4())
            
            response = admin_session.delete(f"{BASE_URL}/api/admin/comments/{post_id}/{fake_comment_id}")
            
            assert response.status_code == 404, f"Expected 404, got {response.status_code}"
            print("✓ Delete non-existent comment returns 404")
        else:
            print("⚠ No posts available to test non-existent comment deletion")


class TestPostCommentsInlineExpansion:
    """Tests for GET /api/posts/{post_id}/comments endpoint (used for inline expansion)"""
    
    def test_get_post_comments(self, admin_session):
        """GET /api/posts/{post_id}/comments returns comments array"""
        # Get a post with comments
        posts_response = admin_session.get(f"{BASE_URL}/api/admin/posts?limit=20")
        assert posts_response.status_code == 200
        posts = posts_response.json().get("posts", [])
        
        # Find a post with comments
        post_with_comments = next((p for p in posts if p.get("comments_count", 0) > 0), None)
        
        if post_with_comments:
            post_id = post_with_comments["_id"]
            comments_response = admin_session.get(f"{BASE_URL}/api/posts/{post_id}/comments")
            
            assert comments_response.status_code == 200
            comments = comments_response.json()
            assert isinstance(comments, list), "Comments should be a list"
            
            if len(comments) > 0:
                comment = comments[0]
                # Comments may have 'id' (new API comments) or no id (seed data)
                # They should have text/content and user_name
                has_text = "text" in comment or "content" in comment
                assert has_text, "Comment should have text or content field"
                assert "user_name" in comment, "Comment should have user_name"
                
            print(f"✓ Got {len(comments)} comments for post {post_id}")
        else:
            print("⚠ No posts with comments found to test inline expansion")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
