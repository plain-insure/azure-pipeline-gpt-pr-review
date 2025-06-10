#!/bin/bash

# Test script to validate the build and packaging process
# This can be used in CI/CD to validate the build before deployment

set -e

echo "🧪 Testing build and packaging process..."

# Clean any existing artifacts
echo "🧹 Cleaning artifacts..."
rm -f *.vsix
rm -rf GPTCodeReview/dist
rm -rf GPTCodeReview/node_modules

# Test build process
echo "🔨 Testing build process..."
cd GPTCodeReview

# Install dependencies
npm install

# Run build
npm run build

# Check that dist directory was created
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not created"
    exit 1
fi

# Check that main files exist in dist
if [ ! -f "dist/index.js" ]; then
    echo "❌ Error: dist/index.js not found"
    exit 1
fi

echo "✅ Build test passed"

# Test packaging process
echo "📦 Testing packaging process..."
cd ..

# Install tfx-cli
npm install -g tfx-cli

# Create package
tfx extension create --manifest-globs vss-extension.json

# Check that vsix file was created
VSIX_FILE=$(ls *.vsix 2>/dev/null | head -1)
if [ -z "$VSIX_FILE" ]; then
    echo "❌ Error: No .vsix file created"
    exit 1
fi

echo "✅ Packaging test passed: $VSIX_FILE created"

# Clean up
rm -f *.vsix

echo "🎉 All tests passed! Build and packaging process is working correctly."