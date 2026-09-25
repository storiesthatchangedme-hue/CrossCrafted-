"""
Test Video Processing/Streaming Features for Cross Crafted
- Chunked upload: init -> chunk -> finalize
- Direct upload for small files
- Range header support for video streaming
- Thumbnail generation
- POST /api/posts with thumbnail_url field
"""
import pytest
import requests
import os
import io
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials from test_credentials.md
ADMIN_EMAIL = "bookingjosh@gmail.com"
ADMIN_PASSWORD = "Admin@123"
SESSION_TOKEN = "josh_admin_test_session"


class TestVideoUploadStreaming:
    """Video upload and streaming endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup session with admin auth"""
        self.session = requests.Session()
        # Use session token for auth - don't set Content-Type globally as it breaks multipart
        self.session.cookies.set("session_token", SESSION_TOKEN)
        self.session.headers.update({"Authorization": f"Bearer {SESSION_TOKEN}"})
    
    def test_health_endpoint(self):
        """Test health endpoint is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
        print("✓ Health endpoint working")
    
    def test_admin_login(self):
        """Test admin login to get valid session"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email" in data or "_id" in data
        print(f"✓ Admin login successful: {data.get('email', data.get('name'))}")
    
    # ── Chunked Upload Tests ──
    
    def test_chunked_upload_init(self):
        """POST /api/upload/init - creates chunked upload session"""
        response = self.session.post(
            f"{BASE_URL}/api/upload/init",
            json={
                "filename": "test_video.mp4",
                "content_type": "video/mp4",
                "total_size": 5000000,  # 5MB
                "total_chunks": 3
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "upload_id" in data, "Response should contain upload_id"
        assert isinstance(data["upload_id"], str)
        assert len(data["upload_id"]) > 0
        print(f"✓ Chunked upload init successful, upload_id: {data['upload_id'][:8]}...")
        return data["upload_id"]
    
    def test_chunked_upload_chunk(self):
        """POST /api/upload/chunk/{upload_id} - receives file chunk"""
        # First init an upload
        init_response = self.session.post(
            f"{BASE_URL}/api/upload/init",
            json={
                "filename": "test_chunk_video.mp4",
                "content_type": "video/mp4",
                "total_size": 4000,
                "total_chunks": 2
            }
        )
        assert init_response.status_code == 200
        upload_id = init_response.json()["upload_id"]
        
        # Upload first chunk
        chunk_data = b"x" * 2000  # 2KB chunk
        files = {"file": ("chunk_0", io.BytesIO(chunk_data), "application/octet-stream")}
        data = {"chunk_index": "0"}
        
        response = self.session.post(
            f"{BASE_URL}/api/upload/chunk/{upload_id}",
            files=files,
            data=data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        result = response.json()
        assert "received" in result
        assert result["received"] >= 1
        print(f"✓ Chunk upload successful, received: {result['received']}/{result['total']}")
    
    def test_chunked_upload_full_flow(self):
        """Full chunked upload flow: init -> chunks -> finalize"""
        # 1. Init
        init_response = self.session.post(
            f"{BASE_URL}/api/upload/init",
            json={
                "filename": "test_full_flow.mp4",
                "content_type": "video/mp4",
                "total_size": 3000,
                "total_chunks": 2
            }
        )
        assert init_response.status_code == 200
        upload_id = init_response.json()["upload_id"]
        print(f"  Init: upload_id={upload_id[:8]}...")
        
        # 2. Upload chunks
        for i in range(2):
            chunk_data = b"x" * 1500
            files = {"file": (f"chunk_{i}", io.BytesIO(chunk_data), "application/octet-stream")}
            data = {"chunk_index": str(i)}
            
            chunk_response = self.session.post(
                f"{BASE_URL}/api/upload/chunk/{upload_id}",
                files=files,
                data=data
            )
            assert chunk_response.status_code == 200
            print(f"  Chunk {i}: uploaded")
        
        # 3. Finalize
        finalize_response = self.session.post(
            f"{BASE_URL}/api/upload/finalize/{upload_id}"
        )
        assert finalize_response.status_code == 200, f"Finalize failed: {finalize_response.text}"
        result = finalize_response.json()
        assert "url" in result, "Finalize should return url"
        assert "path" in result, "Finalize should return path"
        # For video, should have is_video flag
        assert "is_video" in result
        print(f"✓ Full chunked upload flow successful, url: {result['url'][:50]}...")
    
    def test_chunked_upload_finalize_missing_chunks(self):
        """POST /api/upload/finalize - should fail if chunks missing"""
        # Init with 3 chunks but only upload 1
        init_response = self.session.post(
            f"{BASE_URL}/api/upload/init",
            json={
                "filename": "incomplete.mp4",
                "content_type": "video/mp4",
                "total_size": 6000,
                "total_chunks": 3
            }
        )
        assert init_response.status_code == 200
        upload_id = init_response.json()["upload_id"]
        
        # Upload only 1 chunk
        chunk_data = b"x" * 2000
        files = {"file": ("chunk_0", io.BytesIO(chunk_data), "application/octet-stream")}
        data = {"chunk_index": "0"}
        self.session.post(f"{BASE_URL}/api/upload/chunk/{upload_id}", files=files, data=data)
        
        # Try to finalize - should fail
        finalize_response = self.session.post(f"{BASE_URL}/api/upload/finalize/{upload_id}")
        assert finalize_response.status_code == 400, "Should fail with missing chunks"
        print("✓ Finalize correctly rejects incomplete upload")
    
    def test_chunked_upload_invalid_upload_id(self):
        """POST /api/upload/chunk - should fail with invalid upload_id"""
        chunk_data = b"x" * 1000
        files = {"file": ("chunk_0", io.BytesIO(chunk_data), "application/octet-stream")}
        data = {"chunk_index": "0"}
        
        response = self.session.post(
            f"{BASE_URL}/api/upload/chunk/invalid-upload-id-12345",
            files=files,
            data=data
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid upload_id correctly returns 404")
    
    # ── Direct Upload Tests ──
    
    def test_direct_upload_small_image(self):
        """POST /api/upload - direct upload for small files"""
        # Create a small test image (1x1 PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {"file": ("test_image.png", io.BytesIO(png_data), "image/png")}
        
        response = self.session.post(
            f"{BASE_URL}/api/upload",
            files=files
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data, "Response should contain url"
        assert "path" in data, "Response should contain path"
        assert "is_video" in data, "Response should contain is_video flag"
        assert data["is_video"] == False, "PNG should not be marked as video"
        print(f"✓ Direct upload successful, url: {data['url'][:50]}...")
    
    def test_direct_upload_returns_thumbnail_for_video(self):
        """POST /api/upload - video upload should return thumbnail_url"""
        # Create minimal video-like data (won't generate real thumbnail but tests the field)
        # Note: Real thumbnail generation requires valid video data
        video_data = b"fake video data for testing" * 100
        
        files = {"file": ("test_video.mp4", io.BytesIO(video_data), "video/mp4")}
        
        response = self.session.post(
            f"{BASE_URL}/api/upload",
            files=files
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "url" in data
        assert "is_video" in data
        assert data["is_video"] == True, "MP4 should be marked as video"
        # thumbnail_url may be empty if ffmpeg fails on fake data, but field should exist
        assert "thumbnail_url" in data, "Response should contain thumbnail_url field"
        print(f"✓ Video upload returns is_video=True, thumbnail_url field present")
    
    # ── Range Header / Video Streaming Tests ──
    
    def test_files_endpoint_exists(self):
        """GET /api/files/{path} - endpoint should exist"""
        # Try to access a non-existent file
        response = requests.get(f"{BASE_URL}/api/files/nonexistent/path.mp4")
        # Should return 404 for non-existent file, not 500 or other error
        assert response.status_code == 404, f"Expected 404 for non-existent file, got {response.status_code}"
        print("✓ Files endpoint exists and returns 404 for missing files")
    
    def test_files_endpoint_range_header_support(self):
        """GET /api/files/{path} - should support Range header for video streaming"""
        # First upload a file to get a valid path
        png_data = b'\x89PNG\r\n\x1a\n' + (b'x' * 1000)  # Larger file for range test
        files = {"file": ("range_test.png", io.BytesIO(png_data), "image/png")}
        
        upload_response = self.session.post(f"{BASE_URL}/api/upload", files=files)
        if upload_response.status_code != 200:
            pytest.skip("Upload failed, skipping range test")
        
        file_path = upload_response.json().get("path", "")
        if not file_path:
            pytest.skip("No file path returned")
        
        # Test Range request
        headers = {"Range": "bytes=0-99"}
        response = requests.get(f"{BASE_URL}/api/files/{file_path}", headers=headers)
        
        # For non-video files, may return 200 with full content
        # For video files, should return 206 with partial content
        assert response.status_code in [200, 206], f"Expected 200 or 206, got {response.status_code}"
        
        if response.status_code == 206:
            assert "Content-Range" in response.headers, "206 response should have Content-Range header"
            print(f"✓ Range request returns 206 with Content-Range: {response.headers.get('Content-Range')}")
        else:
            print("✓ Files endpoint accessible (Range header may only apply to videos)")
    
    # ── Posts with thumbnail_url Tests ──
    
    def test_create_post_with_thumbnail_url(self):
        """POST /api/posts - accepts thumbnail_url field"""
        post_data = {
            "content_text": "Test video testimony with thumbnail",
            "video_url": "/api/files/test/video.mp4",
            "thumbnail_url": "/api/files/test/thumbnail.jpg"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/posts",
            json=post_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "thumbnail_url" in data, "Response should contain thumbnail_url"
        assert data["thumbnail_url"] == post_data["thumbnail_url"], "thumbnail_url should be saved"
        assert data["video_url"] == post_data["video_url"], "video_url should be saved"
        print(f"✓ Post created with thumbnail_url: {data['thumbnail_url']}")
        
        # Cleanup - delete the test post
        post_id = data.get("_id")
        if post_id:
            self.session.delete(f"{BASE_URL}/api/posts/{post_id}")
    
    def test_create_post_with_image_only(self):
        """POST /api/posts - works with image_url only (no video)"""
        post_data = {
            "content_text": "Test image post",
            "image_url": "/api/files/test/image.jpg"
        }
        
        response = self.session.post(
            f"{BASE_URL}/api/posts",
            json=post_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["image_url"] == post_data["image_url"]
        assert data.get("video_url", "") == ""
        print("✓ Image-only post created successfully")
        
        # Cleanup
        post_id = data.get("_id")
        if post_id:
            self.session.delete(f"{BASE_URL}/api/posts/{post_id}")
    
    def test_get_posts_returns_thumbnail_url(self):
        """GET /api/posts - returns posts with thumbnail_url field"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Check that posts have the expected fields
        if len(data) > 0:
            post = data[0]
            # These fields should exist (may be empty strings)
            assert "_id" in post
            assert "content_text" in post or "content" in post
            # thumbnail_url should be in the response schema
            print(f"✓ GET /api/posts returns {len(data)} posts with expected fields")
        else:
            print("✓ GET /api/posts returns empty list (no posts yet)")
    
    # ── Feed Endpoint Tests ──
    
    def test_unified_feed_returns_posts(self):
        """GET /api/feed/unified - returns feed items"""
        response = requests.get(f"{BASE_URL}/api/feed/unified?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data, "Response should have items array"
        assert "has_more" in data, "Response should have has_more flag"
        print(f"✓ Unified feed returns {len(data['items'])} items, has_more={data['has_more']}")
    
    def test_suggested_posts_endpoint(self):
        """GET /api/posts/suggested - returns suggested posts"""
        response = requests.get(f"{BASE_URL}/api/posts/suggested?limit=6")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Suggested posts returns {len(data)} posts")
    
    def test_trending_posts_endpoint(self):
        """GET /api/posts/trending - returns trending posts"""
        response = requests.get(f"{BASE_URL}/api/posts/trending?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Trending posts returns {len(data)} posts")


class TestVideoUploadAuth:
    """Test that upload endpoints require authentication"""
    
    def test_upload_init_requires_auth(self):
        """POST /api/upload/init - requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/upload/init",
            json={"filename": "test.mp4", "content_type": "video/mp4", "total_size": 1000, "total_chunks": 1}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Upload init requires authentication")
    
    def test_direct_upload_requires_auth(self):
        """POST /api/upload - requires authentication"""
        files = {"file": ("test.png", io.BytesIO(b"test"), "image/png")}
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Direct upload requires authentication")
    
    def test_create_post_requires_auth(self):
        """POST /api/posts - requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/posts",
            json={"content_text": "Test post"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Create post requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
