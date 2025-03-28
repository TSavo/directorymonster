/**
 * @fileoverview Tests for the Template management module.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Template, TemplateObject } from './Template.js';
import { FileSystem } from '../Utils/FileSystem.js';
import * as path from 'path';
import * as fs from 'fs';

// Mock the FileSystem class
jest.mock('../Utils/FileSystem', () => {
  return {
    FileSystem: {
      fileExists: jest.fn().mockReturnValue(true),
      directoryExists: jest.fn().mockReturnValue(true),
      readFile: jest.fn().mockReturnValue('test content'),
      writeFile: jest.fn().mockReturnValue(true),
      getBasename: jest.fn((filePath: string, ext?: string) => {
        const baseName = path.basename(filePath);
        if (ext && baseName.endsWith(ext)) {
          return baseName.slice(0, -ext.length);
        }
        return baseName;
      })
    }
  };
});

// Mock fs module
jest.mock('fs', () => ({
  readdirSync: jest.fn().mockReturnValue(['template1.hbs', 'template2.hbs']),
  statSync: jest.fn(() => ({
    isFile: jest.fn(() => true),
    isDirectory: jest.fn(() => true)
  })),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('test content')
}));

describe('Template', () => {
  // Test variables
  const templateDir = '/test/templates';
  const validTemplateContent = 'This is a test template with {{variable}}';
  let template: Template;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Initialize a new Template instance
    template = new Template(templateDir);

    // Setup default mock behaviors
    (FileSystem.fileExists as jest.Mock).mockReturnValue(true);
    (FileSystem.directoryExists as jest.Mock).mockReturnValue(true);
    (FileSystem.readFile as jest.Mock).mockReturnValue(validTemplateContent);
    (FileSystem.writeFile as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockReturnValue(['template1.hbs', 'template2.hbs']);
  });

  // Simple test to check initialization
  it('should initialize properly', async () => {
    const result = await template.initialize();
    expect(result).toBe(true);
    expect(FileSystem.directoryExists).toHaveBeenCalledWith(templateDir);
    expect(fs.readdirSync).toHaveBeenCalledWith(templateDir);
  });
});