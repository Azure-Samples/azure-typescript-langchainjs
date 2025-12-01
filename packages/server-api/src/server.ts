// Import the framework and instantiate it
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { get_answer } from 'langgraph-agent';

const fastify: FastifyInstance = Fastify({
  logger: true
})

// Define request interface
interface AnswerRequest {
  Body: {
    question: string;
  }
}

fastify.get('/', async function handler (
  __: FastifyRequest, 
  _: FastifyReply
) {

  return { "status": "ok", "message": "Hello from LangGraph API!" }
})

fastify.post<AnswerRequest>('/answer', async function handler (
  request: FastifyRequest<AnswerRequest>, 
  _: FastifyReply
) {
  const { question } = request.body;
  console.log(`Received question: ${question}`);
  
  const answer = await get_answer(question);
  console.log(`API Answer: ${answer}`);

  return { question, answer }
})

// Run the server!
const start = async (): Promise<void> => {
    try {
    
      console.log('Starting server...')
      console.log(process.env);

      await fastify.listen({ port: 3000, host: '0.0.0.0' })  // Added host for container compatibility
      const address = fastify.server.address();
      fastify.log.info(`Server listening on ${typeof address === 'string' ? address : `${address?.address}:${address?.port}`}`);
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
  
  start()