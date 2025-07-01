#!/bin/bash

# AWS Infrastructure Deployment Script for Shifting Corridors Lodge
# This script deploys the CloudFormation stack for the static website

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="shifting-corridors-lodge"
TEMPLATE_FILE="cloudformation-template.yml"
REGION="${AWS_REGION:-us-east-1}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is installed and configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi

    print_success "AWS CLI is configured"
}

# Function to validate CloudFormation template
validate_template() {
    print_status "Validating CloudFormation template..."
    
    if aws cloudformation validate-template --template-body file://$TEMPLATE_FILE --region $REGION &> /dev/null; then
        print_success "Template validation passed"
    else
        print_error "Template validation failed"
        exit 1
    fi
}

# Function to check if stack exists
stack_exists() {
    aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null
}

# Function to deploy or update stack
deploy_stack() {
    local operation
    local parameters=""
    
    # Check for optional parameters
    if [ ! -z "$DOMAIN_NAME" ]; then
        parameters="$parameters ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME"
    fi
    
    if [ ! -z "$CERTIFICATE_ARN" ]; then
        parameters="$parameters ParameterKey=CertificateArn,ParameterValue=$CERTIFICATE_ARN"
    fi

    if stack_exists; then
        operation="update-stack"
        print_status "Updating existing stack: $STACK_NAME"
    else
        operation="create-stack"
        print_status "Creating new stack: $STACK_NAME"
    fi

    local cmd="aws cloudformation $operation --stack-name $STACK_NAME --template-body file://$TEMPLATE_FILE --region $REGION --capabilities CAPABILITY_IAM"
    
    if [ ! -z "$parameters" ]; then
        cmd="$cmd --parameters $parameters"
    fi

    if eval $cmd; then
        print_success "Stack operation initiated successfully"
    else
        print_error "Stack operation failed"
        exit 1
    fi
}

# Function to wait for stack operation to complete
wait_for_stack() {
    print_status "Waiting for stack operation to complete..."
    
    if stack_exists; then
        aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION 2>/dev/null || \
        aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION
    else
        aws cloudformation wait stack-create-complete --stack-name $STACK_NAME --region $REGION
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Stack operation completed successfully"
    else
        print_error "Stack operation failed or timed out"
        exit 1
    fi
}

# Function to get stack outputs
get_stack_outputs() {
    print_status "Retrieving stack outputs..."
    
    local outputs=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs' --output table)
    
    if [ $? -eq 0 ]; then
        echo "$outputs"
        print_success "Stack outputs retrieved"
    else
        print_warning "Could not retrieve stack outputs"
    fi
}

# Function to display GitHub Actions setup instructions
display_github_setup() {
    print_status "Setting up GitHub Actions secrets..."
    
    local bucket_name=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`WebsiteBucketName`].OutputValue' --output text)
    local distribution_id=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' --output text)
    local access_key_id=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION --query 'Stacks[0].Outputs[?OutputKey==`DeploymentAccessKeyId`].OutputValue' --output text)
    
    echo ""
    echo "=================================================="
    echo "GitHub Actions Setup Instructions"
    echo "=================================================="
    echo ""
    echo "Add the following secrets to your GitHub repository:"
    echo ""
    echo "AWS_ACCESS_KEY_ID: $access_key_id"
    echo "AWS_SECRET_ACCESS_KEY: [Retrieved from CloudFormation outputs - check AWS Console]"
    echo "AWS_REGION: $REGION"
    echo "S3_BUCKET_NAME: $bucket_name"
    echo "CLOUDFRONT_DISTRIBUTION_ID: $distribution_id"
    echo ""
    echo "Note: The AWS_SECRET_ACCESS_KEY is sensitive and should be retrieved"
    echo "from the CloudFormation stack outputs in the AWS Console."
    echo ""
    echo "=================================================="
}

# Main execution
main() {
    echo "=================================================="
    echo "AWS Infrastructure Deployment"
    echo "Shifting Corridors Lodge Static Website"
    echo "=================================================="
    echo ""

    # Check prerequisites
    check_aws_cli
    
    # Change to the directory containing the script
    cd "$(dirname "$0")"
    
    # Validate template
    validate_template
    
    # Deploy stack
    deploy_stack
    
    # Wait for completion
    wait_for_stack
    
    # Get outputs
    get_stack_outputs
    
    # Display setup instructions
    display_github_setup
    
    print_success "Infrastructure deployment completed!"
    echo ""
    echo "Your website infrastructure is now ready."
    echo "Configure GitHub Actions secrets and push to deploy your site."
}

# Run main function
main "$@"