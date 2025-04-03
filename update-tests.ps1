$testFiles = Get-ChildItem -Path "tests/unit/app/api/admin/categories" -Filter "*.test.ts" -Exclude "site-permissions.test.ts", "security.test.ts"

foreach ($file in $testFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    
    # Check if the file already imports setupPassthroughMiddlewareMocks
    if ($content -match "setupPassthroughMiddlewareMocks") {
        Write-Host "File $($file.Name) already imports setupPassthroughMiddlewareMocks"
        continue
    }
    
    # Add the import
    $content = $content -replace "import \{ CategoryService \} from '@/lib/category-service';", "import { CategoryService } from '@/lib/category-service'`nimport { setupPassthroughMiddlewareMocks } from './__mocks__/middleware-mocks';"
    
    # Add the setup in beforeEach
    $content = $content -replace "beforeEach\(\(\) => \{`n    jest\.clearAllMocks\(\);", "beforeEach(() => {`n    jest.clearAllMocks();`n    setupPassthroughMiddlewareMocks();"
    
    # Write the updated content back to the file
    Set-Content -Path $file.FullName -Value $content
    
    Write-Host "Updated $($file.Name)"
}

Write-Host "Done!"
