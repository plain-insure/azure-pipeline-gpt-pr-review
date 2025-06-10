#!/bin/bash

# Build script for GPT PR Review extension
# This script builds the extension and creates a package ready for Azure Marketplace

set -e

echo "Building GPT PR Review extension..."

# Navigate to the GPTCodeReview directory
cd "$(dirname "$0")/GPTCodeReview"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Go back to root directory
cd ..

# Install tfx-cli if not available
if ! command -v tfx &> /dev/null; then
    echo "Installing tfx-cli..."
    npm install -g tfx-cli
fi

# Create the extension package
echo "Creating extension package..."
tfx extension create --manifest-globs vss-extension.json

echo "Build completed successfully!"
echo "Extension package (.vsix file) created in current directory"