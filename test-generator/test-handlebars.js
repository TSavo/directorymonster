/**
 * Test script for the Handlebars engine integration
 */
import { HandlebarsEngine } from './Core/HandlebarsEngine.js';
import fs from 'fs';
import path from 'path';

async function main() {
  try {
    console.log('Testing Handlebars engine integration...');
    
    // Initialize the engine
    const engine = new HandlebarsEngine();
    
    // Load form template
    const templatePath = path.join(process.cwd(), 'test-generator', 'templates', 'form.component.hbs');
    if (fs.existsSync(templatePath)) {
      console.log(`Loading template from: ${templatePath}`);
      await engine.loadTemplate('form.component', templatePath);
    } else {
      console.error(`Template file not found at: ${templatePath}`);
      return;
    }
    
    // Sample data for a SiteForm component
    const data = {
      componentName: 'SiteForm',
      componentDescription: 'Form for creating and editing site configurations',
      itemName: 'Site',
      componentNameCamelCase: 'siteForm',
      camelCase: (str) => str.charAt(0).toLowerCase() + str.slice(1),
      apiEndpoint: 'sites',
      resourcePath: 'sites',
      props: [
        { name: 'name', type: 'string', required: true, label: 'Site Name' },
        { name: 'slug', type: 'string', required: true, label: 'Site Slug' },
        { name: 'description', type: 'string', required: false, label: 'Description' },
        { name: 'domains', type: 'string[]', required: true, label: 'Domains' }
      ],
      hasDynamicFields: true
    };
    
    // Process the template
    console.log('Processing template with data...');
    const result = engine.processTemplate('form.component', data);
    
    // Output the result
    const outputPath = path.join(process.cwd(), 'test-generator', 'test-run', 'SiteForm.tsx');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, result);
    
    console.log(`Successfully generated component: ${outputPath}`);
  } catch (error) {
    console.error('Error testing Handlebars engine:', error.message);
    console.error(error.stack);
  }
}

main();
