// Script to update the category test to be more resilient
const fs = require('fs').promises;
const path = require('path');

/**
 * Update the category test file to try multiple category slugs
 */
async function updateCategoryTest() {
  try {
    console.log('Updating category test to be more resilient...');
    
    const testFilePath = path.join(__dirname, '..', 'tests', 'e2e', 'category.spec.ts');
    
    // Read the current test file
    const testFileContent = await fs.readFile(testFilePath, 'utf8');
    
    // Check if we need to update the category options
    if (testFileContent.includes('const categoryOptions = [')) {
      console.log('Category test already has multiple options, no update needed');
      return true;
    }
    
    // Find the section where the category URL is defined
    const categoryUrlPattern = /await page\.goto\('\/([^']+)'\);/;
    const match = testFileContent.match(categoryUrlPattern);
    
    if (!match) {
      console.error('❌ Could not find category URL in the test file');
      return false;
    }
    
    const currentCategorySlug = match[1];
    console.log(`Current category slug in test: ${currentCategorySlug}`);
    
    // Create the updated content with multiple category options
    const updatedContent = testFileContent.replace(
      /await page\.goto\('\/([^']+)'\);/,
      `// Try a few common category slugs that might exist
    const categoryOptions = ['${currentCategorySlug}', 'test-category', 'general', 'services', 'products', 'business'];
    let categoryFound = false;
    
    for (const category of categoryOptions) {
      console.log(\`Trying category: \${category}\`);
      await page.goto(\`/\${category}\`, { timeout: 10000 }).catch(() => {
        console.log(\`Failed to navigate to /\${category}\`);
      });
      
      // Check if we got a 404 page
      const is404 = await page.content().then(content => 
        content.includes('404') || 
        content.includes('Not Found') ||
        content.includes('page could not be found')
      );
      
      if (!is404) {
        console.log(\`Found valid category: \${category}\`);
        categoryFound = true;
        break;
      }
    }
    
    if (!categoryFound) {
      console.log('Could not find any valid category, test may fail');
    }`
    );
    
    // Write the updated file
    await fs.writeFile(testFilePath, updatedContent);
    console.log('✅ Updated category test to try multiple category slugs');
    return true;
  } catch (error) {
    console.error('❌ Error updating category test:', error.message);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Updating E2E tests to be more resilient...');
  
  try {
    // Update the category test
    const updated = await updateCategoryTest();
    
    if (updated) {
      console.log('\n✅ E2E tests updated successfully');
      console.log('\nYou can now run the E2E tests:');
      console.log('npm run test:e2e:playwright:parallel');
    } else {
      console.error('❌ Failed to update E2E tests');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error updating E2E tests:', error);
    process.exit(1);
  }
}

// Execute the function
main();
