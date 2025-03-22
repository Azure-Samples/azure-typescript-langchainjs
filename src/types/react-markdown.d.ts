// Type declaration for react-markdown components
declare module 'react-markdown' {
  import React from 'react';
  
  export interface CodeProps {
    node?: any;
    inline?: boolean;
    className?: string;
    children: React.ReactNode;
    [key: string]: any;
  }
  
  interface ReactMarkdownProps {
    children: string;
    className?: string;
    components?: {
      [key: string]: React.ComponentType<any>;
    };
    rehypePlugins?: any[];
    remarkPlugins?: any[];
  }

  const ReactMarkdown: React.FunctionComponent<ReactMarkdownProps>;
  export default ReactMarkdown;
} 