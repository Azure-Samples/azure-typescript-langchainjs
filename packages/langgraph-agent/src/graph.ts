import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./langchain/state.js";
import { route as endRoute } from "./langchain/check_route_end.js";
import { getVectorStoreRetrieverChain2 } from "./azure/vector_store.js";

const builder = new StateGraph(StateAnnotation)
  .addNode("vectorStoreRetrieverChain", getVectorStoreRetrieverChain2)
  .addEdge("__start__", "vectorStoreRetrieverChain")
  .addConditionalEdges("vectorStoreRetrieverChain", endRoute);

export const vector_store_graph = builder.compile();
vector_store_graph.name = "Azure AI Search + Azure OpenAI";
