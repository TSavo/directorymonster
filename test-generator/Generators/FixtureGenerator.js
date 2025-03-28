/**
 * @fileoverview Fixture generator module for the test generator.
 * Creates test fixture data for component testing.
 */

import path from 'path';
import { FileSystem } from '../Utils/FileSystem.js';

/**
 * Fixture generator for the test generator tool
 */
class FixtureGenerator {
  /**
   * Create a new fixture generator
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
  }

  /**
   * Generate test fixtures based on component requirements
   * @param {Object} requirements - Component requirements
   * @param {string} requirements.componentName - Name of the component
   * @param {string} requirements.category - Component category (e.g., 'admin/categories')
   * @param {string[]} requirements.features - Component features
   * @param {Object[]} requirements.props - Component props
   * @param {Object} [options] - Generation options
   * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
   * @param {string} [options.outputDir] - Custom output directory for fixture files
   * @returns {Object} Result object with success status and generated files
   */
  generateFixtures(requirements, options = {}) {
    if (!requirements || !requirements.componentName) {
      return {
        success: false,
        error: 'Invalid component requirements',
        files: []
      };
    }

    try {
      const result = {
        success: true,
        files: [],
        errors: []
      };

      // Generate basic fixture data
      const basicFixtureResult = this._generateBasicFixture(requirements, options);
      if (basicFixtureResult.success) {
        result.files.push(basicFixtureResult.file);
      } else {
        result.success = false;
        result.errors.push(basicFixtureResult.error);
      }

      // Generate feature-specific fixtures
      for (const feature of requirements.features || []) {
        const featureFixtureResult = this._generateFeatureFixture(feature, requirements, options);
        if (featureFixtureResult.success) {
          result.files.push(featureFixtureResult.file);
        } else {
          result.errors.push(featureFixtureResult.error);
        }
      }

      // Generate edge case fixtures if needed
      if (requirements.props && requirements.props.length > 0) {
        const edgeCaseFixtureResult = this._generateEdgeCaseFixture(requirements, options);
        if (edgeCaseFixtureResult.success) {
          result.files.push(edgeCaseFixtureResult.file);
        } else {
          result.errors.push(edgeCaseFixtureResult.error);
        }
      }

      return result;
    } catch (error) {
      console.error(`Error generating fixtures: ${error.message}`);
      return {
        success: false,
        error: error.message,
        files: []
      };
    }
  }

