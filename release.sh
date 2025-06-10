#!/bin/bash

# Release script for GPT PR Review extension
# Creates a git tag and pushes it to trigger the deployment pipeline

set -e

# Check if version argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 1.0.0"
    exit 1
fi

VERSION=$1

# Validate version format (basic semantic versioning)
if ! [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format x.y.z (e.g., 1.0.0)"
    exit 1
fi

# Check if tag already exists
if git rev-parse "v$VERSION" >/dev/null 2>&1; then
    echo "Error: Tag v$VERSION already exists"
    exit 1
fi

echo "Creating release v$VERSION..."

# Make sure we're on the main branch and up to date
echo "Checking out main branch..."
git checkout main
git pull origin main

# Create and push the tag
echo "Creating tag v$VERSION..."
git tag -a "v$VERSION" -m "Release version $VERSION"

echo "Pushing tag to origin..."
git push origin "v$VERSION"

echo "Release v$VERSION created and pushed successfully!"
echo "The deployment pipeline should now be triggered automatically."
echo "Monitor the pipeline at: https://dev.azure.com/your-org/your-project/_build"