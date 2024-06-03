import { APIKey } from "./.data/apikey";
import { AISearch } from "./.data/params";
import { chatGPT } from "../src/lib/openai";

("llm-infra-4o");
("llm-infra-text3l");

(async () => {
  const result = await chatGPT({
    resourceModelId: "llm-infra-4o",
    msg: [
      {
        role: "system",
        content: "This is a test.",
      },
      {
        role: "user",
        content: "How can use iwtk with typescript?",
      },
    ],
    apiKey: APIKey,
    endpoint: "....",
    aiSearchExtension: {
      endpoint: AISearch.endpoint,
      apiKey: AISearch.apikey,
      indexName: AISearch.indexName,
    },
  });

  console.log(result);
  console.log(result.choices);
})();
