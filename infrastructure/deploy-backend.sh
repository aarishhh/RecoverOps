#!/usr/bin/env bash
set -euo pipefail

# RecoverOps Backend Deployment Script (AWS SAM / CloudFormation)
STACK_NAME=${1:-"recoverops-stack"}
REGION=${2:-"us-east-1"}
ENVIRONMENT=${3:-"prod"}

echo "=========================================================="
echo " RecoverOps Backend Deployment"
echo " Stack Name:  ${STACK_NAME}"
echo " Region:      ${REGION}"
echo " Environment: ${ENVIRONMENT}"
echo "=========================================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI is not installed or not in PATH."
    echo "Please install AWS CLI and configure credentials via 'aws configure'."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "SAM CLI not found. Falling back to CloudFormation package/deploy..."
    
    # Create deployment artifacts bucket if needed
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    DEPLOY_BUCKET="recoverops-sam-deploy-${ACCOUNT_ID}-${REGION}"
    
    echo "Ensuring deployment bucket ${DEPLOY_BUCKET} exists..."
    aws s3 mb "s3://${DEPLOY_BUCKET}" --region "${REGION}" 2>/dev/null || true

    echo "Packaging Lambda code and CloudFormation template..."
    aws cloudformation package \
        --template-file ./infrastructure/template.yaml \
        --s3-bucket "${DEPLOY_BUCKET}" \
        --output-template-file ./infrastructure/packaged-template.yaml

    echo "Deploying CloudFormation stack..."
    aws cloudformation deploy \
        --template-file ./infrastructure/packaged-template.yaml \
        --stack-name "${STACK_NAME}" \
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
        --parameter-overrides Environment="${ENVIRONMENT}" \
        --region "${REGION}"
else
    echo "Building application with AWS SAM..."
    sam build --template-file ./infrastructure/template.yaml

    echo "Deploying application with AWS SAM..."
    sam deploy \
        --stack-name "${STACK_NAME}" \
        --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
        --parameter-overrides Environment="${ENVIRONMENT}" \
        --region "${REGION}" \
        --resolve-s3 \
        --no-confirm-changeset
fi

echo ""
echo "=== Deployment Succeeded! ==="
echo "Retrieving stack outputs..."
aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs" \
    --output table
