param(
    [string]$StackName = "recoverops-stack",
    [string]$Region = "us-east-1",
    [string]$Environment = "prod"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " RecoverOps Backend Deployment (PowerShell)" -ForegroundColor Cyan
Write-Host " Stack Name:  $StackName"
Write-Host " Region:      $Region"
Write-Host " Environment: $Environment"
Write-Host "=========================================================="

# Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed or not in PATH. Please install AWS CLI and configure credentials via 'aws configure'."
    exit 1
}

# Check if SAM is available
$hasSam = Get-Command sam -ErrorAction SilentlyContinue

if ($hasSam) {
    Write-Host "Building application with AWS SAM..." -ForegroundColor Green
    sam build --template-file ./infrastructure/template.yaml

    Write-Host "Deploying stack with AWS SAM..." -ForegroundColor Green
    sam deploy `
        --stack-name $StackName `
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND `
        --parameter-overrides Environment=$Environment `
        --region $Region `
        --resolve-s3 `
        --no-confirm-changeset
} else {
    Write-Host "SAM CLI not found. Falling back to CloudFormation package & deploy..." -ForegroundColor Yellow
    $AccountId = (aws sts get-caller-identity --query Account --output text).Trim()
    $DeployBucket = "recoverops-sam-deploy-$AccountId-$Region"

    Write-Host "Ensuring deployment bucket s3://$DeployBucket exists..."
    aws s3 mb "s3://$DeployBucket" --region $Region 2>$null

    Write-Host "Packaging CloudFormation template..." -ForegroundColor Green
    aws cloudformation package `
        --template-file ./infrastructure/template.yaml `
        --s3-bucket $DeployBucket `
        --output-template-file ./infrastructure/packaged-template.yaml

    Write-Host "Deploying CloudFormation stack..." -ForegroundColor Green
    aws cloudformation deploy `
        --template-file ./infrastructure/packaged-template.yaml `
        --stack-name $StackName `
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND `
        --parameter-overrides Environment=$Environment `
        --region $Region
}

Write-Host ""
Write-Host "=== Backend Deployment Succeeded! ===" -ForegroundColor Green
Write-Host "Retrieving stack outputs..."
aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs" `
    --output table
