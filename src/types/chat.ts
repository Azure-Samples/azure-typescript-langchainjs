/**
 * Represents a chat message in the conversation.
 */
export interface ChatMessage {
  /**
   * The role of the message sender.
   * - 'system': System messages to set context or instructions
   * - 'user': Messages from the user
   * - 'assistant': Messages from the AI assistant
   */
  role: 'system' | 'user' | 'assistant';
  
  /**
   * The content of the message.
   */
  content: string;
}

/**
 * Represents a chat completion request to the API.
 */
export interface ChatCompletionRequest {
  /**
   * The list of messages in the conversation.
   */
  messages: ChatMessage[];
  
  /**
   * Controls randomness: 0 is deterministic, 1 is very random.
   * Default is 0.7 for a balance of creativity and coherence.
   */
  temperature?: number;
}

/**
 * Represents a chat completion response from the API.
 */
export interface ChatCompletionResponse {
  /**
   * The message content returned by the assistant.
   */
  message: string;
}
