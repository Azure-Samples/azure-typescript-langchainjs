// @ts-nocheck
import { getLlmChatClient } from "./llm.js";
import { StateAnnotation } from "../langchain/state.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";
import { ANSWER_NODE, END } from "../config/nodes.js";

const HR_DOCS_REQUIRED = "HR resources required detected.";

export async function requiresHrResources(
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> {
  const lastUserMessage: BaseMessage = [...state.messages].reverse()[0];

  let hrRequired = false;

  if (lastUserMessage && typeof lastUserMessage.content === "string") {
    const question = `Does the following question require a specific companies' HR resources such as employee handbook, company medical benefits, vacation policies, and promotion, salary, and role criteria. Answer no if this requires employee data specific to the asker: '${lastUserMessage.content}'. Answer with only "yes" or "no".`;

    const llm = getLlmChatClient();
    const response = await llm.invoke(question);
    const answer = response.content.toLocaleLowerCase().trim();
    console.log(`LLM question (is HR required): ${question}`);
    console.log(`LLM answer (is HR required): ${answer}`);
    hrRequired = answer === "yes";
  }

  // If HR documents (aka vector store) are required, append an assistant message to signal this.
  if (!hrRequired) {
    const updatedState = {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: HR_DOCS_REQUIRED + "Aborting query.",
        },
      ],
    };

    return updatedState;
  } else {
    const updatedState = {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content: "Great question for our HR resources. Let me check.",
        },
      ],
    };

    return updatedState;
  }
}

export const routeRequiresHrResources = (
  state: typeof StateAnnotation.State,
): typeof END | typeof ANSWER_NODE => {
  const lastMessage: BaseMessage = [...state.messages].reverse()[0];

  if (lastMessage && lastMessage.content.includes(HR_DOCS_REQUIRED)) {
    return END;
  }

  return ANSWER_NODE;
};
