param(
    [string]$StackName = "recoverops-stack",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " RecoverOps Frontend Deployment (PowerShell)" -ForegroundColor Cyan
Write-Host " Stack Name: $StackName"
Write-Host " Region:     $Region"
Write-Host "=========================================================="

if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed or not in PATH."
    exit 1
}

Write-Host "1. Querying stack outputs for S3 bucket and API URL..." -ForegroundColor Green
$FrontendBucket = (aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
    --output text).Trim()

$ApiUrl = (aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" `
    --output text).Trim()

$CfDistId = (aws cloudformation describe-stack-resources `
    --stack-name $StackName `
    --region $Region `
    --query "StackResources[?ResourceType=='AWS::CloudFront::Distribution'].PhysicalResourceId" `
    --output text).Trim()

Write-Host "   Frontend Bucket:    $FrontendBucket"
Write-Host "   API Gateway URL:    $ApiUrl"
Write-Host "   CloudFront Dist ID: $CfDistId"

Write-Host "2. Updating frontend/.env with deployed API Gateway URL..." -ForegroundColor Green
"VITE_API_BASE_URL=$ApiUrl" | Out-File -FilePath "./frontend/.env" -Encoding utf8

Write-Host "3. Compiling production frontend bundle with Vite..." -ForegroundColor Green
Push-Location frontend
try {
    npm run build
} finally {
    Pop-Location
}

Write-Host "4. Syncing assets to S3 (s3://$FrontendBucket)..." -ForegroundColor Green
aws s3 sync ./frontend/dist "s3://$FrontendBucket" --delete

Write-Host "5. Creating CloudFront cache invalidation..." -ForegroundColor Green
aws cloudfront create-invalidation `
    --distribution-id $CfDistId `
    --paths "/*"

$Domain = (aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" `
    --output text).Trim()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Frontend successfully deployed!" -ForegroundColor Green
Write-Host " Public URL: https://$Domain" -ForegroundColor Cyan
Write-Host "=========================================================="
