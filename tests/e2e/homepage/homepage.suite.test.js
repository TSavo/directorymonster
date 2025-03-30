/**
 * @file Homepage test suite
 * @description Main suite file that imports and runs all homepage tests
 * @jest-environment node
 */

// Import all homepage test cases
require('./homepage.rendering.test');
require('./homepage.navigation.test');
require('./homepage.responsive.test');
require('./homepage.search.test');
require('./homepage.content.test');
require('./homepage.404.test');
require('./homepage.performance.test');
