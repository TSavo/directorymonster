/**
 * @file Login test suite
 * @description Main suite file that imports and runs all login tests
 * @jest-environment node
 */

// Import all login test cases
require('./login.rendering.test');
require('./login.validation.test');
require('./login.authentication.test');
require('./login.password-reset.test');
require('./login.logout.test');
