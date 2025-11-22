import React from 'react';
import { Bot } from 'lucide-react';
import {
  OpenAI,
  Google,
  DeepSeek,
  Anthropic,
  Meta,
  Mistral,
  Perplexity,
  Grok,
  Qwen,
  Minimax,
  Microsoft,
  LobeHub,
  Gemini
} from '@lobehub/icons';

const BRAND_MAP: Record<string, any> = {
  openai: OpenAI,
  google: Google,
  gemini: Gemini,
  anthropic: Anthropic,
  claude: Anthropic,
  deepseek: DeepSeek,
  meta: Meta,
  llama: Meta,
  mistral: Mistral,
  perplexity: Perplexity,
  xai: Grok,
  grok: Grok,
  qwen: Qwen,
  minimax: Minimax,
  microsoft: Microsoft,
  other: LobeHub
};

interface BrandIconProps {
  brand: string;
  size?: number;
  className?: string;
}

export const BrandIcon: React.FC<BrandIconProps> = ({ brand, size = 24, className = '' }) => {
  const key = brand?.toLowerCase().trim();
  const IconComponent = BRAND_MAP[key] || BRAND_MAP['other'];

  if (!IconComponent) {
       return <Bot size={size} className={className} />;
  }

  // Use .Avatar for the official colored version as requested
  return (
    <div className={className} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconComponent.Avatar size={size} />
    </div>
  );
};
