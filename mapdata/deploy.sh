#!/bin/bash
set -euo pipefail

# verify dependencies
if ! command -v aws &>/dev/null || ! command -v jq &>/dev/null; then
  echo "aws cli and jq are required but not installed. Please install them and try again."
  exit 1
fi

ROOT=$PWD
FUNCTION_NAME="update-bike-lanes"
REGION=${AWS_REGION:-us-east-1}
PROFILE=${AWS_PROFILE:-default}

# deploy deployment stack (S3 bucket for lambda code)
echo "deploying deployment stack"
aws --profile $PROFILE \
  cloudformation deploy \
  --template-file deployment-bucket.yml \
  --stack-name deployment \
  --capabilities CAPABILITY_IAM

# package lambda code
DIST_DIR="./dist"
ZIP_FILE="${DIST_DIR}/${FUNCTION_NAME}.zip"
rm -rf "${DIST_DIR}" && mkdir -p "${DIST_DIR}"
npm install
tsc
cp -r node_modules "${DIST_DIR}/"
cd "${DIST_DIR}" && zip -r "./${FUNCTION_NAME}.zip" .

# upload package
S3_BUCKET=$(
  aws --profile $PROFILE \
    cloudformation describe-stack-resources \
    --stack-name deployment |
    jq -r '.StackResources[] | select(.LogicalResourceId == "LambdaDeploymentBucket") | .PhysicalResourceId'
)
S3_KEY="deployments/${FUNCTION_NAME}.zip"
echo "uploading deployment package to s3://${S3_BUCKET}/${S3_KEY}"
cd $ROOT
aws --profile $PROFILE \
  s3 cp "${ZIP_FILE}" "s3://${S3_BUCKET}/${S3_KEY}"
echo "uploaded deployment package"
rm -rf "${DIST_DIR}"

# deploy lambda stack
echo "deploying citibike stack"
aws --profile $PROFILE \
  cloudformation deploy \
  --template-file stack.yml \
  --stack-name citibike \
  --capabilities CAPABILITY_IAM

# update lambda code
LAMBDA_ID=$(
  aws --profile $PROFILE \
    cloudformation describe-stack-resources \
    --stack-name citibike |
    jq -r '.StackResources[] | select(.LogicalResourceId == "UpdaterFunction") | .PhysicalResourceId'
)
aws --profile $PROFILE \
  lambda update-function-code \
  --function-name $LAMBDA_ID \
  --s3-bucket $S3_BUCKET \
  --s3-key deployments/update-bike-lanes.zip
