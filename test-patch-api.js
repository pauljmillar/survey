#!/usr/bin/env node

/**
 * Test script for the PATCH /api/panelist/mail-packages/[packageId] API
 * 
 * Usage: node test-patch-api.js <packageId>
 * 
 * Note: This requires you to be logged in to the application in your browser
 * and have a valid mail package ID from a previous upload test.
 */

const https = require('https');
const http = require('http');

const PACKAGE_ID = process.argv[2];

if (!PACKAGE_ID) {
  console.error('❌ Please provide a mail package ID as an argument');
  console.error('Usage: node test-patch-api.js <packageId>');
  console.error('');
  console.error('You can get a package ID by running the upload test first at:');
  console.error('http://localhost:3000/test-upload');
  process.exit(1);
}

// Test data matching the API specification
const testData = {
  brand_name: "Test Brand",
  industry: "Technology", 
  company_validated: true,
  response_intention: "interested",
  name_check: "verified",
  notes: "Test update from command line script",
  status: "processing",
  is_approved: false,
  processing_notes: "Updated via command line test"
};

console.log('🧪 Testing PATCH /api/panelist/mail-packages/[packageId] API');
console.log('📦 Package ID:', PACKAGE_ID);
console.log('📝 Test Data:', JSON.stringify(testData, null, 2));
console.log('');

// Determine if we're using HTTP or HTTPS
const isLocalhost = process.env.NODE_ENV === 'development' || process.env.BASE_URL?.includes('localhost');
const protocol = isLocalhost ? http : https;
const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

const url = `${baseUrl}/api/panelist/mail-packages/${PACKAGE_ID}`;

console.log('🌐 Making PATCH request to:', url);
console.log('');

const postData = JSON.stringify(testData);

const options = {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = protocol.request(url, options, (res) => {
  console.log('📡 Response Status:', res.statusCode, res.statusMessage);
  console.log('📋 Response Headers:', res.headers);
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Response Body:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      if (res.statusCode === 200) {
        console.log('');
        console.log('🎉 PATCH API test successful!');
        console.log('📊 Updated mail package:', jsonData.mail_package?.id);
      } else {
        console.log('');
        console.log('❌ PATCH API test failed with status:', res.statusCode);
      }
    } catch (e) {
      console.log('📄 Raw Response (not JSON):', data);
      console.log('❌ Failed to parse response as JSON');
    }
  });
});

req.on('error', (err) => {
  console.error('💥 Request failed:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('⏰ Request timed out');
  req.destroy();
  process.exit(1);
});

// Set timeout
req.setTimeout(10000);

req.write(postData);
req.end();

console.log('⏳ Sending request...');
console.log('💡 Note: Make sure you are logged in to the application in your browser');
console.log('💡 The API requires authentication via session cookies');
