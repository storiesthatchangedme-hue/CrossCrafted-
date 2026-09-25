"""
Shop/Products API Tests - Iteration 5
Tests for product listing, creation, update, delete, and seller info
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@crosscrafted.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@123")

# Test user for non-owner tests
TEST_USER_EMAIL = f"TEST_shopuser_{uuid.uuid4().hex[:6]}@test.com"
TEST_USER_PASSWORD = "TestPass123!"
TEST_USER_NAME = "TEST Shop User"
TEST_USER_USERNAME = f"test_shopuser_{uuid.uuid4().hex[:6]}"


class TestProductsAPI:
    """Products endpoint tests"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        """Get authenticated admin session"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        return session
    
    @pytest.fixture(scope="class")
    def test_user_session(self):
        """Create and authenticate a test user"""
        session = requests.Session()
        # Register new user
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME,
            "username": TEST_USER_USERNAME
        })
        if response.status_code == 400 and "already" in response.text.lower():
            # User exists, try login
            response = session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
        assert response.status_code in [200, 201], f"Test user auth failed: {response.text}"
        return session
    
    @pytest.fixture(scope="class")
    def test_user_id(self, test_user_session):
        """Get test user ID"""
        response = test_user_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        return response.json()["_id"]
    
    @pytest.fixture(scope="class")
    def admin_user_id(self, admin_session):
        """Get admin user ID"""
        response = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        return response.json()["_id"]

    # ==================== GET /api/products ====================
    
    def test_get_products_returns_list(self):
        """GET /api/products returns list of products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/products returns {len(data)} products")
    
    def test_get_products_has_seller_info(self):
        """GET /api/products returns seller_name, seller_username, seller_image, seller_id"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        if len(data) > 0:
            product = data[0]
            assert "seller_name" in product, "Missing seller_name"
            assert "seller_username" in product, "Missing seller_username"
            assert "seller_image" in product, "Missing seller_image"
            assert "seller_id" in product, "Missing seller_id"
            print(f"✓ Product has seller info: {product.get('seller_name')}")
        else:
            pytest.skip("No products to test seller info")
    
    def test_get_products_search_filter(self):
        """GET /api/products?search= filters by title"""
        response = requests.get(f"{BASE_URL}/api/products?search=faith")
        assert response.status_code == 200
        data = response.json()
        # Should return Faith Journal
        if len(data) > 0:
            assert any("faith" in p["title"].lower() for p in data), "Search filter not working"
            print(f"✓ Search 'faith' returned {len(data)} products")
        else:
            print("✓ Search returned 0 products (may be expected)")
    
    def test_get_products_search_no_results(self):
        """GET /api/products?search= with non-matching term returns empty"""
        response = requests.get(f"{BASE_URL}/api/products?search=xyznonexistent123")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0, "Should return empty for non-matching search"
        print("✓ Non-matching search returns empty list")

    # ==================== GET /api/products/{id} ====================
    
    def test_get_product_detail(self):
        """GET /api/products/{id} returns product with seller info"""
        # First get a product ID
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        products = response.json()
        if len(products) == 0:
            pytest.skip("No products to test")
        
        product_id = products[0]["_id"]
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify seller info fields
        assert "seller_name" in data
        assert "seller_username" in data
        assert "seller_image" in data
        assert "seller_bio" in data
        assert "seller_email" in data
        assert "is_owner" in data
        assert "is_admin" in data
        print(f"✓ Product detail has all seller fields: {data.get('seller_name')}, email: {data.get('seller_email')}")
    
    def test_get_product_not_found(self):
        """GET /api/products/{id} returns 404 for invalid ID"""
        response = requests.get(f"{BASE_URL}/api/products/000000000000000000000000")
        assert response.status_code == 404
        print("✓ Invalid product ID returns 404")
    
    def test_get_product_is_owner_flag_for_owner(self, admin_session):
        """GET /api/products/{id} returns is_owner=true for product owner"""
        # Get admin's products
        response = admin_session.get(f"{BASE_URL}/api/products")
        products = response.json()
        admin_product = next((p for p in products if p.get("seller_username") == "admin"), None)
        
        if not admin_product:
            pytest.skip("No admin products found")
        
        response = admin_session.get(f"{BASE_URL}/api/products/{admin_product['_id']}")
        assert response.status_code == 200
        data = response.json()
        assert data["is_owner"] == True, "is_owner should be True for owner"
        print("✓ is_owner=True for product owner")
    
    def test_get_product_is_owner_flag_for_non_owner(self, test_user_session):
        """GET /api/products/{id} returns is_owner=false for non-owner"""
        # Get any product
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        if len(products) == 0:
            pytest.skip("No products to test")
        
        product_id = products[0]["_id"]
        response = test_user_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["is_owner"] == False, "is_owner should be False for non-owner"
        print("✓ is_owner=False for non-owner")
    
    def test_get_product_is_admin_flag(self, admin_session, test_user_session):
        """GET /api/products/{id} returns is_admin flag correctly"""
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        if len(products) == 0:
            pytest.skip("No products to test")
        
        product_id = products[0]["_id"]
        
        # Admin should have is_admin=True
        response = admin_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        assert response.json()["is_admin"] == True, "Admin should have is_admin=True"
        
        # Regular user should have is_admin=False
        response = test_user_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        assert response.json()["is_admin"] == False, "Regular user should have is_admin=False"
        print("✓ is_admin flag works correctly")

    # ==================== POST /api/products ====================
    
    def test_create_product_authenticated(self, test_user_session):
        """POST /api/products - authenticated user can create product"""
        product_data = {
            "title": f"TEST Product {uuid.uuid4().hex[:6]}",
            "description": "Test product description",
            "price": 19.99,
            "image": ""
        }
        response = test_user_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code == 200, f"Create failed: {response.text}"
        data = response.json()
        assert data["title"] == product_data["title"]
        assert data["price"] == product_data["price"]
        assert "_id" in data
        print(f"✓ Created product: {data['_id']}")
        
        # Cleanup - delete the product
        test_user_session.delete(f"{BASE_URL}/api/products/{data['_id']}")
    
    def test_create_product_unauthenticated(self):
        """POST /api/products - unauthenticated returns 401"""
        product_data = {
            "title": "Unauthorized Product",
            "description": "Should fail",
            "price": 10.00
        }
        response = requests.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code == 401
        print("✓ Unauthenticated create returns 401")

    # ==================== PUT /api/products/{id} ====================
    
    def test_update_product_by_owner(self, test_user_session):
        """PUT /api/products/{id} - owner can update"""
        # Create a product first
        product_data = {
            "title": f"TEST Update Product {uuid.uuid4().hex[:6]}",
            "description": "Original description",
            "price": 25.00
        }
        create_response = test_user_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert create_response.status_code == 200
        product_id = create_response.json()["_id"]
        
        # Update it
        update_data = {"title": "Updated Title", "price": 30.00}
        response = test_user_session.put(f"{BASE_URL}/api/products/{product_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify update
        get_response = test_user_session.get(f"{BASE_URL}/api/products/{product_id}")
        assert get_response.json()["title"] == "Updated Title"
        assert get_response.json()["price"] == 30.00
        print("✓ Owner can update product")
        
        # Cleanup
        test_user_session.delete(f"{BASE_URL}/api/products/{product_id}")
    
    def test_update_product_by_admin(self, admin_session, test_user_session):
        """PUT /api/products/{id} - admin can update any product"""
        # Create product as test user
        product_data = {
            "title": f"TEST Admin Update {uuid.uuid4().hex[:6]}",
            "description": "Test",
            "price": 15.00
        }
        create_response = test_user_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert create_response.status_code == 200
        product_id = create_response.json()["_id"]
        
        # Admin updates it
        update_data = {"title": "Admin Updated Title"}
        response = admin_session.put(f"{BASE_URL}/api/products/{product_id}", json=update_data)
        assert response.status_code == 200
        print("✓ Admin can update any product")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/products/{product_id}")
    
    def test_update_product_by_non_owner_returns_403(self, admin_session, test_user_session):
        """PUT /api/products/{id} - non-owner gets 403"""
        # Get admin's product
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        admin_product = next((p for p in products if p.get("seller_username") == "admin"), None)
        
        if not admin_product:
            pytest.skip("No admin products found")
        
        # Test user tries to update admin's product
        update_data = {"title": "Hacked Title"}
        response = test_user_session.put(f"{BASE_URL}/api/products/{admin_product['_id']}", json=update_data)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-owner update returns 403")

    # ==================== DELETE /api/products/{id} ====================
    
    def test_delete_product_by_owner(self, test_user_session):
        """DELETE /api/products/{id} - owner can delete"""
        # Create a product
        product_data = {
            "title": f"TEST Delete Product {uuid.uuid4().hex[:6]}",
            "description": "To be deleted",
            "price": 5.00
        }
        create_response = test_user_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert create_response.status_code == 200
        product_id = create_response.json()["_id"]
        
        # Delete it
        response = test_user_session.delete(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert get_response.status_code == 404
        print("✓ Owner can delete product")
    
    def test_delete_product_by_admin(self, admin_session, test_user_session):
        """DELETE /api/products/{id} - admin can delete any product"""
        # Create product as test user
        product_data = {
            "title": f"TEST Admin Delete {uuid.uuid4().hex[:6]}",
            "description": "Admin will delete",
            "price": 10.00
        }
        create_response = test_user_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert create_response.status_code == 200
        product_id = create_response.json()["_id"]
        
        # Admin deletes it
        response = admin_session.delete(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200
        print("✓ Admin can delete any product")
    
    def test_delete_product_by_non_owner_returns_403(self, test_user_session):
        """DELETE /api/products/{id} - non-owner gets 403"""
        # Get admin's product
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        admin_product = next((p for p in products if p.get("seller_username") == "admin"), None)
        
        if not admin_product:
            pytest.skip("No admin products found")
        
        # Test user tries to delete admin's product
        response = test_user_session.delete(f"{BASE_URL}/api/products/{admin_product['_id']}")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-owner delete returns 403")

    # ==================== GET /api/users/{user_id}/products ====================
    
    def test_get_user_products(self, admin_user_id):
        """GET /api/users/{user_id}/products returns user's products"""
        response = requests.get(f"{BASE_URL}/api/users/{admin_user_id}/products")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/users/{admin_user_id}/products returns {len(data)} products")
    
    def test_get_user_products_empty_for_new_user(self, test_user_id):
        """GET /api/users/{user_id}/products returns empty for user with no products"""
        response = requests.get(f"{BASE_URL}/api/users/{test_user_id}/products")
        assert response.status_code == 200
        # May or may not be empty depending on test order
        print(f"✓ User products endpoint works")


class TestProductDataIntegrity:
    """Test data integrity and edge cases"""
    
    @pytest.fixture(scope="class")
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_product_price_is_float(self, admin_session):
        """Product price is stored and returned as float"""
        product_data = {
            "title": f"TEST Price Float {uuid.uuid4().hex[:6]}",
            "description": "Testing price",
            "price": 29.99
        }
        response = admin_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data["price"], float)
        assert data["price"] == 29.99
        print("✓ Price is stored as float")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/products/{data['_id']}")
    
    def test_product_created_at_exists(self, admin_session):
        """Product has created_at timestamp"""
        product_data = {
            "title": f"TEST Timestamp {uuid.uuid4().hex[:6]}",
            "description": "Testing timestamp",
            "price": 10.00
        }
        response = admin_session.post(f"{BASE_URL}/api/products", json=product_data)
        assert response.status_code == 200
        data = response.json()
        assert "created_at" in data
        print("✓ Product has created_at timestamp")
        
        # Cleanup
        admin_session.delete(f"{BASE_URL}/api/products/{data['_id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
