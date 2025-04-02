/**
 * Simple test script to verify the GET /api/admin/tenants endpoint
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Mock JWT token for testing
const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJzdXBlci1hZG1pbi0xMjMiLCJpYXQiOjE2MTcxMjM0NTYsImV4cCI6MTYxNzIwOTg1Nn0.3Thp81rDFrKXr3WrY1MyMnNK8kKoZBX9lg-JwFknRnM';

// Start the Next.js app
app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Test the GET /api/admin/tenants endpoint
    if (parsedUrl.pathname === '/api/admin/tenants') {
      console.log('Testing GET /api/admin/tenants endpoint...');
      
      // Add test headers
      req.headers = {
        ...req.headers,
        'authorization': `Bearer ${mockJwtToken}`,
        'x-tenant-id': 'system'
      };
      
      // Handle the request
      handle(req, res);
    } else {
      handle(req, res);
    }
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    console.log('> Testing GET /api/admin/tenants endpoint...');
    
    // Make a request to the endpoint
    fetch('http://localhost:3000/api/admin/tenants', {
      headers: {
        'authorization': `Bearer ${mockJwtToken}`,
        'x-tenant-id': 'system'
      }
    })
    .then(response => {
      console.log('Response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Response data:', JSON.stringify(data, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
  });
});