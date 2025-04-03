# PowerShell script to create a GitHub issue

param (
    [Parameter(Mandatory=$true)]
    [string]$title,
    
    [Parameter(Mandatory=$true)]
    [string]$body_file
)

# Read the body content from the file
$body = Get-Content -Path $body_file -Raw

# Create the issue
gh issue create --title $title --body $body
