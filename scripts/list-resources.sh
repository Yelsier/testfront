#!/bin/bash

# Script para listar todos los recursos de AWS creados por SST

echo "🔍 Buscando recursos de SST..."
echo ""

APP_NAME="cms-front"
STAGE="production"

echo "📦 App: $APP_NAME"
echo "🏷️  Stage: $STAGE"
echo ""
echo "================================"
echo ""

# 1. Lambda Functions
echo "⚡ Lambda Functions:"
aws lambda list-functions --query "Functions[?starts_with(FunctionName, '${APP_NAME}')].{Name:FunctionName, Runtime:Runtime, Size:CodeSize}" --output table
echo ""

# 2. S3 Buckets
echo "🪣 S3 Buckets:"
aws s3api list-buckets --query "Buckets[?starts_with(Name, '${APP_NAME}')].{Name:Name, Created:CreationDate}" --output table
echo ""

# 3. CloudFront Distributions
echo "🌐 CloudFront Distributions:"
aws cloudfront list-distributions --query "DistributionList.Items[?Comment && contains(Comment, '${APP_NAME}')].{ID:Id, Domain:DomainName, Status:Status, Comment:Comment}" --output table 2>/dev/null || echo "No CloudFront distributions found or permissions issue"
echo ""

# 4. IAM Roles
echo "🔐 IAM Roles:"
aws iam list-roles --query "Roles[?starts_with(RoleName, '${APP_NAME}')].{Name:RoleName, Created:CreateDate}" --output table
echo ""

# 5. SST State
echo "📋 SST State Location:"
echo "   ~/.sst/state/${APP_NAME}/${STAGE}/"
ls -lh ~/.sst/state/${APP_NAME}/${STAGE}/ 2>/dev/null || echo "   No state found"
echo ""