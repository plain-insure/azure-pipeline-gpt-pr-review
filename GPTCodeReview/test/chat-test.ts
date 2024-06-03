import { chatGPT } from "../src/lib/openai";
import { APIEndPoint, APIKey, ResourceModelId } from "./.data/testData";

(async () => {
  const result = await chatGPT({
    resourceModelId: ResourceModelId,
    msg: [
      {
        role: "system",
        content: "This is a test.",
      },
      {
        role: "user",
        content: "hi",
      },
    ],
    apiKey: APIKey,
    endpoint: APIEndPoint,
  });

  console.log(result);
  console.log(result.choices);
})();
