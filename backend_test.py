import requests
import sys
from datetime import datetime
import json

class LogiLinkAPITester:
    def __init__(self, base_url="https://package-tracker-eu.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_tracking_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
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

    def test_schedule_endpoint(self):
        """Test the schedule endpoint"""
        success, response = self.run_test(
            "Get Schedule",
            "GET",
            "api/schedule",
            200
        )
        
        if success:
            # Verify schedule structure
            if 'eu_to_cm' in response and 'cm_to_eu' in response:
                print("   ✅ Schedule structure is correct")
                if len(response['eu_to_cm']) > 0 and len(response['cm_to_eu']) > 0:
                    print("   ✅ Schedule contains dates")
                else:
                    print("   ⚠️  Schedule is empty")
            else:
                print("   ❌ Schedule structure is incorrect")
                return False
        return success

    def test_create_parcel(self):
        """Test creating a new parcel"""
        test_data = {
            "direction": "EU_TO_CM",
            "sender": {
                "name": "Test Sender",
                "phone": "+33123456789",
                "city": "Paris, France",
                "address": "123 Test Street"
            },
            "receiver": {
                "name": "Test Receiver", 
                "phone": "+237123456789",
                "city": "Douala, Cameroun",
                "address": "456 Test Avenue"
            },
            "content_description": "Test package contents",
            "departure_date": datetime.now().strftime("%Y-%m-%d")
        }
        
        success, response = self.run_test(
            "Create Parcel",
            "POST",
            "api/parcels",
            200,
            data=test_data
        )
        
        if success and 'tracking_id' in response:
            self.created_tracking_id = response['tracking_id']
            print(f"   ✅ Created parcel with tracking ID: {self.created_tracking_id}")
            
            # Verify response structure
            required_fields = ['tracking_id', 'direction', 'sender', 'receiver', 'status', 'created_at']
            for field in required_fields:
                if field not in response:
                    print(f"   ❌ Missing field: {field}")
                    return False
            print("   ✅ Response structure is correct")
        
        return success

    def test_get_parcel(self):
        """Test getting parcel by tracking ID"""
        if not self.created_tracking_id:
            print("❌ No tracking ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Parcel by ID",
            "GET",
            f"api/parcels/{self.created_tracking_id}",
            200
        )
        
        if success:
            if response.get('tracking_id') == self.created_tracking_id:
                print("   ✅ Correct parcel returned")
            else:
                print("   ❌ Wrong parcel returned")
                return False
        
        return success

    def test_get_parcel_pdf(self):
        """Test PDF generation"""
        if not self.created_tracking_id:
            print("❌ No tracking ID available for testing")
            return False
            
        url = f"{self.base_url}/api/parcels/{self.created_tracking_id}/pdf"
        print(f"\n🔍 Testing PDF Generation...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url)
            self.tests_run += 1
            
            if response.status_code == 200:
                if response.headers.get('content-type') == 'application/pdf':
                    self.tests_passed += 1
                    print("✅ Passed - PDF generated successfully")
                    print(f"   Content-Type: {response.headers.get('content-type')}")
                    print(f"   Content-Length: {len(response.content)} bytes")
                    return True
                else:
                    print(f"❌ Failed - Wrong content type: {response.headers.get('content-type')}")
            else:
                print(f"❌ Failed - Status: {response.status_code}")
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
        
        return False

    def test_list_parcels(self):
        """Test listing all parcels (backoffice)"""
        success, response = self.run_test(
            "List All Parcels",
            "GET", 
            "api/parcels",
            200
        )
        
        if success:
            if isinstance(response, list):
                print(f"   ✅ Returned {len(response)} parcels")
                if len(response) > 0 and self.created_tracking_id:
                    # Check if our created parcel is in the list
                    found = any(p.get('tracking_id') == self.created_tracking_id for p in response)
                    if found:
                        print("   ✅ Created parcel found in list")
                    else:
                        print("   ⚠️  Created parcel not found in list")
            else:
                print("   ❌ Response is not a list")
                return False
        
        return success

    def test_update_status(self):
        """Test updating parcel status"""
        if not self.created_tracking_id:
            print("❌ No tracking ID available for testing")
            return False
            
        success, response = self.run_test(
            "Update Parcel Status",
            "PATCH",
            f"api/parcels/{self.created_tracking_id}/status",
            200,
            params={"status": "RECEIVED_AT_DEPOT"}
        )
        
        if success:
            # Verify the status was actually updated
            verify_success, verify_response = self.run_test(
                "Verify Status Update",
                "GET",
                f"api/parcels/{self.created_tracking_id}",
                200
            )
            
            if verify_success and verify_response.get('status') == 'RECEIVED_AT_DEPOT':
                print("   ✅ Status updated successfully")
            else:
                print("   ❌ Status update verification failed")
                return False
        
        return success

    def test_invalid_tracking_id(self):
        """Test with invalid tracking ID"""
        success, response = self.run_test(
            "Get Invalid Parcel",
            "GET",
            "api/parcels/INVALID-ID",
            404
        )
        return success

def main():
    print("🚀 Starting LogiLink API Tests...")
    print("=" * 50)
    
    tester = LogiLinkAPITester()
    
    # Run all tests
    tests = [
        tester.test_schedule_endpoint,
        tester.test_create_parcel,
        tester.test_get_parcel,
        tester.test_get_parcel_pdf,
        tester.test_list_parcels,
        tester.test_update_status,
        tester.test_invalid_tracking_id
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
            tester.tests_run += 1
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.created_tracking_id:
        print(f"🎫 Test Tracking ID: {tester.created_tracking_id}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())