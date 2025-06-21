import { ReviewManager } from "./manager";
import { AzureOpenAI } from "openai";
import { ChatCompletionMessageParam, ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { DefaultAzureCredential, getBearerTokenProvider, ClientSecretCredential, WorkloadIdentityCredential, TokenCredential } from "@azure/identity";
import * as tl from "azure-pipelines-task-lib";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import { AzureAISearchExtension } from "../types";
import { AZURE_OPENAI, AUTH_SCHEMES } from "../constants";

interface GPTInput {
  resourceModelId: string;
  message: ChatCompletionMessageParam[];
  endpoint: string;
  apiKey?: string;
  modelName?: string;
  useManagedIdentity?: boolean;
  azureSubscription?: string;
  options?: {
    filename?: string;
  };
  aiSearchExtension?: AzureAISearchExtension;
}

/**
 * Generate OIDC token for workload identity federation
 */
async function generateToken(serviceConnectionID: string): Promise<string> {
  const url = process.env["SYSTEM_OIDCREQUESTURI"] + "?api-version=7.1&serviceConnectionId=" + serviceConnectionID;
  const oidcToken = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + tl.getEndpointAuthorizationParameter('SystemVssConnection', 'AccessToken', false)
    }
  }).then(async response => {
    const oidcObject = await (response?.json()) as { oidcToken: string };

    if (!oidcObject?.oidcToken) {
      throw new Error(tl.loc("Error_FederatedTokenAquisitionFailed"));
    }
    return oidcObject.oidcToken;
  });

  tl.setSecret(oidcToken);
  return oidcToken;
}

/**
 * Create Azure credential based on authentication scheme
 */
async function createAzureCredential(azureSubscription: string): Promise<TokenCredential> {
  const auth = tl.getEndpointAuthorization(azureSubscription, true);
  let scheme: string = AUTH_SCHEMES.WORKLOAD_IDENTITY_FEDERATION;
  
  if (!auth) {
    console.log(`Service connection "${azureSubscription}" not found or not accessible.`);
  } else {
    scheme = auth.scheme.toLowerCase();
  }
  console.log(`Auth scheme: ${scheme}`);

  if (scheme === AUTH_SCHEMES.SERVICE_PRINCIPAL) {
    const clientId = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalid', false);
    const clientSecret = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalkey', false);
    const tenantId = tl.getEndpointAuthorizationParameter(azureSubscription, 'tenantid', false);

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Service connection is missing required service principal credentials.');
    }
    return new ClientSecretCredential(tenantId, clientId, clientSecret);
    
  } else if (scheme === AUTH_SCHEMES.WORKLOAD_IDENTITY_FEDERATION) {
    const clientId = tl.getEndpointAuthorizationParameter(azureSubscription, "serviceprincipalid", true);
    const tenantId = tl.getEndpointAuthorizationParameter(azureSubscription, 'tenantid', false);
    let tokenFile = tl.getEndpointAuthorizationParameter(azureSubscription, 'federatedTokenFile', true);
    
    if (!tokenFile) {
      const oidcToken = await generateToken(azureSubscription);
      // Write the token to a temporary file
      const tmpDir = os.tmpdir();
      const tokenFilePath = path.join(tmpDir, `oidc-token-${Date.now()}.txt`);
      fs.writeFileSync(tokenFilePath, oidcToken, { encoding: "utf8" });

      // Set tokenFile to the path
      tokenFile = tokenFilePath;
      tl.setSecret(oidcToken);
    }

    if (!clientId || !tokenFile || !tenantId) {
      throw new Error('Service connection is missing required workload identity federation credentials.');
    }
    
    process.env.AZURE_CLIENT_ID = clientId;
    process.env.AZURE_TENANT_ID = tenantId;
    process.env.AZURE_FEDERATED_TOKEN_FILE = tokenFile;

    return new WorkloadIdentityCredential({
      tenantId,
      clientId,
      tokenFilePath: tokenFile,
    });
  } else {
    throw new Error(`Unsupported authentication scheme: ${scheme}`);
  }
}

/**
 * Configure Azure OpenAI options with authentication
 */
async function configureAzureOpenAIOptions(input: GPTInput) {
  const options: {
    apiKey?: string;
    azureADTokenProvider?: ReturnType<typeof getBearerTokenProvider>;
    deployment: string;
    apiVersion: string;
    endpoint: string;
  } = {
    deployment: AZURE_OPENAI.DEFAULT_MODEL,
    apiVersion: AZURE_OPENAI.API_VERSION,
    endpoint: input.endpoint,
  };

  if (input.useManagedIdentity) {
    // Use Managed Identity authentication
    const credential = new DefaultAzureCredential();
    options.azureADTokenProvider = getBearerTokenProvider(credential, AZURE_OPENAI.SCOPE);
  } else if (input.azureSubscription) {
    // Use Service Connection authentication
    console.log(`Using Azure Subscription: ${input.azureSubscription}`);
    const credential = await createAzureCredential(input.azureSubscription);
    options.azureADTokenProvider = getBearerTokenProvider(credential, AZURE_OPENAI.SCOPE);
  } else {
    // Use API Key authentication
    if (input.apiKey) {
      options.apiKey = input.apiKey;
    } else {
      throw new Error('API key is required when not using managed identity or service connection');
    }
  }

  return options;
}

/**
 * Configure chat completion options
 */
function configureChatOptions(input: GPTInput): ChatCompletionCreateParamsNonStreaming {
  const chatOptions: ChatCompletionCreateParamsNonStreaming = {
    max_tokens: AZURE_OPENAI.DEFAULT_MAX_TOKENS,
    model: input.modelName || AZURE_OPENAI.DEFAULT_MODEL,
    messages: input.message
  };

  // Note: Azure AI Search extension configuration would go here if needed
  if (input.aiSearchExtension) {
    // This would be configured based on specific Azure AI Search requirements
    // Currently commented out as the original code had syntax issues
  }

  return chatOptions;
}

export async function chatGPT(input: GPTInput) {
  const options = await configureAzureOpenAIOptions(input);
  const client = new AzureOpenAI(options);
  const chatOptions = configureChatOptions(input);

  const result = await client.chat.completions.create(chatOptions);

  const usageData = result.usage
    ? {
      completionTokens: result.usage.completion_tokens,
      promptTokens: result.usage.prompt_tokens,
      totalTokens: result.usage.total_tokens,
    }
    : undefined;

  if (usageData) {
    ReviewManager.info.usages.push({
      filename: input.options?.filename || "<<Undefined Filename>>",
      usages: usageData,
    });
  } else {
    ReviewManager.info.usages.push({
      filename: input.options?.filename || "<<Undefined Filename>>",
    });
  }

  return result;
}