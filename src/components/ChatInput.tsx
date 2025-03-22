'use client';

import { useState, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void; 
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type your message..."
        className="flex-1 resize-none border rounded-md p-2 min-h-[40px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-black dark:text-white bg-white dark:bg-gray-800"
        rows={1}
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
