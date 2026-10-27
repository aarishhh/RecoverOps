#!/usr/bin/env bash
set -euo pipefail

# RecoverOps Frontend Deployment Script (S3 + CloudFront)
STACK_NAME=${1:-"recoverops-stack"}
REGION=${2:-"us-east-1"}

echo "=========================================================="
echo " RecoverOps Frontend Deployment"
echo " Stack Name: ${STACK_NAME}"
echo " Region:     ${REGION}"
echo "=========================================================="

if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI is not installed or not in PATH."
    exit 1
fi

echo "1. Retrieving S3 Bucket Name and CloudFront Distribution from CloudFormation..."
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
    --output text)

CF_DISTRIBUTION_ID=$(aws cloudformation describe-stack-resources \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query "StackResources[?ResourceType=='AWS::CloudFront::Distribution'].PhysicalResourceId" \
    --output text)

echo "   Frontend Bucket:     ${FRONTEND_BUCKET}"
echo "   API Gateway URL:     ${API_URL}"
echo "   CloudFront Dist ID:  ${CF_DISTRIBUTION_ID}"

echo "2. Writing production API URL to frontend/.env..."
echo "VITE_API_BASE_URL=${API_URL}" > ./frontend/.env

echo "3. Building production React + Vite bundle..."
(cd ./frontend && npm run build)

echo "4. Syncing build files to S3 bucket s3://${FRONTEND_BUCKET}..."
aws s3 sync ./frontend/dist "s3://${FRONTEND_BUCKET}" --delete

echo "5. Invalidating CloudFront edge cache..."
aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths "/*"

echo ""
echo "=========================================================="
echo " Frontend successfully deployed to CloudFront & S3!"
echo " Public URL: https://$(aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomain'].OutputValue" --output text)"
echo "=========================================================="
