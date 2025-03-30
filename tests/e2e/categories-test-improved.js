/**
 * @file Improved E2E tests for category management functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const fs = require('fs');
const path = require('path');

// Import navigation utilities
const { 
  navigateToSitesPage,