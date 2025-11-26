// @ts-nocheck
import { getLlmChatClient } from "../azure/llm.js";
import { StateAnnotation } from "../langchain/state.js";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessage } from "@langchain/core/messages";
import { ANSWER_NODE, END } from "./nodes.js";

const PDF_DOCS_REQUIRED = "Answer requires HR PDF docs.";

export async function requiresHrResources(
  state: typeof StateAnnotation.State,
  _config: RunnableConfig,
): Promise<typeof StateAnnotation.Update> {
  const lastUserMessage: BaseMessage = [...state.messages].reverse()[0];

  let pdfDocsRequired = false;

  if (lastUserMessage && typeof lastUserMessage.content === "string") {
    const question = `Does the following question require general company policy information that could be found in HR documents like employee handbooks, benefits overviews, or company-wide policies, then answer yes. Answer no if this requires personal employee-specific information that would require access to an individual's private data, employment records, or personalized benefits details: '${lastUserMessage.content}'. Answer with only "yes" or "no".`;

    const llm = getLlmChatClient();
    const response = await llm.invoke(question);
    const answer = response.content.toLocaleLowerCase().trim();
    console.log(`LLM question (is HR PDF documents required): ${question}`);
    console.log(`LLM answer (is HR PDF documents required): ${answer}`);
    pdfDocsRequired = answer === "yes";
  }

  // If HR documents (aka vector store) are required, append an assistant message to signal this.
  if (!pdfDocsRequired) {
    const updatedState = {
      messages: [
        ...state.messages,
        {
          role: "assistant",
          content:
            "Not a question for our HR PDF resources. This requires data specific to the asker.",
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
          content: `${PDF_DOCS_REQUIRED} You asked: ${lastUserMessage.content}. Let me check.`,
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

  if (lastMessage && !lastMessage.content.includes(PDF_DOCS_REQUIRED)) {
    console.log("go to end");
    return END;
  }
  console.log("go to llm");
  return ANSWER_NODE;
};
