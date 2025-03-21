import { ReviewManager } from "./manager";
import { AzureOpenAI } from "openai";
import { ChatCompletionMessageParam, ChatCompletionCreateParamsNonStreaming, ChatCompletionStoreMessagesPage } from "openai/resources";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";


interface GPTInput {
  resourceModelId: string;
  message: ChatCompletionMessageParam[];
  endpoint: string;

  options?: {
    filename?: string;
  };

  aiSearchExtension?: {
    endpoint: string;
    indexName: string;
  };
}

export async function chatGPT(input: GPTInput) {
  let result;

  const deployment = "gpt-4o";
  const apiVersion = "2025-01-01-preview";
  const endpoint = "https://plain.openai.azure.com/";
  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";
  const azureADTokenProvider = getBearerTokenProvider(credential, scope);

  const options = { deployment, apiVersion, azureADTokenProvider, endpoint };
  const client = new AzureOpenAI(options);

  const chatOptions: ChatCompletionCreateParamsNonStreaming = {
    max_tokens: 1024,
    model: "chatgpt-4o-latest",
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
          authentication: {
            type: "api_key",
          },
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