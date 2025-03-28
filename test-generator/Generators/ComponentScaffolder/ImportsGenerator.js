/**
 * @fileoverview Imports generator for component scaffolding.
 * Generates import statements based on component features.
 */

/**
 * Imports generator for component scaffolding
 */
class ImportsGenerator {
  /**
   * Generate imports based on component features and props
   * @param {string[]} features - Component features
   * @param {Object[]} props - Component props
   * @returns {string} Import statements
   */
  generate(features, props) {
    const imports = ['import React from \'react\';'];
    
    // Add feature-specific imports
    if (features.includes('data-loading')) {
      imports.push('import { Spinner } from \'@/components/ui/Spinner\';');
    }
    
    if (features.includes('errors')) {
      imports.push('import { Alert, AlertTitle, AlertDescription } from \'@/components/ui/Alert\';');
    }
    
    if (features.includes('form')) {
      imports.push('import { Button } from \'@/components/ui/Button\';');
      imports.push('import { Input } from \'@/components/ui/Input\';');
      imports.push('import { Form, FormField, FormItem, FormLabel, FormMessage } from \'@/components/ui/Form\';');
    }
    
    if (features.includes('sorting')) {
      imports.push('import { SortIcon, SortAscIcon, SortDescIcon } from \'@/components/ui/Icons\';');
    }
    
    if (features.includes('hierarchy')) {
      imports.push('import { ChevronRightIcon, ChevronDownIcon } from \'@/components/ui/Icons\';');
    }
    
    if (features.includes('pagination')) {
      imports.push('import { Pagination } from \'@/components/ui/Pagination\';');
    }

    // Add hook imports based on features
    const hooks = this._determineRequiredHooks(features);
    if (hooks.length > 0) {
      imports.push(`import { ${hooks.join(', ')} } from 'react';`);
    }
    
    // Add any external libraries
    const libraries = this._determineRequiredLibraries(features);
    for (const [lib, imports] of Object.entries(libraries)) {
      if (imports.length > 0) {
        if (imports[0] === '*') {
          this.imports.push(`import * as ${lib} from '${lib}';`);
        } else {
          this.imports.push(`import { ${imports.join(', ')} } from '${lib}';`);
        }
      }
    }
    
    return imports.join('\n');
  }
  
  /**
   * Determine required React hooks based on features
   * @param {string[]} features - Component features
   * @returns {string[]} Required hooks
   * @private
   */
  _determineRequiredHooks(features) {
    const hooks = new Set();
    
    if (features.includes('data-loading')) {
      hooks.add('useState');
      hooks.add('useEffect');
    } else if (features.includes('interaction') || features.includes('sorting')) {
      hooks.add('useState');
    }
    
    if (features.includes('keyboard')) {
      hooks.add('useRef');
    }
    
    if (features.includes('form')) {
      hooks.add('useForm');
    }

    if (features.includes('pagination') || features.includes('filtering')) {
      hooks.add('useCallback');
    }
    
    return Array.from(hooks);
  }
  
  /**
   * Determine required external libraries based on features
   * @param {string[]} features - Component features
   * @returns {Object} Required libraries and their imports
   * @private
   */
  _determineRequiredLibraries(features) {
    const libraries = {};
    
    if (features.includes('form')) {
      libraries['react-hook-form'] = ['useForm'];
    }
    
    if (features.includes('data-loading')) {
      libraries['swr'] = ['useSWR'];
    }
    
    if (features.includes('keyboard')) {
      libraries['@/utils/keyboard'] = ['useKeyboardNavigation'];
    }
    
    return libraries;
  }
  
  /**
   * Generate local imports for component 
   * @param {string} componentName - Name of the component
   * @param {boolean} hasTypes - Whether the component has a types file
   * @returns {string} Local import statements
   */
  generateLocalImports(componentName, hasTypes) {
    const imports = [];
    
    if (hasTypes) {
      imports.push(`import { ${componentName}Props } from './types';`);
    }
    
    return imports.join('\n');
  }
}

export default ImportsGenerator;
