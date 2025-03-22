// Type declaration for react-syntax-highlighter
declare module 'react-syntax-highlighter' {
  import React from 'react';
  
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: any;
    children?: React.ReactNode;
    className?: string;
    PreTag?: string | React.ComponentType<any>;
    [key: string]: any;
  }
  
  export const Prism: React.ComponentType<SyntaxHighlighterProps>;
  export const Light: React.ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/cjs/styles/prism' {
  const vscDarkPlus: any;
  const dracula: any;
  const tomorrow: any;
  const vs: any;
  const xonokai: any;
  const atomDark: any;
  const base16AteliersulphurpoolLight: any;
  const cb: any;
  const darcula: any;
  const duotoneDark: any;
  const duotoneLight: any;
  const ghcolors: any;
  const hopscotch: any;
  const okaidia: any;
  const prism: any;
  const solarizedlight: any;
  const twilight: any;
  
  export { 
    vscDarkPlus, dracula, tomorrow, vs, xonokai, atomDark, 
    base16AteliersulphurpoolLight, cb, darcula, duotoneDark, 
    duotoneLight, ghcolors, hopscotch, okaidia, prism, 
    solarizedlight, twilight 
  };
} 