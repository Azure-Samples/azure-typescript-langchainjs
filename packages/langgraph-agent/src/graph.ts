import { StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./langchain/state.js";
import { route as endRoute } from "./langchain/check_route_end.js";
import { getAnswer } from "./azure/get_answer.js";
import { START, ANSWER_NODE, DECISION_NODE } from "./config/nodes.js";
import {
  requiresHrResources,
  routeRequiresHrResources,
} from "./azure/requires_hr_documents.js";

const builder = new StateGraph(StateAnnotation)
  .addNode(DECISION_NODE, requiresHrResources)
  .addNode(ANSWER_NODE, getAnswer)
  .addEdge(START, DECISION_NODE)
  .addConditionalEdges(DECISION_NODE, routeRequiresHrResources)
  .addConditionalEdges(ANSWER_NODE, endRoute);

export const hr_documents_answer_graph = builder.compile();
hr_documents_answer_graph.name = "Azure AI Search + Azure OpenAI";
