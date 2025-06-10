import { ReviewManager } from "./manager";
import { AzureOpenAI } from "openai";
import { ChatCompletionMessageParam, ChatCompletionCreateParamsNonStreaming } from "openai/resources";
import { DefaultAzureCredential, getBearerTokenProvider,  } from "@azure/identity";



interface GPTInput {
  resourceModelId: string;
  message: ChatCompletionMessageParam[];
  endpoint: string;
  apiKey: string;
  modelName?: string;
  useManagedIdentity?: boolean;

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
  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";

  const apiKey = input.apiKey;
  const azureADTokenProvider = getBearerTokenProvider(credential, scope);

  const useManagedIdentity = input.useManagedIdentity || false;

  const optionsWithKey = { deployment, apiVersion, endpoint, apiKey };
  const optionsWithIdentity = {deployment, apiVersion, endpoint, azureADTokenProvider}

  const client = useManagedIdentity?
  new AzureOpenAI(optionsWithIdentity) : new AzureOpenAI(optionsWithKey);
  

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