  /**
   * Generate a basic fixture file
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Generation options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateBasicFixture(requirements, options) {
    try {
      const { componentName, props = [] } = requirements;

      // Create fixture data for props
      const fixtureData = {};
      
      // Add fixture data for each prop
      for (const prop of props) {
        fixtureData[prop.name] = this._generateMockValue(prop);
      }

      // Determine output path
      const outputPath = this._determineFixturePath(requirements, 'basic', options);

      // Write the fixture file
      const content = JSON.stringify(fixtureData, null, 2);
      const writeResult = FileSystem.writeFile(
        outputPath, 
        content, 
        options.overwrite || false
      );

      if (!writeResult) {
        return {
          success: false,
          error: `Failed to write basic fixture file: ${outputPath}`,
          file: null
        };
      }

      return {
        success: true,
        file: outputPath
      };
    } catch (error) {
      console.error(`Error generating basic fixture: ${error.message}`);
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }

  /**
   * Generate a feature-specific fixture file
   * @param {string} feature - Feature name
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Generation options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateFeatureFixture(feature, requirements, options) {
    try {
      const { componentName, props = [] } = requirements;

      // Create fixture data for props
      let fixtureData = {};
      
      // Add fixture data for each prop
      for (const prop of props) {
        fixtureData[prop.name] = this._generateMockValue(prop);
      }

      // Add feature-specific data
      switch (feature) {
        case 'data-loading':
          fixtureData = {
            loading: {
              ...fixtureData,
              isLoading: true
            },
            loaded: {
              ...fixtureData,
              isLoading: false,
              data: this._generateMockData(componentName, 5)
            },
            error: {
              ...fixtureData,
              isLoading: false,
              error: "Failed to fetch data. Please try again."
            }
          };
          break;
        
        case 'sorting':
          fixtureData = {
            unsorted: {
              ...fixtureData,
              items: this._generateMockData(componentName, 5, false)
            },
            sortedAsc: {
              ...fixtureData,
              items: this._generateMockData(componentName, 5, true),
              sortField: 'name',
              sortDirection: 'asc'
            },
            sortedDesc: {
              ...fixtureData,
              items: this._generateMockData(componentName, 5, true).reverse(),
              sortField: 'name',
              sortDirection: 'desc'
            }
          };
          break;
        
        case 'hierarchy':
          fixtureData = {
            flat: {
              ...fixtureData,
              items: this._generateMockData(componentName, 5, false)
            },
            hierarchical: {
              ...fixtureData,
              items: this._generateHierarchicalData(componentName, 3, 2)
            }
          };
          break;
        
        case 'pagination':
          fixtureData = {
            firstPage: {
              ...fixtureData,
              items: this._generateMockData(componentName, 10),
              pagination: {
                page: 1,
                pageSize: 10,
                totalItems: 35,
                totalPages: 4
              }
            },
            middlePage: {
              ...fixtureData,
              items: this._generateMockData(componentName, 10),
              pagination: {
                page: 2,
                pageSize: 10,
                totalItems: 35,
                totalPages: 4
              }
            },
            lastPage: {
              ...fixtureData,
              items: this._generateMockData(componentName, 5),
              pagination: {
                page: 4,
                pageSize: 10,
                totalItems: 35,
                totalPages: 4
              }
            }
          };
          break;
        
        case 'filtering':
          fixtureData = {
            unfiltered: {
              ...fixtureData,
              items: this._generateMockData(componentName, 10),
              filter: {
                searchTerm: '',
                filters: {}
              }
            },
            filtered: {
              ...fixtureData,
              items: this._generateMockData(componentName, 3),
              filter: {
                searchTerm: 'search term',
                filters: {
                  category: 'example'
                }
              }
            },
            noResults: {
              ...fixtureData,
              items: [],
              filter: {
                searchTerm: 'nonexistent',
                filters: {
                  category: 'nonexistent'
                }
              }
            }
          };
          break;
        
        case 'form':
          fixtureData = {
            empty: {
              ...fixtureData,
              formData: {}
            },
            filled: {
              ...fixtureData,
              formData: {
                name: 'Example Name',
                email: 'example@example.com',
                description: 'Example description text'
              }
            },
            invalid: {
              ...fixtureData,
              formData: {
                name: '',
                email: 'invalid-email',
                description: 'Ex'
              },
              errors: {
                name: 'Name is required',
                email: 'Invalid email format',
                description: 'Description is too short'
              }
            }
          };
          break;
        
        default:
          // For other features, just use the basic fixture data
          break;
      }

      // Determine output path
      const outputPath = this._determineFixturePath(requirements, feature, options);

      // Write the fixture file
      const content = JSON.stringify(fixtureData, null, 2);
      const writeResult = FileSystem.writeFile(
        outputPath, 
        content, 
        options.overwrite || false
      );

      if (!writeResult) {
        return {
          success: false,
          error: `Failed to write ${feature} fixture file: ${outputPath}`,
          file: null
        };
      }

      return {
        success: true,
        file: outputPath
      };
    } catch (error) {
      console.error(`Error generating ${feature} fixture: ${error.message}`);
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }

  /**
   * Generate an edge case fixture file
   * @param {Object} requirements - Component requirements
   * @param {Object} options - Generation options
   * @returns {Object} Result object with success status and file path
   * @private
   */
  _generateEdgeCaseFixture(requirements, options) {
    try {
      const { componentName, props = [] } = requirements;

      // Create fixture data for edge cases
      const fixtureData = {
        emptyProps: {},
        nullValues: {},
        undefinedValues: {},
        extremeValues: {}
      };
      
      // Generate null and undefined values for each prop
      for (const prop of props) {
        fixtureData.nullValues[prop.name] = null;
        fixtureData.undefinedValues[prop.name] = undefined;
        
        // Generate extreme values based on prop type
        switch (prop.type) {
          case 'string':
            fixtureData.extremeValues[prop.name] = 'A'.repeat(1000); // Very long string
            break;
          
          case 'number':
            fixtureData.extremeValues[prop.name] = Number.MAX_SAFE_INTEGER; // Very large number
            break;
          
          case 'array':
            fixtureData.extremeValues[prop.name] = []; // Empty array
            break;
          
          case 'object':
            fixtureData.extremeValues[prop.name] = {}; // Empty object
            break;
          
          default:
            fixtureData.extremeValues[prop.name] = undefined;
        }
      }

      // Determine output path
      const outputPath = this._determineFixturePath(requirements, 'edge-cases', options);

      // Write the fixture file
      const content = JSON.stringify(fixtureData, null, 2);
      const writeResult = FileSystem.writeFile(
        outputPath, 
        content, 
        options.overwrite || false
      );

      if (!writeResult) {
        return {
          success: false,
          error: `Failed to write edge case fixture file: ${outputPath}`,
          file: null
        };
      }

      return {
        success: true,
        file: outputPath
      };
    } catch (error) {
      console.error(`Error generating edge case fixture: ${error.message}`);
      return {
        success: false,
        error: error.message,
        file: null
      };
    }
  }

