$testFiles = Get-ChildItem -Path "tests/unit/app/api/admin/categories" -Filter "*.test.ts" -Exclude "site-permissions.test.ts", "security.test.ts", "sorting.test.ts", "caching.test.ts", "stats.test.ts", "empty.test.ts", "search.test.ts"

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Update the middleware mock
    $content = $content -replace "jest\.mock\('@/app/api/middleware', \(\) => \{\s+const withTenantAccess = jest\.fn\(\);\s+const withPermission = jest\.fn\(\);\s+const withSitePermission = jest\.fn\(\);\s+\s+withTenantAccess\.mockImplementation\(\(req, handler\) => \{\s+return handler\(req\);\s+\}\);\s+\s+withPermission\.mockImplementation\(\(req, resourceType, permission, handler\) => \{\s+return handler\(req\);\s+\}\);\s+\s+withSitePermission\.mockImplementation\(\(req, siteId, permission, handler\) => \{\s+return handler\(req\);\s+\}\);\s+\s+return \{\s+withTenantAccess,\s+withPermission,\s+withSitePermission\s+\};\s+\}\);", "jest.mock('@/app/api/middleware', () => {`n  const withTenantAccess = jest.fn();`n  const withPermission = jest.fn();`n  const withSitePermission = jest.fn();`n  `n  withTenantAccess.mockImplementation((req, handler) => {`n    return handler(req);`n  });`n  `n  withPermission.mockImplementation((req, resourceType, permission, handler) => {`n    return handler(req);`n  });`n  `n  withSitePermission.mockImplementation((req, siteId, permission, handler) => {`n    return handler(req);`n  });`n  `n  return {`n    withTenantAccess,`n    withPermission,`n    withSitePermission`n  };`n});"
    
    # Update the middleware mock (for files that don't have withSitePermission)
    $content = $content -replace "jest\.mock\('@/app/api/middleware', \(\) => \(\{\s+withTenantAccess: jest\.fn\(\),\s+withPermission: jest\.fn\(\),\s+withSitePermission: jest\.fn\(\),?\s+\}\)\);", "jest.mock('@/app/api/middleware', () => {`n  const withTenantAccess = jest.fn();`n  const withPermission = jest.fn();`n  const withSitePermission = jest.fn();`n  `n  withTenantAccess.mockImplementation((req, handler) => {`n    return handler(req);`n  });`n  `n  withPermission.mockImplementation((req, resourceType, permission, handler) => {`n    return handler(req);`n  });`n  `n  withSitePermission.mockImplementation((req, siteId, permission, handler) => {`n    return handler(req);`n  });`n  `n  return {`n    withTenantAccess,`n    withPermission,`n    withSitePermission`n  };`n});"
    
    # Update the middleware mock (for files that don't have withSitePermission)
    $content = $content -replace "jest\.mock\('@/app/api/middleware', \(\) => \(\{\s+withTenantAccess: jest\.fn\(\),\s+withPermission: jest\.fn\(\),?\s+\}\)\);", "jest.mock('@/app/api/middleware', () => {`n  const withTenantAccess = jest.fn();`n  const withPermission = jest.fn();`n  const withSitePermission = jest.fn();`n  `n  withTenantAccess.mockImplementation((req, handler) => {`n    return handler(req);`n  });`n  `n  withPermission.mockImplementation((req, resourceType, permission, handler) => {`n    return handler(req);`n  });`n  `n  withSitePermission.mockImplementation((req, siteId, permission, handler) => {`n    return handler(req);`n  });`n  `n  return {`n    withTenantAccess,`n    withPermission,`n    withSitePermission`n  };`n});"
    
    # Remove the setupPassthroughMiddlewareMocks import
    $content = $content -replace "import \{ setupPassthroughMiddlewareMocks(?:, withSitePermission)? \} from './__mocks__/middleware-mocks';", ""
    
    # Remove the setupPassthroughMiddlewareMocks call in beforeEach
    $content = $content -replace "setupPassthroughMiddlewareMocks\(\);", ""
    
    # Write the updated content back to the file
    Set-Content -Path $file.FullName -Value $content
    
    Write-Host "Updated $($file.Name)"
}

Write-Host "Done!"
