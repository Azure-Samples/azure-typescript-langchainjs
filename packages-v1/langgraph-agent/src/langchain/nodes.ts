import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

export const ANSWER_NODE = "vector_store_retrieval";
export const DECISION_NODE = "requires_hr_documents";
export const START = "__start__";
export const END = "__end__";

export const route = (
  state: typeof StateAnnotation.State,
): typeof END | typeof ANSWER_NODE => {
  if (state.messages.length > 0) {
    return END;
  }
  return ANSWER_NODE;
};

export const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});
