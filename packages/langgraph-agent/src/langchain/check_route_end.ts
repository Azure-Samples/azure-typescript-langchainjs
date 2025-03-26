import { StateAnnotation } from "./state.js";
import { END, ANSWER_NODE } from "../config/nodes.js";

export const route = (
  state: typeof StateAnnotation.State,
): typeof END | typeof ANSWER_NODE => {
  if (state.messages.length > 0) {
    return END;
  }
  return ANSWER_NODE;
};
