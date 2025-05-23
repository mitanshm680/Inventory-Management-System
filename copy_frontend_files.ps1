# Script to copy frontend JS files and directory structure
$outputFile = "frontend_files.txt"

# Clear or create the output file
"FRONTEND DIRECTORY STRUCTURE" | Out-File -FilePath $outputFile

# Function to recursively list directory structure
function Get-DirectoryStructure {
    param (
        [string]$Path,
        [int]$Indent = 0
    )
    
    $indentString = " " * $Indent
    
    foreach ($item in Get-ChildItem -Path $Path) {
        if ($item.Name -eq "node_modules") {
            "$indentString$($item.Name)/ (skipped)" | Out-File -FilePath $outputFile -Append
            continue
        }
        
        if ($item.PSIsContainer) {
            "$indentString$($item.Name)/" | Out-File -FilePath $outputFile -Append
            Get-DirectoryStructure -Path $item.FullName -Indent ($Indent + 2)
        }
        else {
            "$indentString$($item.Name)" | Out-File -FilePath $outputFile -Append
        }
    }
}

# Get the directory structure
"" | Out-File -FilePath $outputFile -Append
Get-DirectoryStructure -Path ".\frontend"

# Function to copy JS file contents
function Copy-JSFilesContent {
    param (
        [string]$Path
    )
    
    foreach ($item in Get-ChildItem -Path $Path -Recurse) {
        if (-not $item.PSIsContainer -and $item.Extension -eq ".js") {
            "" | Out-File -FilePath $outputFile -Append
            "=========================" | Out-File -FilePath $outputFile -Append
            "FILE: $($item.FullName.Replace($PWD.Path + '\', ''))" | Out-File -FilePath $outputFile -Append
            "=========================" | Out-File -FilePath $outputFile -Append
            "" | Out-File -FilePath $outputFile -Append
            Get-Content -Path $item.FullName | Out-File -FilePath $outputFile -Append
        }
    }
}

# Copy JS file contents (skipping node_modules)
"" | Out-File -FilePath $outputFile -Append
"JS FILE CONTENTS" | Out-File -FilePath $outputFile -Append
"" | Out-File -FilePath $outputFile -Append
$excludeNodeModules = @(Get-ChildItem -Path ".\frontend" -Exclude "node_modules")
foreach ($item in $excludeNodeModules) {
    if ($item.PSIsContainer) {
        Copy-JSFilesContent -Path $item.FullName
    }
    elseif ($item.Extension -eq ".js") {
        "" | Out-File -FilePath $outputFile -Append
        "=========================" | Out-File -FilePath $outputFile -Append
        "FILE: $($item.FullName.Replace($PWD.Path + '\', ''))" | Out-File -FilePath $outputFile -Append
        "=========================" | Out-File -FilePath $outputFile -Append
        "" | Out-File -FilePath $outputFile -Append
        Get-Content -Path $item.FullName | Out-File -FilePath $outputFile -Append
    }
}

Write-Host "Frontend directory structure and JS files have been copied to $outputFile" 