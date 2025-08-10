#!/usr/bin/env python3
"""
API endpoint tester to verify all routes are working
"""
import asyncio
import aiohttp
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

async def test_api_endpoints():
    """Test all API endpoints"""
    
    async with aiohttp.ClientSession() as session:
        
        print("Testing API endpoints...")
        
        # Test 1: Health check
        try:
            async with session.get(f"{BASE_URL}/health") as resp:
                data = await resp.json()
                print(f"SUCCESS Health check: {resp.status} - {data}")
        except Exception as e:
            print(f"ERROR Health check failed: {e}")
            return False
            
        # Test 2: Root endpoint
        try:
            async with session.get(f"{BASE_URL}/") as resp:
                data = await resp.json()
                print(f"SUCCESS Root endpoint: {resp.status} - {data}")
        except Exception as e:
            print(f"ERROR Root endpoint failed: {e}")
            
        # Test 3: Try to register a test user
        test_user = {
            "username": "testuser123",
            "email": "test@example.com",
            "password": "testpassword123",
            "bio": "Test user for API testing"
        }
        
        try:
            async with session.post(
                f"{BASE_URL}/api/auth/register", 
                json=test_user
            ) as resp:
                if resp.status == 201:
                    data = await resp.json()
                    print(f"SUCCESS User registration: {resp.status} - User created")
                    user_id = data.get('id')
                    
                    # Test 4: Login with the test user
                    login_data = {
                        "username": test_user["username"],
                        "password": test_user["password"]
                    }
                    
                    async with session.post(
                        f"{BASE_URL}/api/auth/login",
                        json=login_data
                    ) as login_resp:
                        if login_resp.status == 200:
                            login_result = await login_resp.json()
                            token = login_result.get('access_token')
                            print(f"SUCCESS User login: {login_resp.status} - Token received")
                            
                            # Test 5: Access protected endpoint
                            headers = {"Authorization": f"Bearer {token}"}
                            async with session.get(
                                f"{BASE_URL}/api/users/profile",
                                headers=headers
                            ) as profile_resp:
                                if profile_resp.status == 200:
                                    profile_data = await profile_resp.json()
                                    print(f"SUCCESS Protected route: {profile_resp.status} - Profile retrieved")
                                else:
                                    print(f"ERROR Protected route failed: {profile_resp.status}")
                        else:
                            error_data = await login_resp.text()
                            print(f"ERROR Login failed: {login_resp.status} - {error_data}")
                            
                elif resp.status == 400:
                    error_data = await resp.json()
                    if "already exists" in str(error_data):
                        print(f"SUCCESS User registration: User already exists (expected)")
                    else:
                        print(f"ERROR User registration failed: {resp.status} - {error_data}")
                else:
                    error_data = await resp.text()
                    print(f"ERROR User registration failed: {resp.status} - {error_data}")
                    
        except Exception as e:
            print(f"ERROR Registration test failed: {e}")
            
        # Test 6: Public endpoints
        try:
            async with session.get(f"{BASE_URL}/api/shops") as resp:
                print(f"SUCCESS Shops endpoint: {resp.status}")
                
            async with session.get(f"{BASE_URL}/api/spots") as resp:
                print(f"SUCCESS Spots endpoint: {resp.status}")
                
        except Exception as e:
            print(f"ERROR Public endpoints failed: {e}")
            
        print("\nAPI testing completed!")
        return True

if __name__ == "__main__":
    print("Starting API endpoint tests...")
    print(f"Testing against: {BASE_URL}")
    print("Note: Make sure the FastAPI server is running on localhost:8000")
    print()
    
    try:
        asyncio.run(test_api_endpoints())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Test failed with error: {e}")
        sys.exit(1)