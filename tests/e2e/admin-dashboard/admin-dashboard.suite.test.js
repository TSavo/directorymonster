/**
 * @file Admin Dashboard test suite
 * @description Main suite file that imports and runs all admin dashboard tests
 * @jest-environment node
 */

// Import all admin dashboard test cases
require('./admin-dashboard.rendering.test');
require('./admin-dashboard.navigation.test');
require('./admin-dashboard.statistics.test');
require('./admin-dashboard.activity.test');
require('./admin-dashboard.responsive.test');

/**
 * Admin Dashboard Test Suite
 * 
 * This file serves as the main entry point for all admin dashboard tests.
 * It imports the individual test files to create a comprehensive test suite.
 * 
 * To run just this test suite, use:
 * npm test -- -t "admin-dashboard"
 * 
 * Structure:
 * - admin-dashboard.rendering.test.js: Tests basic dashboard rendering
 * - admin-dashboard.navigation.test.js: Tests sidebar navigation functionality
 * - admin-dashboard.statistics.test.js: Tests statistics cards functionality
 * - admin-dashboard.activity.test.js: Tests activity feed functionality
 * - admin-dashboard.responsive.test.js: Tests mobile responsiveness
 */
