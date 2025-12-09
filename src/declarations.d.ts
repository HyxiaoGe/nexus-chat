declare const __APP_VERSION__: string;

declare module '@lobehub/icons' {
  import React from 'react';

  export interface IconProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface IconComponent extends React.FC<IconProps> {
    Avatar: React.FC<IconProps>;
    Color: React.FC<IconProps>;
    Text: React.FC<IconProps>;
    Combine: React.FC<IconProps>;
  }

  export const OpenAI: IconComponent;
  export const Google: IconComponent;
  export const DeepSeek: IconComponent;
  export const Anthropic: IconComponent;
  export const Meta: IconComponent;
  export const Mistral: IconComponent;
  export const Perplexity: IconComponent;
  export const Grok: IconComponent;
  export const Qwen: IconComponent;
  export const Minimax: IconComponent;
  export const Microsoft: IconComponent;
  export const LobeHub: IconComponent;
  export const Gemini: IconComponent;
}
