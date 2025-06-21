/**
 * Azure DevOps API URL construction helpers
 */

import * as tl from "azure-pipelines-task-lib";
import { AZURE_DEVOPS, SYSTEM_VARIABLES } from "./constants";

/**
 * Base URL builder for Azure DevOps API
 */
function getBaseUrl(): string {
  const collectionUri = tl.getVariable(SYSTEM_VARIABLES.TEAM_FOUNDATION_COLLECTION_URI);
  const projectId = tl.getVariable(SYSTEM_VARIABLES.TEAM_PROJECT_ID);
  
  return `${collectionUri}${projectId}/_apis/git/repositories/${tl.getVariable(SYSTEM_VARIABLES.BUILD_REPOSITORY_NAME)}`;
}

/**
 * Get pull request threads URL
 */
export function getPullRequestThreadsUrl(): string {
  const baseUrl = getBaseUrl();
  const pullRequestId = tl.getVariable(SYSTEM_VARIABLES.PULL_REQUEST_ID);
  
  return `${baseUrl}/pullRequests/${pullRequestId}/threads?api-version=${AZURE_DEVOPS.API_VERSION}`;
}

/**
 * Get pull request thread comments URL
 */
export function getPullRequestCommentsUrl(threadId: string): string {
  const baseUrl = getBaseUrl();
  const pullRequestId = tl.getVariable(SYSTEM_VARIABLES.PULL_REQUEST_ID);
  
  return `${baseUrl}/pullRequests/${pullRequestId}/threads/${threadId}/comments?api-version=${AZURE_DEVOPS.API_VERSION}`;
}

/**
 * Get delete comment URL
 */
export function getDeleteCommentUrl(threadId: string, commentId: string): string {
  const baseUrl = getBaseUrl();
  const pullRequestId = tl.getVariable(SYSTEM_VARIABLES.PULL_REQUEST_ID);
  
  return `${baseUrl}/pullRequests/${pullRequestId}/threads/${threadId}/comments/${commentId}?api-version=${AZURE_DEVOPS.API_VERSION}`;
}

/**
 * Get authorization header value
 */
export function getAuthorizationHeader(): string {
  const accessToken = tl.getVariable(SYSTEM_VARIABLES.ACCESS_TOKEN);
  return `Bearer ${accessToken}`;
}

/**
 * Get build service name for comment filtering
 */
export function getBuildServiceName(): string {
  const collectionUri = tl.getVariable(SYSTEM_VARIABLES.TEAM_FOUNDATION_COLLECTION_URI) as string;
  const teamProject = tl.getVariable(SYSTEM_VARIABLES.TEAM_PROJECT);
  const collectionName = getCollectionName(collectionUri);
  
  return `${teamProject} Build Service (${collectionName})`;
}

/**
 * Extract collection name from collection URI
 */
function getCollectionName(collectionUri: string): string {
  const collectionUriWithoutProtocol = collectionUri
    .replace("https://", "")
    .replace("http://", "");

  if (collectionUriWithoutProtocol.includes(".visualstudio.")) {
    return collectionUriWithoutProtocol.split(".visualstudio.")[0];
  } else {
    return collectionUriWithoutProtocol.split("/")[1];
  }
}