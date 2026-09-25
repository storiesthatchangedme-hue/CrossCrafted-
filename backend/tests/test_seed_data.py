"""
Test seed data integrity for Cross Crafted platform.
Tests: users, posts, churches, events, explore content.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://believer-hub-4.preview.emergentagent.com')

class TestSeedDataIntegrity:
    """Verify seed data was properly inserted and is accessible via API"""
    
    def test_posts_endpoint_returns_diverse_users(self):
        """Posts should come from multiple different users"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=24")
        assert response.status_code == 200
        
        posts = response.json()
        assert len(posts) >= 20, f"Expected at least 20 posts, got {len(posts)}"
        
        # Check for diverse users
        user_names = set(p.get('user_name') for p in posts)
        assert len(user_names) >= 5, f"Expected posts from at least 5 users, got {len(user_names)}: {user_names}"
        
        # Verify expected seed users are present
        expected_users = ['Sarah Mitchell', 'Marcus Johnson', 'Emily Rodriguez', 'David Kim']
        for user in expected_users:
            assert user in user_names, f"Expected user '{user}' not found in posts"
    
    def test_posts_have_likes_and_comments(self):
        """Posts should have non-zero like and comment counts"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=24")
        assert response.status_code == 200
        
        posts = response.json()
        posts_with_likes = [p for p in posts if p.get('likes_count', 0) > 0]
        posts_with_comments = [p for p in posts if p.get('comments_count', 0) > 0]
        
        assert len(posts_with_likes) >= 10, f"Expected at least 10 posts with likes, got {len(posts_with_likes)}"
        assert len(posts_with_comments) >= 5, f"Expected at least 5 posts with comments, got {len(posts_with_comments)}"
    
    def test_posts_have_media_and_text_only(self):
        """Should have mix of media posts and text-only posts"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=24")
        assert response.status_code == 200
        
        posts = response.json()
        media_posts = [p for p in posts if p.get('image_url')]
        text_only = [p for p in posts if not p.get('image_url') and not p.get('video_url')]
        
        assert len(media_posts) >= 10, f"Expected at least 10 media posts, got {len(media_posts)}"
        assert len(text_only) >= 5, f"Expected at least 5 text-only posts, got {len(text_only)}"
    
    def test_posts_have_user_images(self):
        """Posts should include user profile images"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=10")
        assert response.status_code == 200
        
        posts = response.json()
        posts_with_user_image = [p for p in posts if p.get('user_image')]
        
        assert len(posts_with_user_image) >= 5, f"Expected at least 5 posts with user images, got {len(posts_with_user_image)}"


class TestChurchesSeedData:
    """Verify churches seed data"""
    
    def test_churches_count(self):
        """Should have 6 churches"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        churches = response.json()
        assert len(churches) == 6, f"Expected 6 churches, got {len(churches)}"
    
    def test_churches_have_real_names_and_locations(self):
        """Churches should have realistic names and US city locations"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        churches = response.json()
        expected_churches = [
            ('Hillside Community Church', 'Austin, TX'),
            ('Grace City Fellowship', 'Nashville, TN'),
            ('The Gathering LA', 'Los Angeles, CA'),
            ('Restoration Church ATL', 'Atlanta, GA'),
            ('Bridge Church NYC', 'Brooklyn, NY'),
            ('New Life Chapel', 'Denver, CO'),
        ]
        
        church_names = [c.get('name') for c in churches]
        for name, location in expected_churches:
            assert name in church_names, f"Expected church '{name}' not found"
    
    def test_churches_have_cover_images(self):
        """Churches should have cover images"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        churches = response.json()
        churches_with_images = [c for c in churches if c.get('cover_image')]
        
        assert len(churches_with_images) == 6, f"Expected all 6 churches to have cover images, got {len(churches_with_images)}"
    
    def test_churches_have_service_times(self):
        """Churches should have service times"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        churches = response.json()
        churches_with_times = [c for c in churches if c.get('service_times')]
        
        assert len(churches_with_times) == 6, f"Expected all 6 churches to have service times, got {len(churches_with_times)}"
    
    def test_churches_have_followers(self):
        """Churches should have follower counts"""
        response = requests.get(f"{BASE_URL}/api/churches")
        assert response.status_code == 200
        
        churches = response.json()
        churches_with_followers = [c for c in churches if c.get('followers_count', 0) > 0]
        
        assert len(churches_with_followers) >= 4, f"Expected at least 4 churches with followers, got {len(churches_with_followers)}"


class TestEventsSeedData:
    """Verify events seed data"""
    
    def test_events_count(self):
        """Should have 8 events"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        events = response.json()
        assert len(events) == 8, f"Expected 8 events, got {len(events)}"
    
    def test_events_linked_to_churches(self):
        """Events should be linked to churches"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        events = response.json()
        events_with_church = [e for e in events if e.get('church_name')]
        
        assert len(events_with_church) == 8, f"Expected all 8 events to have church names, got {len(events_with_church)}"
    
    def test_events_have_expected_titles(self):
        """Events should have expected titles"""
        response = requests.get(f"{BASE_URL}/api/events")
        assert response.status_code == 200
        
        events = response.json()
        expected_titles = [
            'Night of Worship',
            'Gen Z Faith Conference',
            "Men's Breakfast & Bible Study",
            'Testimony Night',
            'Community Serve Day',
            'Acoustic Worship Night',
            'Young Adults Hangout',
            'Prayer & Fasting Weekend',
        ]
        
        event_titles = [e.get('title') for e in events]
        for title in expected_titles:
            assert title in event_titles, f"Expected event '{title}' not found"


class TestExploreSeedData:
    """Verify explore endpoint returns seed data"""
    
    def test_explore_trending_users(self):
        """Explore should show trending users with follower counts"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        trending = data.get('trending_users', [])
        
        assert len(trending) >= 3, f"Expected at least 3 trending users, got {len(trending)}"
        
        # Check follower counts
        users_with_followers = [u for u in trending if u.get('followers_count', 0) > 0]
        assert len(users_with_followers) >= 3, f"Expected at least 3 users with followers, got {len(users_with_followers)}"
    
    def test_explore_latest_posts(self):
        """Explore should show latest posts from diverse users"""
        response = requests.get(f"{BASE_URL}/api/explore")
        assert response.status_code == 200
        
        data = response.json()
        posts = data.get('posts', [])
        
        assert len(posts) >= 3, f"Expected at least 3 posts, got {len(posts)}"
        
        # Check for diverse users
        user_names = set(p.get('user_name') for p in posts)
        assert len(user_names) >= 2, f"Expected posts from at least 2 users, got {len(user_names)}"


class TestAuthWithSeedUsers:
    """Test authentication with seed users"""
    
    def test_login_seed_user_sarah(self):
        """Login with seed user sarah@example.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "sarah@example.com",
            "password": "Faith@123"
        })
        assert response.status_code == 200
        
        user = response.json()
        assert user.get('name') == 'Sarah Mitchell'
        assert user.get('role') == 'creator'
        assert user.get('bio'), "User should have bio"
        assert user.get('profile_image'), "User should have profile image"
    
    def test_login_seed_user_marcus(self):
        """Login with seed user marcus@example.com"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "marcus@example.com",
            "password": "Faith@123"
        })
        assert response.status_code == 200
        
        user = response.json()
        assert user.get('name') == 'Marcus Johnson'
        assert user.get('role') == 'creator'
    
    def test_login_admin(self):
        """Login with admin account"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@crosscrafted.com",
            "password": "Admin@123"
        })
        assert response.status_code == 200
        
        user = response.json()
        assert user.get('name') == 'Cross Crafted'
        assert user.get('role') == 'admin'


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
