import { HumanMessage } from "@langchain/core/messages";
import { hr_documents_answer_graph as app } from "./graph.js";

const AIMESSAGE = "aimessage";

export async function ask_agent(question: string) {
  const initialState = { messages: [new HumanMessage(question)], iteration: 0 };
  const finalState = await app.invoke(initialState);

  return finalState;
}
export async function get_answer(question: string) {
  try {
    const answerResponse = await ask_agent(question);

    const answer = answerResponse.messages
      .filter(
        (m: any) =>
          m &&
          m.constructor?.name?.toLowerCase() === AIMESSAGE.toLocaleLowerCase(),
      )
      .map((m: any) => m.content)
      .join("\n");

    return answer;
  } catch (e) {
    console.error("Error in get_answer:", e);
    throw e;
  }
}
