/**
 * Base class for API testing
 * 
 * Provides common functionality for testing DirectoryMonster API endpoints,
 * including request setup, authentication, and test data initialization.
 */

const request = require('supertest');
const { exec } = require('child_process');
const { getAuthHeaders } = require('./utils/auth-helper');

// Base URL for API requests
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * Base class for API testing
 */
class ApiTestBase {
  constructor() {
    this.request = request(BASE_URL);
  }
  
  /**
   * Initialize test data - can be overridden by specific test classes
   * @returns {Promise} Resolves when setup is complete
   */
  async setupTestData() {
    return new Promise((resolve) => {
      exec('npm run seed:test', (error) => {
        if (error) {
          console.error(`Error seeding test data: ${error}`);
        }
        resolve();
      });
    });
  }
  
  /**
   * Generate authentication headers with tenant context
   * @param {Object} options - Configuration options
   * @returns {Object} Headers object
   */
  getAuthHeaders(options = {}) {
    return getAuthHeaders(options);
  }
  
  /**
   * Execute a GET request with authentication
   * @param {string} endpoint - API endpoint
   * @param {Object} authOptions - Authentication options
   * @returns {Promise} Supertest request
   */
  async authenticatedGet(endpoint, authOptions = {}) {
    const headers = this.getAuthHeaders(authOptions);
    return this.request
      .get(endpoint)
      .set(headers);
  }
  
  /**
   * Execute a POST request with authentication
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} authOptions - Authentication options
   * @returns {Promise} Supertest request
   */
  async authenticatedPost(endpoint, data, authOptions = {}) {
    const headers = this.getAuthHeaders(authOptions);
    return this.request
      .post(endpoint)
      .set(headers)
      .send(data);
  }
  
  /**
   * Execute a PUT request with authentication
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request payload
   * @param {Object} authOptions - Authentication options
   * @returns {Promise} Supertest request
   */
  async authenticatedPut(endpoint, data, authOptions = {}) {
    const headers = this.getAuthHeaders(authOptions);
    return this.request
      .put(endpoint)
      .set(headers)
      .send(data);
  }
  
  /**
   * Execute a DELETE request with authentication
   * @param {string} endpoint - API endpoint
   * @param {Object} authOptions - Authentication options
   * @returns {Promise} Supertest request
   */
  async authenticatedDelete(endpoint, authOptions = {}) {
    const headers = this.getAuthHeaders(authOptions);
    return this.request
      .delete(endpoint)
      .set(headers);
  }
}

module.exports = ApiTestBase;
