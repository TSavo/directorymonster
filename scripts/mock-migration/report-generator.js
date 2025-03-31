/**
 * Report Generator
 * 
 * Generates readable reports of mock analysis and migration suggestions,
 * in console, HTML, and JSON formats.
 */

const fs = require('fs');
const path = require('path');

/**
 * Escape HTML special characters for safe rendering
 * 
 * @param {string} text Text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format import suggestions for display in console
 * 
 * @param {string[]} imports Array of import statements
 * @returns {string} Formatted import suggestions
 */
function formatImportSuggestions(imports) {
  if (imports.length === 0) return 'No import changes needed';
  
  return 'Add the following imports:\n' + imports.join('\n');
}

/**
 * Format replacement suggestions for display in console
 * 
 * @param {CodeSuggestion[]} suggestions Array of code replacement suggestions
 * @returns {string} Formatted replacement suggestions
 */
function formatReplacementSuggestions(suggestions) {
  if (suggestions.length === 0) return 'No replacements needed';
  
  let result = '';
  for (let i = 0; i < suggestions.length; i++) {
    const suggestion = suggestions[i];
    result += `\nReplacement #${i + 1}:\n`;
    result += `Lines ${suggestion.startLine + 1}-${suggestion.endLine + 1}:\n`;
    result += '```\n' + suggestion.original + '\n```\n';
    result += 'Replace with:\n';
    result += '```\n' + suggestion.replacement + '\n```\n';
  }
  
  return result;
}

/**
 * Generate a console report for a file migration
 * 
 * @param {object} migrationSuggestions Migration suggestions from generateMigrationSuggestions
 * @returns {string} Formatted console report
 */
function generateConsoleReport(migrationSuggestions) {
  const { filePath, imports, suggestions } = migrationSuggestions;
  
  let report = `\nSuggested changes for ${filePath}`;
  report += '\n' + '='.repeat(50) + '\n';
  report += formatImportSuggestions(imports);
  report += '\n\nReplacement suggestions:';
  report += '\n' + formatReplacementSuggestions(suggestions);
  report += '\n' + '='.repeat(50);
  
  return report;
}

/**
 * Generate an HTML report for mock analysis results
 * 
 * @param {object[]} results Analysis results from multiple files
 * @param {object} summary Summary statistics
 * @returns {string} HTML report content
 */
function generateHTMLReport(results, summary) {
  // Generate file content by pattern statistics
  const fileReports = results
    .filter(result => result.hasSuggestions)
    .map(result => {
      const { filePath, imports, suggestions } = result;
      
      const importsList = imports.length > 0
        ? `<h4>Imports to Add</h4><pre>${imports.join('\n')}</pre>`
        : '';
      
      const suggestionsList = suggestions.map(suggestion => `
        <div class="suggestion">
          <h5>Lines ${suggestion.startLine + 1}-${suggestion.endLine + 1}</h5>
          <div class="code original">
            <pre><code>${escapeHTML(suggestion.original)}</code></pre>
          </div>
          <div class="arrow">↓</div>
          <div class="code replacement">
            <pre><code>${escapeHTML(suggestion.replacement)}</code></pre>
          </div>
          ${suggestion.compatibility ? `
            <div class="compatibility ${suggestion.compatibility.isCompatible ? 'compatible' : 'incompatible'}">
              <h6>Compatibility: ${suggestion.compatibility.isCompatible ? 'Compatible' : 'Potentially Incompatible'}</h6>
              ${suggestion.compatibility.potentialIssues.length > 0 ? `
                <ul>
                  ${suggestion.compatibility.potentialIssues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `).join('');
      
      return `
        <div class="file">
          <h3>${path.basename(filePath)}</h3>
          <p class="path">${filePath}</p>
          ${importsList}
          <h4>Replacements (${suggestions.length})</h4>
          ${suggestionsList}
        </div>
      `;
    })
    .join('');
  
  // HTML template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Mock Migration Suggestions</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.5; }
        h1, h2, h3 { color: #333; }
        .summary { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; }
        .file { margin-bottom: 30px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .path { color: #666; font-family: monospace; }
        .suggestion { margin-bottom: 20px; padding: 10px; background-color: #f9f9f9; border-radius: 3px; }
        .code { padding: 10px; border-radius: 3px; }
        .original { background-color: #ffeeee; }
        .replacement { background-color: #eeffee; }
        .arrow { text-align: center; font-size: 20px; margin: 5px 0; }
        pre { margin: 0; white-space: pre-wrap; }
        code { font-family: Consolas, Monaco, 'Andale Mono', monospace; }
        .compatibility { margin-top: 10px; padding: 5px; border-radius: 3px; }
        .compatible { background-color: #e6ffe6; }
        .incompatible { background-color: #fff0f0; }
        .timestamp { font-style: italic; color: #666; }
      </style>
    </head>
    <body>
      <h1>Mock Migration Suggestions</h1>
      <p class="timestamp">Generated on ${new Date().toLocaleString()}</p>
      
      <div class="summary">
        <h2>Summary</h2>
        <p>Analyzed ${summary.filesAnalyzed} files, found ${summary.filesNeedingChanges} files needing standardization.</p>
        <ul>
          <li>NextRequest mocks: ${summary.nextRequestMocks} occurrences</li>
          <li>NextResponse mocks: ${summary.nextResponseMocks} occurrences</li>
          <li>Redis mocks: ${summary.redisMocks} occurrences</li>
          <li>Total suggested changes: ${summary.totalSuggestions}</li>
        </ul>
      </div>
      
      <h2>File Details</h2>
      ${fileReports}
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Generate a JSON report for mock analysis results
 * 
 * @param {object[]} results Analysis results from multiple files
 * @param {object} summary Summary statistics
 * @returns {string} Stringified JSON report
 */
function generateJSONReport(results, summary) {
  const report = {
    summary,
    generatedAt: new Date().toISOString(),
    files: results.map(result => ({
      filePath: result.filePath,
      hasSuggestions: result.hasSuggestions,
      imports: result.imports,
      suggestions: result.suggestions.map(suggestion => ({
        startLine: suggestion.startLine,
        endLine: suggestion.endLine,
        replacement: suggestion.replacement,
        compatibility: suggestion.compatibility
      }))
    }))
  };
  
  return JSON.stringify(report, null, 2);
}

/**
 * Write a report to a file
 * 
 * @param {string} content Report content
 * @param {string} outputPath Path to write the report
 * @param {string} type Report type (html, json)
 */
function writeReport(content, outputPath, type) {
  fs.writeFileSync(outputPath, content);
  console.log(`${type.toUpperCase()} report generated at: ${outputPath}`);
}

// Export the module
module.exports = {
  generateConsoleReport,
  generateHTMLReport,
  generateJSONReport,
  writeReport
};