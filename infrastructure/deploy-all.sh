#!/usr/bin/env bash
set -euo pipefail

# Full Stack Automated Deployment for RecoverOps
STACK_NAME=${1:-"recoverops-stack"}
REGION=${2:-"us-east-1"}
ENVIRONMENT=${3:-"prod"}

echo "=========================================================="
echo " RecoverOps Full Stack Deployment"
echo " Stack Name:  ${STACK_NAME}"
echo " Region:      ${REGION}"
echo " Environment: ${ENVIRONMENT}"
echo "=========================================================="

echo "Step 1: Deploying Serverless Backend (DynamoDB, Lambda, API Gateway)..."
bash ./infrastructure/deploy-backend.sh "${STACK_NAME}" "${REGION}" "${ENVIRONMENT}"

echo ""
echo "Step 2: Deploying Frontend (S3, CloudFront, Vite build)..."
bash ./infrastructure/deploy-frontend.sh "${STACK_NAME}" "${REGION}"

echo ""
echo "RecoverOps Deployment Complete!"