  /**
   * Generate a mock value for a prop
   * @param {Object} prop - Prop definition
   * @returns {*} Mock value
   * @private
   */
  _generateMockValue(prop) {
    // Generate value based on prop type
    switch (prop.type) {
      case 'string':
        return `Mock ${prop.name}`;
      
      case 'number':
        return 42;
      
      case 'boolean':
        return true;
      
      case 'array':
        return [1, 2, 3];
      
      case 'object':
        return { id: 1, name: 'Mock Object' };
      
      case 'function':
        return '() => {}'; // String representation of function
      
      default:
        return prop.defaultValue !== undefined ? prop.defaultValue : null;
    }
  }

  /**
   * Generate mock data for a component
   * @param {string} componentName - Name of the component
   * @param {number} count - Number of items to generate
   * @param {boolean} [sorted=false] - Whether to sort the data
   * @returns {Object[]} Mock data items
   * @private
   */
  _generateMockData(componentName, count, sorted = false) {
    const itemType = componentName.replace(/List|Table|.*(?=[A-Z])/g, '');
    const items = [];
    
    for (let i = 0; i < count; i++) {
      items.push({
        id: i + 1,
        name: `${itemType} ${i + 1}`,
        description: `Description for ${itemType} ${i + 1}`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString() // Days ago
      });
    }
    
    if (sorted) {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return items;
  }

  /**
   * Generate hierarchical mock data
   * @param {string} componentName - Name of the component
   * @param {number} depth - Maximum depth of hierarchy
   * @param {number} childrenPerLevel - Number of children per parent
   * @returns {Object[]} Hierarchical mock data
   * @private
   */
  _generateHierarchicalData(componentName, depth, childrenPerLevel) {
    const itemType = componentName.replace(/List|Table|.*(?=[A-Z])/g, '');
    
    // Generate hierarchical data recursively
    const generateLevel = (level, parentId = null, prefix = '') => {
      if (level > depth) {
        return [];
      }
      
      const items = [];
      
      for (let i = 0; i < childrenPerLevel; i++) {
        const id = parentId ? `${parentId}-${i + 1}` : `${i + 1}`;
        const itemPrefix = prefix ? `${prefix}-${i + 1}` : `${i + 1}`;
        
        const item = {
          id,
          name: `${itemType} ${itemPrefix}`,
          description: `Description for ${itemType} ${itemPrefix}`,
          parentId,
          depth: level - 1
        };
        
        items.push(item);
        
        // Generate children recursively
        if (level < depth) {
          const children = generateLevel(level + 1, id, itemPrefix);
          items.push(...children);
        }
      }
      
      return items;
    };
    
    return generateLevel(1);
  }

  /**
   * Determine the output path for a fixture file
   * @param {Object} requirements - Component requirements
   * @param {string} fixtureName - Name of the fixture
   * @param {Object} options - Generation options
   * @returns {string} Output path
   * @private
   */
  _determineFixturePath(requirements, fixtureName, options) {
    const { componentName, category } = requirements;
    
    // Determine base output directory
    let outputDir = options.outputDir || this.config.get('paths.fixtures');
    
    // Add category subdirectories if provided
    if (category) {
      outputDir = path.join(outputDir, category);
    }
    
    // Add component subdirectory
    outputDir = path.join(outputDir, componentName);
    
    // Create directory if it doesn't exist
    if (!FileSystem.directoryExists(outputDir)) {
      FileSystem.createDirectory(outputDir);
    }
    
    // Create final filename
    const filename = `${componentName}.${fixtureName}.fixture.json`;
    
    return path.join(outputDir, filename);
  }
}

export { FixtureGenerator };
