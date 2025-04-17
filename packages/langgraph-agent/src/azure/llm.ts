import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../langchain/state.js";
import { AzureChatOpenAI } from "@langchain/openai";
import { LLM_CONFIG } from "../config/llm.js";

export const getLlmChatClient = (): AzureChatOpenAI => {
  return new AzureChatOpenAI({
    ...LLM_CONFIG,
    temperature: 0,
  });
};

export const callChatCompletionModel = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const llm = new AzureChatOpenAI({
    ...LLM_CONFIG,
    temperature: 0,
  });

  const completion = await llm.invoke(state.messages);
  completion;

  return {
    messages: [
      ...state.messages,
      {
        role: "assistant",
        content: completion.content,
      },
    ],
  };
};
