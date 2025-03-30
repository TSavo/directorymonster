/**
 * @file First user test suite
 * @description Main suite file that imports and runs all first user tests
 * @jest-environment node
 */

// Import all first user test cases
require('./first-user.setup-page.test');
require('./first-user.validation.test');
require('./first-user.creation.test');
require('./first-user.login-flow.test');
