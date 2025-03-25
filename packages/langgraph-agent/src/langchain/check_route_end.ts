import { StateAnnotation } from "./state.js";
import { END, VECTOR_STORE_NODE } from "../config/nodes.js";

export const route = (
  state: typeof StateAnnotation.State,
): typeof END | typeof VECTOR_STORE_NODE => {
  if (state.messages.length > 0) {
    return END;
  }
  return VECTOR_STORE_NODE;
};
