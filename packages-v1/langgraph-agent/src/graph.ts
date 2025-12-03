import { StateGraph } from "@langchain/langgraph";
import {
  START,
  ANSWER_NODE,
  DECISION_NODE,
  route as endRoute,
  StateAnnotation,
} from "./langchain/nodes.js";
import { getAnswer } from "./langchain/node_get_answer.js";
import {
  requiresHrResources,
  routeRequiresHrResources,
} from "./langchain/node_requires_hr_documents.js";

const builder = new StateGraph(StateAnnotation)
  .addNode(DECISION_NODE, requiresHrResources)
  .addNode(ANSWER_NODE, getAnswer)
  .addEdge(START, DECISION_NODE)
  .addConditionalEdges(DECISION_NODE, routeRequiresHrResources)
  .addConditionalEdges(ANSWER_NODE, endRoute);

export const hr_documents_answer_graph = builder.compile();
hr_documents_answer_graph.name = "Azure AI Search + Azure OpenAI";
