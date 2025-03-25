import { HumanMessage } from "@langchain/core/messages";
import { USER_QUERIES } from "./config/user_queries.js";
import { vector_store_graph as app } from "./graph.js";

const AIMESSAGE = "aimessage";

export async function ask(question: string) {
  const initialState = { messages: [new HumanMessage(question)], iteration: 0 };
  const finalState = await app.invoke(initialState);

  return finalState;
}

ask(USER_QUERIES[2])
  .then((response: any) => {
    console.log(
      response.messages
        .filter(
          (m: any) =>
            m &&
            m.constructor?.name?.toLowerCase() ===
              AIMESSAGE.toLocaleLowerCase(),
        )
        .map((m: any) => m.content)
        .join("\n"),
    );
  })
  .catch(console.error);
