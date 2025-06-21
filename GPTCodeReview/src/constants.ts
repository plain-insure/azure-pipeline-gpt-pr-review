/**
 * Application constants and configuration values
 */

/**
 * Azure DevOps API configuration
 */
export const AZURE_DEVOPS = {
  API_VERSION: "5.1",
  COMMENT_TYPE: {
    TEXT: 1,
  },
  THREAD_STATUS: {
    ACTIVE: 1,
  },
} as const;

/**
 * Azure OpenAI configuration
 */
export const AZURE_OPENAI = {
  DEFAULT_MODEL: "gpt-4o",
  API_VERSION: "2025-01-01-preview",
  SCOPE: "https://cognitiveservices.azure.com/.default",
  DEFAULT_MAX_TOKENS: 1024,
} as const;

/**
 * Git configuration
 */
export const GIT_CONFIG = {
  DIFF_FILTER: "AMD", // Added, Modified, Deleted
  CORE_PAGER: "cat",
  CORE_QUOTEPATH: "false",
} as const;

/**
 * Review prompts in different languages
 */
export const REVIEW_PROMPTS = {
  en: `
  Act as a code reviewer of a Pull Request, providing feedback on possible bugs and clean code issues.
  You are provided with the Pull Request changes in a patch format.
  Each patch entry has the commit message in the Subject line followed by the code changes (diffs) in a unidiff format.
  Don't need to describe everything.

  As a code reviewer, your task is:
          - Review only added, edited or deleted lines.
          - If there's no bugs and the changes are correct, write only 'No feedback.'
          - If there's bug or incorrect code changes, don't write 'No feedback.'
  `,
} as const;

/**
 * Azure DevOps system variables
 */
export const SYSTEM_VARIABLES = {
  BUILD_REASON: "Build.Reason",
  TEAM_FOUNDATION_COLLECTION_URI: "SYSTEM.TEAMFOUNDATIONCOLLECTIONURI",
  TEAM_PROJECT_ID: "SYSTEM.TEAMPROJECTID",
  TEAM_PROJECT: "SYSTEM.TEAMPROJECT",
  BUILD_REPOSITORY_NAME: "Build.Repository.Name",
  PULL_REQUEST_ID: "System.PullRequest.PullRequestId",
  PULL_REQUEST_TARGET_BRANCH: "System.PullRequest.TargetBranchName",
  PULL_REQUEST_TARGET_BRANCH_REF: "System.PullRequest.TargetBranch",
  ACCESS_TOKEN: "SYSTEM.ACCESSTOKEN",
  DEFAULT_WORKING_DIRECTORY: "System.DefaultWorkingDirectory",
  OIDC_REQUEST_URI: "SYSTEM_OIDCREQUESTURI",
} as const;

/**
 * Authentication schemes
 */
export const AUTH_SCHEMES = {
  SERVICE_PRINCIPAL: "serviceprincipal",
  WORKLOAD_IDENTITY_FEDERATION: "workloadidentityfederation",
} as const;

/**
 * Application messages
 */
export const MESSAGES = {
  PULL_REQUEST_ONLY: "This task should be run only when the build is triggered from a Pull Request.",
  AZURE_AI_ONLY: "Only support Azure AI Service.",
  NO_TARGET_BRANCH: "No target branch found!",
  NO_AUTH_METHOD: "No authentication method provided! Please provide an API key, enable managed identity, or specify an Azure subscription service connection.",
  REVIEW_COMPLETED: "Pull Request reviewed.",
  NEW_COMMENT_ADDED: "New comment added.",
  EXISTING_COMMENTS_DELETED: "Existing comments deleted.",
  DELETING_COMMENTS: "Start deleting existing comments added by the previous Job ...",
  NO_FEEDBACK: "No feedback.",
} as const;