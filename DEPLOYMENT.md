# Deployment Guide

This document describes the automated deployment pipeline for the GPT PR Review Azure DevOps extension.

## Overview

The deployment pipeline automatically builds, packages, and can deploy the extension to the Azure Marketplace when triggered by tags or manual execution.

## Pipeline Triggers

- **Automatic**: Triggered on tags starting with `v*` (e.g., `v1.0.0`)
- **Manual**: Can be triggered manually on the `main` branch
- **Pull Requests**: Builds are triggered for validation

## Pipeline Stages

### 1. Build Stage
- Installs Node.js dependencies
- Compiles TypeScript code
- Updates version numbers in manifest files
- Packages the extension as a `.vsix` file
- Publishes the package as a build artifact

### 2. Deploy Stage (Production)
- Only runs for version tags (`v*`)
- Downloads the build artifact
- Can publish to Azure Marketplace (requires configuration)

## Version Management

The pipeline automatically manages versioning:
- **Major version**: Set in pipeline variables (default: 0)
- **Minor version**: Set in pipeline variables (default: 0)  
- **Patch version**: Auto-incremented counter based on build branch

## Local Development

### Prerequisites
- Node.js 16.x or later
- npm

### Building Locally

1. **Using the build script:**
   ```bash
   ./build.sh
   ```

2. **Manual steps:**
   ```bash
   cd GPTCodeReview
   npm install
   npm run build
   cd ..
   npm install -g tfx-cli
   tfx extension create --manifest-globs vss-extension.json
   ```

## Marketplace Deployment

### Prerequisites for Production Deployment

1. **Azure DevOps Organization Setup:**
   - Register as a publisher on Azure Marketplace
   - Obtain a Personal Access Token (PAT) with Marketplace permissions

2. **Pipeline Configuration:**
   - Add `MARKETPLACE_TOKEN` as a secret variable in Azure Pipelines
   - Uncomment the publish step in the pipeline YAML

3. **Marketplace Publishing:**
   The pipeline can automatically publish to Azure Marketplace when:
   - A version tag is pushed (e.g., `git tag v1.0.0 && git push origin v1.0.0`)
   - The marketplace token is configured
   - The publish step is enabled

### Manual Publishing

If you prefer manual publishing:

1. Download the `.vsix` file from the build artifacts
2. Upload manually to [Azure Marketplace](https://marketplace.visualstudio.com/manage)

## Security Considerations

- The `MARKETPLACE_TOKEN` should be stored as a secret variable
- Only authorized team members should have access to trigger production deployments
- Consider using Azure DevOps environments for additional approval gates

## Troubleshooting

### Build Failures
- Ensure all TypeScript compiles without errors
- Check that all npm dependencies are properly installed
- Verify that the `vss-extension.json` is valid

### Packaging Failures
- Ensure `tfx-cli` is properly installed
- Check that all required files are included in the extension manifest
- Verify file paths in `vss-extension.json`

### Deployment Failures
- Verify the marketplace token has correct permissions
- Check that the publisher ID matches your Azure Marketplace account
- Ensure the extension ID is unique or you have permission to update it