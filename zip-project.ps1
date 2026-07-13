# PowerShell script to package the Waste Segregation Monitor project into a ZIP file.
# Excludes heavy node_modules folder to keep the zip lightweight.

$sourceDir = Get-Item .
$zipName = "waste-segregation-monitor.zip"
$destinationZip = Join-Path $sourceDir.Parent.FullName $zipName
$tempBuildDir = Join-Path $sourceDir.Parent.FullName "temp_zip_build"

Write-Host "Creating deployment package..." -ForegroundColor Cyan

# 1. Clean up old structures if any exist
if (Test-Path $destinationZip) {
    Remove-Item $destinationZip -Force
}
if (Test-Path $tempBuildDir) {
    Remove-Item $tempBuildDir -Recurse -Force
}

# 2. Re-create temp folder
New-Item -ItemType Directory -Force -Path $tempBuildDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tempBuildDir "backend") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tempBuildDir "frontend") | Out-Null

# 3. Copy source files (excluding node_modules, build/dist, local DBs, etc.)
Write-Host "Copying project source files..." -ForegroundColor Gray

# Copy Root Files
Copy-Item "package.json" -Destination $tempBuildDir
if (Test-Path "README.md") { Copy-Item "README.md" -Destination $tempBuildDir }
if (Test-Path "run.bat") { Copy-Item "run.bat" -Destination $tempBuildDir }
if (Test-Path "setup.bat") { Copy-Item "setup.bat" -Destination $tempBuildDir }

# Copy Backend files (excluding node_modules and sqlite database file)
Get-ChildItem -Path "backend" -Exclude "node_modules", "waste_segregation.db" | ForEach-Object {
    Copy-Item $_.FullName -Destination (Join-Path $tempBuildDir "backend") -Recurse
}

# Copy Frontend files (excluding node_modules and dist/build)
Get-ChildItem -Path "frontend" -Exclude "node_modules", "dist" | ForEach-Object {
    Copy-Item $_.FullName -Destination (Join-Path $tempBuildDir "frontend") -Recurse
}

# 4. Compress to ZIP
Write-Host "Compressing archive to $destinationZip..." -ForegroundColor Yellow
Compress-Archive -Path "$tempBuildDir\*" -DestinationPath $destinationZip -Force

# 5. Cleanup temp folder
Remove-Item $tempBuildDir -Recurse -Force

Write-Host "Successfully packaged code into: $destinationZip" -ForegroundColor Green
Write-Host "The user can unzip this folder and run 'setup.bat' to install all components." -ForegroundColor Green
