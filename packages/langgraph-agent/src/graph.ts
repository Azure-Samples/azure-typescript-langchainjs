import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./langchain/state.js";
import { route as endRoute } from "./langchain/check_route_end.js";
import { getVectorStoreRetrieverChain2 } from "./azure/vector_store.js";
import {
  START,
  VECTOR_STORE_NODE,
  HR_DOCS_REQUIRED_NODE,
} from "./config/nodes.js";
import {
  requiresHrResources,
  routeRequiresHrResources,
} from "./azure/requires_hr_documents.js";

const builder = new StateGraph(StateAnnotation)
  .addNode(HR_DOCS_REQUIRED_NODE, requiresHrResources)
  .addNode(VECTOR_STORE_NODE, getVectorStoreRetrieverChain2)
  .addEdge(START, HR_DOCS_REQUIRED_NODE)
  .addConditionalEdges(HR_DOCS_REQUIRED_NODE, routeRequiresHrResources)
  .addConditionalEdges(VECTOR_STORE_NODE, endRoute);

export const vector_store_graph = builder.compile();
vector_store_graph.name = "Azure AI Search + Azure OpenAI";
