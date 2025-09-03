// Test script for the updated upload API
// This script tests both scenarios: creating a new mail package and using an existing one

const API_BASE_URL = 'http://localhost:3000/api/panelist/mail-scans/upload';

// Test data - you'll need to replace these with actual values
const TEST_DATA = {
  // Test 1: Create new mail package (mail_package_id is null)
  newPackage: {
    mail_package_id: null,
    document_type: "scan",
    file_data: "SGVsbG8gV29ybGQ=", // Base64 encoded "Hello World"
    filename: "test_scan_1.jpg",
    image_sequence: 1,
    mime_type: "image/jpeg",
    metadata: { test: true }
  },
  
  // Test 2: Use existing mail package (you'll need to replace with actual UUID)
  existingPackage: {
    mail_package_id: "00000000-0000-0000-0000-000000000000", // Replace with actual UUID
    document_type: "supporting_document",
    file_data: "U3VwcG9ydGluZyBkb2N1bWVudA==", // Base64 encoded "Supporting document"
    filename: "test_document.pdf",
    mime_type: "application/pdf",
    metadata: { category: "receipt" }
  }
};

async function testUpload(data, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log('Request data:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add proper authorization header here
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Success!');
      
      // Check if new package was created
      if (data.mail_package_id === null && result.mail_package) {
        console.log('✅ New mail package created successfully');
        console.log('Package ID:', result.mail_package.id);
      } else if (data.mail_package_id && !result.mail_package) {
        console.log('✅ Used existing mail package successfully');
      }
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Upload API Tests\n');
  
  // Test 1: Create new mail package
  await testUpload(TEST_DATA.newPackage, "Create new mail package (mail_package_id: null)");
  
  // Test 2: Use existing mail package
  await testUpload(TEST_DATA.existingPackage, "Use existing mail package (mail_package_id: UUID)");
  
  console.log('\n🏁 Tests completed!');
}

// Instructions for running the tests
console.log(`
📋 Instructions for running tests:

1. Make sure your development server is running on localhost:3000
2. You'll need to add proper authentication (Bearer token) to the Authorization header
3. For the existing package test, replace the UUID with an actual mail_package_id from your database
4. Run this script with: node test-upload-api.js

Note: This is a basic test script. In production, you'd want to:
- Use proper test frameworks like Jest
- Mock authentication
- Clean up test data after tests
- Add more comprehensive assertions
`);

// Uncomment the line below to run tests when you're ready
// runTests();
