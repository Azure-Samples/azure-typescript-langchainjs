'use client';

import { useState } from 'react';
import { ChatMessage } from '@/types/chat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: 'You are a helpful assistant powered by Azure OpenAI.', 
    },
    {
      role: 'assistant',
      content: 'Hello! How can I help you today?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message to the chat
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    try {
      // Send the message to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add assistant response to the chat
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.message },
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[70vh] min-h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <MessageList messages={messages.filter(m => m.role !== 'system')} />
      </div>
      
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
