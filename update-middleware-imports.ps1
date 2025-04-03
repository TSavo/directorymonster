$testFiles = Get-ChildItem -Path "tests/unit/app/api/admin/categories" -Filter "*.test.ts" -Exclude "site-permissions.test.ts", "security.test.ts", "sorting.test.ts"

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Add the import for withSitePermission
    $content = $content -replace "import \{ setupPassthroughMiddlewareMocks \} from './__mocks__/middleware-mocks';", "import { setupPassthroughMiddlewareMocks, withSitePermission } from './__mocks__/middleware-mocks';"
    
    # Write the updated content back to the file
    Set-Content -Path $file.FullName -Value $content
    
    Write-Host "Updated $($file.Name)"
}

Write-Host "Done!"
