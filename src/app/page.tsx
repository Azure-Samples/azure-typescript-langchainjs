import { ChatInterface } from '@/components/ChatInterface';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col w-full max-w-4xl gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-3">
          <Image 
            src="/Microsoft_Azure.svg" 
            alt="Microsoft Azure Logo" 
            width={48} 
            height={48} 
            className="h-12 w-12" 
          />
          <h1 className="text-4xl font-bold">Azure OpenAI Chatbot</h1>
        </div>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Powered by Azure OpenAI and LangChain.js
        </p>
      </div>
      
      <ChatInterface />
    </div>
  );
}
