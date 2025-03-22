import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Azure TypeScript LangChain.js Chatbot',
  description: 'A chatbot using Azure OpenAI services with LangChain.js integration',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
          {children}
        </main>
      </body>
    </html>
  );
}
