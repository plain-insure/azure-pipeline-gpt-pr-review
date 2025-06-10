import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import {AzureOpenAI} from "openai";

const credential = new DefaultAzureCredential();
const scope = "https://cognitiveservices.azure.com/.default";
const azureADTokenProvider = getBearerTokenProvider(credential, scope);

const deployment = "gpt-4o";
const apiVersion = "2025-01-01-preview";
const apiKey = "foo";
const endpoint = process.env.AOI_ENDPOINT || "https://[your-custom-endpoint].openai.azure.com/";

const options = { deployment, apiVersion, endpoint, azureADTokenProvider };
const client = new AzureOpenAI(options);


interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const messages: ChatMessage[] = [
  {
    role: "system",
    content: "This is a test.",
  },
  {
    role: "user",
    content: "hi",
  },
];

(async () => {
  const result = await client.chat.completions.create({messages, model: "chatgpt-4o-latest", max_tokens: 100 
  });

  console.log(result);
  console.log(result.choices);
})();
