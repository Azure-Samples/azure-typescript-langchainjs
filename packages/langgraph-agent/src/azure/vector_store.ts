import { AzureAISearchVectorStore } from "@langchain/community/vectorstores/azure_aisearch";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { getLlmClient } from "./llm.js";
import { StateAnnotation } from "../langchain/state.js";
import { AIMessage } from "@langchain/core/messages";

import { VECTOR_STORE_QUERY, DOC_COUNT } from "../config/vector_store_query.js";
import { getEmbeddingClient } from "./embeddings.js";

export function getReadOnlyVectorStore(): AzureAISearchVectorStore {
  const embeddings = getEmbeddingClient();
  return new AzureAISearchVectorStore(embeddings, VECTOR_STORE_QUERY);
}
export async function getDocsFromVectorStore(
  query: string,
): Promise<Document[]> {
  const store = getReadOnlyVectorStore();

  // @ts-ignore
  //return store.similaritySearchWithScore(query, DOC_COUNT);
  return store.similaritySearch(query, DOC_COUNT);
}
const EMPTY_STATE = { messages: [] };
export async function getVectorStoreRetrieverChain2(
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
    llm: getLlmClient(),
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
