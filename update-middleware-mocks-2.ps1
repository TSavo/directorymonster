$testFiles = Get-ChildItem -Path "tests/unit/app/api/admin/categories" -Filter "*.test.ts" -Exclude "site-permissions.test.ts", "security.test.ts", "sorting.test.ts", "caching.test.ts"

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Update the middleware mock
    $content = $content -replace "jest\.mock\('@/app/api/middleware', \(\) => \(\{\s+withTenantAccess: jest\.fn\(\),\s+withPermission: jest\.fn\(\),?\s+\}\)\);", "jest.mock('@/app/api/middleware', () => ({`n  withTenantAccess: jest.fn(),`n  withPermission: jest.fn(),`n  withSitePermission: jest.fn(),`n}));"
    
    # Write the updated content back to the file
    Set-Content -Path $file.FullName -Value $content
    
    Write-Host "Updated $($file.Name)"
}

Write-Host "Done!"
