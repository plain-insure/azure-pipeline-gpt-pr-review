# GitHub Copilot Instructions for Azure Pipeline GPT PR Review

This repository contains an Azure DevOps extension that provides AI-powered code review for pull requests using OpenAI GPT models.

## Project Overview

**Type**: Azure DevOps Build Pipeline Task Extension
**Language**: TypeScript
**Runtime**: Node.js
**Purpose**: Automated PR review using Azure OpenAI/OpenAI models

## Project Structure

```
.
├── GPTCodeReview/           # Main task implementation
│   ├── src/                 # TypeScript source code
│   │   ├── index.ts        # Entry point for the Azure DevOps task
│   │   ├── pr.ts           # Pull request operations
│   │   ├── review.ts       # Code review logic
│   │   ├── git.ts          # Git operations
│   │   ├── types.ts        # TypeScript type definitions
│   │   ├── constants.ts    # Constants and configuration
│   │   ├── utils.ts        # Utility functions
│   │   ├── azure-devops-helpers.ts  # Azure DevOps API helpers
│   │   └── lib/            # Core library modules
│   │       ├── manager.ts  # Review manager
│   │       ├── openai.ts   # OpenAI/Azure OpenAI integration
│   │       ├── git.ts      # Git utilities
│   │       └── storage.ts  # Azure Storage integration
│   ├── dist/               # Compiled JavaScript (generated)
│   ├── task.json           # Azure DevOps task manifest
│   ├── package.json        # Node.js dependencies
│   └── tsconfig.json       # TypeScript configuration
├── images/                  # Documentation images
├── vss-extension.json      # Extension manifest
└── README.md               # Documentation
```

## Coding Standards

### TypeScript

- **Strict Mode**: Always enabled in `tsconfig.json`
- **Target**: ES6
- **Module System**: CommonJS
- **Type Safety**: 
  - Use explicit types; avoid `any` unless absolutely necessary
  - Enable `noImplicitAny`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- **Imports**: Use ES6 import syntax
- **Async/Await**: Prefer async/await over raw promises for better readability

### Code Style

- **Indentation**: 2 spaces (consistent with existing code)
- **Quotes**: Use double quotes for strings
- **Semicolons**: Required
- **Naming Conventions**:
  - Variables/Functions: `camelCase`
  - Classes/Interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Private members: prefix with underscore (e.g., `_privateMethod`)
- **Line Length**: Aim for 100 characters max, but prioritize readability

### Comments

- Add JSDoc comments for public functions and classes
- Include inline comments for complex logic
- Avoid obvious comments; code should be self-documenting when possible

## Key Dependencies

- **azure-pipelines-task-lib**: Azure DevOps task SDK
- **@azure/openai**: Azure OpenAI SDK
- **@azure/identity**: Azure authentication
- **simple-git**: Git operations
- **openai**: OpenAI API client

## Development Workflow

### Building

```bash
cd GPTCodeReview
npm install
npm run build
```

### Testing

There are test scripts available for specific components:
- `npm run test-pr`: Test pull request operations
- `npm run test-chat`: Test chat/OpenAI integration
- `npm run test-store`: Test storage operations
- `npm run test-git`: Test git operations

### Packaging

```bash
npm run package
```

Creates a `.vsix` file for deployment to Azure DevOps marketplace.

## Authentication Methods

The extension supports three authentication methods for Azure OpenAI:

1. **API Key**: Direct API key authentication
2. **Managed Identity**: Azure managed identity for VMs
3. **Service Connection**: Azure DevOps service connection

When adding authentication-related code:
- Ensure all three methods continue to work
- Handle errors gracefully with informative messages
- Never log sensitive information (API keys, tokens, etc.)

## Azure DevOps Integration

### Task Configuration

- Task definitions are in `GPTCodeReview/task.json`
- All inputs must be properly documented with `helpMarkDown`
- Maintain backward compatibility when updating inputs

### Pull Request Operations

- Task only runs when `BUILD_REASON === 'PullRequest'`
- Uses OAuth token for PR API access
- Requires `persistCredentials: true` in checkout step

## Best Practices

### Error Handling

- Use try-catch blocks for async operations
- Provide clear, actionable error messages
- Use Azure DevOps task result methods:
  - `tl.setResult(tl.TaskResult.Succeeded, message)`
  - `tl.setResult(tl.TaskResult.Failed, message)`
  - `tl.setResult(tl.TaskResult.Skipped, message)`

### Logging

- Use Azure DevOps task library logging:
  - `tl.debug()` for debug information
  - `tl.warning()` for warnings
  - `tl.error()` for errors
- Never log secrets or sensitive data

### Performance

- Implement token limits to avoid excessive API costs
- Implement git patch limits to handle large PRs
- Use streaming responses where applicable
- Cache results when appropriate

### Security

- Store API keys as secret variables
- Use managed identity when possible for Azure services
- Validate all inputs from task configuration
- Sanitize file paths and user inputs
- Handle self-signed certificates only when explicitly enabled

## Code Review Focus Areas

When reviewing code changes or generating new code:

1. **Type Safety**: Ensure proper TypeScript typing
2. **Error Handling**: Check for proper error handling and logging
3. **Security**: Verify no secrets are exposed or logged
4. **Azure DevOps Integration**: Ensure compatibility with Azure DevOps task SDK
5. **Authentication**: Verify all three authentication methods still work
6. **Documentation**: Update README.md if behavior changes
7. **Backward Compatibility**: Maintain compatibility with existing pipelines

## Common Patterns

### Reading Task Inputs

```typescript
const apiKey = tl.getInput("api_key", false);  // Optional
const endpoint = tl.getInput("aoi_endpoint", true);  // Required
const useManagedIdentity = tl.getBoolInput("use_managed_identity", false);
```

### Git Operations

```typescript
const git = simpleGit(workingDirectory);
const diff = await git.diff([targetBranch, "HEAD"]);
```

### Azure DevOps API Calls

```typescript
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data),
  agent: httpsAgent
});
```

## Testing Guidelines

- Test with all three authentication methods
- Test with both Microsoft-hosted and self-hosted agents
- Test with various file types and sizes
- Test error scenarios (missing permissions, invalid credentials, etc.)
- Verify PR comments are properly formatted and posted

## Deployment

The extension is published to the Visual Studio Marketplace:
- Publisher: `plain`
- Extension ID: `AzureOpenAiCopilot`
- Always increment version numbers in both `task.json` and `vss-extension.json`

## File Patterns

### Files to Review

The extension reviews code files based on regex patterns. Default behavior:
- Binary files are automatically excluded using `binary-extensions` package
- Custom patterns can be specified via `file_pattern` input

### Files to Ignore

- Build artifacts in `dist/`
- Dependencies in `node_modules/`
- Log files
- Generated files
- Binary files

## Additional Notes

- This is a public open-source project
- Contributions should target the `main` branch
- Follow the existing code style and patterns
- Update documentation for user-facing changes
- Consider backward compatibility with existing users' pipelines
