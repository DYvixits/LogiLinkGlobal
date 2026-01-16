import requests
import sys
from datetime import datetime
import json

class UserManagementTester:
    def __init__(self, base_url="https://parcel-bridge-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.testuser_token = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if 'login' in endpoint:
                    # For login, use form data
                    form_data = {'username': data['username'], 'password': data['password']}
                    response = requests.post(url, data=form_data)
                else:
                    response = requests.post(url, json=data, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"   ✅ Admin token obtained")
            print(f"   ✅ Role: {response.get('role')}")
            print(f"   ✅ Full name: {response.get('full_name')}")
            
            # Verify admin role
            if response.get('role') == 'admin':
                print("   ✅ Admin role confirmed")
            else:
                print("   ❌ Wrong role returned")
                return False
        
        return success

    def test_list_users_admin(self):
        """Test listing users as admin"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "List Users (Admin)",
            "GET",
            "api/users",
            200,
            headers=headers
        )
        
        if success:
            if isinstance(response, list):
                print(f"   ✅ Returned {len(response)} users")
                
                # Check for expected default users
                usernames = [user.get('username') for user in response]
                expected_users = ['admin', 'operateur', 'superviseur']
                
                for expected_user in expected_users:
                    if expected_user in usernames:
                        print(f"   ✅ Found expected user: {expected_user}")
                    else:
                        print(f"   ❌ Missing expected user: {expected_user}")
                        return False
                        
                # Verify user structure
                if len(response) > 0:
                    user = response[0]
                    required_fields = ['username', 'full_name', 'role']
                    for field in required_fields:
                        if field not in user:
                            print(f"   ❌ Missing field in user: {field}")
                            return False
                    print("   ✅ User structure is correct")
            else:
                print("   ❌ Response is not a list")
                return False
        
        return success

    def test_create_user_admin(self):
        """Test creating a new user as admin"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        user_data = {
            "username": "testuser",
            "password": "pass123",
            "full_name": "Test User",
            "role": "operator"
        }
        
        success, response = self.run_test(
            "Create User (Admin)",
            "POST",
            "api/users",
            200,
            data=user_data,
            headers=headers
        )
        
        if success:
            # Verify the created user data
            if response.get('username') == 'testuser':
                print("   ✅ User created with correct username")
            if response.get('full_name') == 'Test User':
                print("   ✅ User created with correct full name")
            if response.get('role') == 'operator':
                print("   ✅ User created with correct role")
        
        return success

    def test_verify_user_in_list(self):
        """Verify the created user appears in the user list"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        success, response = self.run_test(
            "Verify User in List",
            "GET",
            "api/users",
            200,
            headers=headers
        )
        
        if success:
            usernames = [user.get('username') for user in response]
            if 'testuser' in usernames:
                print("   ✅ Created user 'testuser' found in list")
                # Find the testuser and verify details
                testuser = next((user for user in response if user.get('username') == 'testuser'), None)
                if testuser:
                    if testuser.get('full_name') == 'Test User':
                        print("   ✅ Testuser has correct full name")
                    if testuser.get('role') == 'operator':
                        print("   ✅ Testuser has correct role")
            else:
                print("   ❌ Created user 'testuser' not found in list")
                return False
        
        return success

    def test_testuser_login(self):
        """Test login with the created testuser"""
        success, response = self.run_test(
            "Testuser Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "testuser", "password": "pass123"}
        )
        
        if success and 'access_token' in response:
            self.testuser_token = response['access_token']
            print(f"   ✅ Testuser token obtained")
            print(f"   ✅ Role: {response.get('role')}")
            print(f"   ✅ Full name: {response.get('full_name')}")
            
            # Verify operator role
            if response.get('role') == 'operator':
                print("   ✅ Operator role confirmed")
            else:
                print("   ❌ Wrong role returned")
                return False
        
        return success

    def test_testuser_cannot_access_users(self):
        """Test that testuser (operator) cannot access user management"""
        if not self.testuser_token:
            print("❌ No testuser token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.testuser_token}'}
        success, response = self.run_test(
            "Testuser Access Users (Should Fail)",
            "GET",
            "api/users",
            403,  # Should be forbidden
            headers=headers
        )
        
        if success:
            print("   ✅ Operator correctly denied access to user management")
        
        return success

    def test_testuser_can_access_parcels(self):
        """Test that testuser can access parcels (normal functionality)"""
        if not self.testuser_token:
            print("❌ No testuser token available")
            return False
            
        success, response = self.run_test(
            "Testuser Access Parcels",
            "GET",
            "api/parcels",
            200
        )
        
        if success:
            print(f"   ✅ Operator can access parcels: {len(response)} parcels found")
        
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            400,  # Should be bad request
            data={"username": "invalid", "password": "invalid"}
        )
        
        if success:
            print("   ✅ Invalid credentials correctly rejected")
        
        return success

def main():
    print("🚀 Starting LogiLink User Management Tests...")
    print("=" * 60)
    
    tester = UserManagementTester()
    
    # Run all tests in order
    tests = [
        tester.test_admin_login,
        tester.test_list_users_admin,
        tester.test_create_user_admin,
        tester.test_verify_user_in_list,
        tester.test_testuser_login,
        tester.test_testuser_cannot_access_users,
        tester.test_testuser_can_access_parcels,
        tester.test_invalid_login
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 USER MANAGEMENT TEST RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())