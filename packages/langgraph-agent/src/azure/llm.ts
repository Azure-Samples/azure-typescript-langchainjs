import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../langchain/state.js";
import { AzureOpenAI } from "@langchain/openai";
import { LLM_CONFIG } from "../config/llm.js";
export const getLlmClient = (): AzureOpenAI => {
  return new AzureOpenAI({
    ...LLM_CONFIG,
    temperature: 0,
  });
};

export const callCompletionModel = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const llm = new AzureOpenAI({
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
        content: completion,
      },
    ],
  };
};
