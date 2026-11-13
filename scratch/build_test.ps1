$ErrorActionPreference = "Stop"
Write-Host "Running TypeScript type check..."
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Error "TypeScript check failed with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Host "TypeScript check passed successfully!"

Write-Host "Running Next.js build..."
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Host "Build completed successfully!"

