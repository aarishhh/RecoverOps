param(
    [string]$StackName = "recoverops-stack",
    [string]$Region = "us-east-1",
    [string]$Environment = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " RecoverOps Full Stack Deployment (PowerShell)" -ForegroundColor Cyan
Write-Host " Stack Name:  $StackName"
Write-Host " Region:      $Region"
Write-Host " Environment: $Environment"
Write-Host "=========================================================="

Write-Host "`nStep 1: Deploying Serverless Backend (DynamoDB, Lambda, API Gateway)..." -ForegroundColor Green
& ./infrastructure/deploy-backend.ps1 -StackName $StackName -Region $Region -Environment $Environment

Write-Host "`nStep 2: Deploying Frontend (S3, CloudFront, Vite build)..." -ForegroundColor Green
& ./infrastructure/deploy-frontend.ps1 -StackName $StackName -Region $Region

Write-Host "`nRecoverOps Full Stack Deployment Complete!" -ForegroundColor Green
