/**
 * @file E2E tests for the admin dashboard functionality
 * @description Tests the admin dashboard UI elements, navigation, and functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.