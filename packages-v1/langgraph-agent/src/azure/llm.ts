import { RunnableConfig } from "@langchain/core/runnables";
import { StateAnnotation } from "../langchain/nodes.js";
import { AzureChatOpenAI } from "@langchain/openai";
import { azureADTokenProvider_OpenAI } from "./azure-credential.js";

// <AZURE_OPENAI_LLM_UPLOAD_CONFIGURATION>
const key = process.env.AZURE_OPENAI_COMPLETE_KEY;
const instance = process.env.AZURE_OPENAI_COMPLETE_INSTANCE;
const apiVersion =
  process.env.AZURE_OPENAI_COMPLETE_API_VERSION || "2024-10-21";
const model = process.env.AZURE_OPENAI_COMPLETE_MODEL || "gpt-4o";
const maxTokens = process.env.AZURE_OPENAI_COMPLETE_MAX_TOKENS;
const azureOpenAIBasePath = `https://${process.env.AZURE_OPENAI_COMPLETE_INSTANCE}.openai.azure.com/openai/deployments`;
// </AZURE_OPENAI_LLM_UPLOAD_CONFIGURATION>

// <AZURE_OPENAI_LLM_AUTH>
const shared = {
  azureOpenAIApiInstanceName: instance,
  azureOpenAIApiDeploymentName: model,
  azureOpenAIApiVersion: apiVersion,
  azureOpenAIBasePath,
  maxTokens: maxTokens ? parseInt(maxTokens, 10) : 100,
  maxRetries: 7,
  timeout: 60000,
  temperature: 0,
};

export const LLM_KEY_CONFIG = {
  azureOpenAIApiKey: key,
  ...shared,
};

export const LLM_CONFIG_PASSWORDLESS = {
  azureADTokenProvider: azureADTokenProvider_OpenAI,
  ...shared,
};

export const LLM_CONFIG =
  process.env.SET_PASSWORDLESS == "true"
    ? LLM_CONFIG_PASSWORDLESS
    : LLM_KEY_CONFIG;
// </AZURE_OPENAI_LLM_AUTH>

// <AZURE_OPENAI_LLM_FUNCTION>
export const getLlmChatClient = (): AzureChatOpenAI => {
  return new AzureChatOpenAI({
    ...LLM_CONFIG,
  });
};
// </AZURE_OPENAI_LLM_FUNCTION>

// <AZURE_OPENAI_CHAT_FUNCTION>
export const callChatCompletionModel = async (
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> => {
  const llm = new AzureChatOpenAI({
    ...LLM_CONFIG,
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
// </AZURE_OPENAI_CHAT_FUNCTION>
