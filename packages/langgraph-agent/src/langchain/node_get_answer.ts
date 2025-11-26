import { ChatPromptTemplate } from "@langchain/core/prompts";
import { getLlmChatClient } from "../azure/llm.js";
import { StateAnnotation } from "./nodes.js";
import { AIMessage } from "@langchain/core/messages";
import { getReadOnlyVectorStore } from "../azure/vector_store.js";

const EMPTY_STATE = { messages: [] };

export async function getAnswer(
  state: typeof StateAnnotation.State = EMPTY_STATE,
): Promise<typeof StateAnnotation.Update> {
  const vectorStore = getReadOnlyVectorStore();
  const llm = getLlmChatClient();

  // Extract the last user message's content from the state as input
  const lastMessage = state.messages[state.messages.length - 1];

  const userInput =
    lastMessage && typeof lastMessage.content === "string"
      ? lastMessage.content
      : "";

  const docs = await vectorStore.similaritySearch(userInput, 3);

  if (docs.length === 0) {
    const noDocMessage = new AIMessage(
      "I'm sorry, I couldn't find any relevant information to answer your question.",
    );
    return {
      messages: [...state.messages, noDocMessage],
    };
  }

  const formattedDocs = docs.map((doc) => doc.pageContent).join("\n\n");

  const prompt = ChatPromptTemplate.fromTemplate(`
    Use the following context to answer the question:

    {context}

    Question: {question}
    `);

  const ragChain = prompt.pipe(llm);

  const result = await ragChain.invoke({
    context: formattedDocs,
    question: userInput,
  });

  const assistantMessage = new AIMessage(result.text);

  return {
    messages: [...state.messages, assistantMessage],
  };
}
