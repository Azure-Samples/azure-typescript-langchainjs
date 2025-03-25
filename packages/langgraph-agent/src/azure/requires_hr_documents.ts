// @ts-nocheck
import { getLlmClient } from "./llm.js";
import { StateAnnotation } from "../langchain/state.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";
import { VECTOR_STORE_NODE, END } from "../config/nodes.js";

const HR_DOCS_REQUIRED = "HR resources required detected.";

export async function requiresHrResources(
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> {
  const lastUserMessage: BaseMessage = [...state.messages].reverse()[0];
  let hrRequired = false;
  if (lastUserMessage && typeof lastUserMessage.content === "string") {
    const question = `Does the following question require a specific companies' HR resources such as employee handbook, company medical benefits, vacation policies, and promotion, salary, and role criteria. Answer no if this requires employee data specific to the asker: '${lastUserMessage.content}'. Answer with only "yes" or "no".`;
    const llm = getLlmClient();
    const answer = (await llm.invoke(question)).toLocaleLowerCase();
    hrRequired = answer === "yes";
  }

  console.log("hrRequired " + hrRequired);

  // If HR resources are required, append an assistant message to signal this.
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
    console.log("UpdatedEndState STOP", updatedState);
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
    console.log("UpdatedContinueState CONTINUE", updatedState);
    return updatedState;
  }
}

export const routeRequiresHrResources = (
  state: typeof StateAnnotation.State,
): typeof END | typeof VECTOR_STORE_NODE => {
  const lastMessage: BaseMessage = [...state.messages].reverse()[0];
  console.log("Route lastMessage ", lastMessage);

  if (lastMessage && lastMessage.content.includes(HR_DOCS_REQUIRED)) {
    console.log("Route END");
    return END;
  }
  console.log("Route CONTINUE");
  return VECTOR_STORE_NODE;
};
