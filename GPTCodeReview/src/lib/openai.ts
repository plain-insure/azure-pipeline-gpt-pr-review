import { ReviewManager } from "./manager";
import { AzureOpenAI } from "openai";
import { ChatCompletionMessageParam, ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { DefaultAzureCredential, getBearerTokenProvider, ClientSecretCredential } from "@azure/identity";
import * as tl from "azure-pipelines-task-lib";



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

  aiSearchExtension?: {
    endpoint: string;
    indexName: string;
    apiKey: string;
  };
}

export async function chatGPT(input: GPTInput) {
  let result;

  const deployment = "gpt-4o";
  const apiVersion = "2025-01-01-preview";
  const endpoint = input.endpoint;
  const scope = "https://cognitiveservices.azure.com/.default";

  const apiKey = input.apiKey;

  const useManagedIdentity = input.useManagedIdentity || false;
  const azureSubscription = input.azureSubscription;

  const options: {
    apiKey?: string;
    azureADTokenProvider?: ReturnType<typeof getBearerTokenProvider>;
    deployment: string;
    apiVersion: string;
    endpoint: string;
  } = {
    deployment,
    apiVersion,
    endpoint,
  };


  if (useManagedIdentity) {
    // Use Managed Identity authentication
    const credential = new DefaultAzureCredential();
    options.azureADTokenProvider = getBearerTokenProvider(credential, scope);
  } else if (azureSubscription) {
    // Use Service Connection authentication
    const auth = tl.getEndpointAuthorization(azureSubscription, false);
    if (!auth) {
      throw new Error(`Service connection "${azureSubscription}" not found or not accessible.`);
    }
    
    const clientId = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalid', false);
    const clientSecret = tl.getEndpointAuthorizationParameter(azureSubscription, 'serviceprincipalkey', false);
    const tenantId = tl.getEndpointAuthorizationParameter(azureSubscription, 'tenantid', false);
    
    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('Service connection is missing required service principal credentials.');
    }
    
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    options.azureADTokenProvider = getBearerTokenProvider(credential, scope);
  } else {
    // Use API Key authentication
    options.apiKey = apiKey;
  }
  
  const client = new AzureOpenAI(options);

  const chatOptions: ChatCompletionCreateParamsNonStreaming = {
    max_tokens: 1024,
    model: input.modelName || "gpt-4o",
    messages: input.message
  };

  if (input.aiSearchExtension) {
        data_sources:[{
          type: "azure_search",
          parameters: {
          topNDocuments: 20,
          strictness: 3,
          endpoint: input.aiSearchExtension.endpoint,
          indexName: input.aiSearchExtension.indexName,
          authentication: useManagedIdentity ?{
            type: "aad",
          } : {
            type: "api_key",
            key: input.aiSearchExtension.apiKey,
          }
        }
      }]
    };
  

  result = await client.chat.completions.create(chatOptions);




  const usageData = result.usage
    ? {
      completionTokens: result.usage.completion_tokens,
      promptTokens: result.usage.prompt_tokens,
      totalTokens: result.usage.total_tokens,
    }
    : undefined;

  ReviewManager.info.usages.push({
    filename: input.options?.filename || "<<Undefined Filename>>",
    usages: usageData,
  });


  return result;
}