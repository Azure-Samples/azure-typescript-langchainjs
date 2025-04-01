import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { getLlmChatClient } from "./llm.js";
import { StateAnnotation } from "../langchain/state.js";
import { AIMessage } from "@langchain/core/messages";
import { getReadOnlyVectorStore } from "./vector_store.js";

const EMPTY_STATE = { messages: [] };

export async function getAnswer(
  state: typeof StateAnnotation.State = EMPTY_STATE,
): Promise<typeof StateAnnotation.Update> {
  const vectorStore = getReadOnlyVectorStore();

  // Extract the last user message's content from the state as input
  const lastMessage = state.messages[state.messages.length - 1];

  const userInput =
    lastMessage && typeof lastMessage.content === "string"
      ? lastMessage.content
      : "";

  const questionAnsweringPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer the user's questions based on the below context:\n\n{context}",
    ],
    ["human", "{input}"],
  ]);

  const combineDocsChain = await createStuffDocumentsChain({
    llm: getLlmChatClient(),
    prompt: questionAnsweringPrompt,
  });

  const retrievalChain = await createRetrievalChain({
    retriever: vectorStore.asRetriever(2),
    combineDocsChain,
  });
  const result = await retrievalChain.invoke({ input: userInput });
  const assistantMessage = new AIMessage(result.answer);

  return {
    messages: [...state.messages, assistantMessage],
  };
}
