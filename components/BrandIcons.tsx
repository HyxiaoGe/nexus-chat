import React from 'react';
import { Bot } from 'lucide-react';
import {
  OpenAI,
  Google,
  DeepSeek,
  Claude,
  Meta,
  Mistral,
  Perplexity,
  Grok,
  Qwen,
  Minimax,
  Microsoft,
  LobeHub
} from '@lobehub/icons';

// Mapping string keys (from constants.ts) to LobeHub components
const BRAND_MAP: Record<string, any> = {
  openai: OpenAI,
  google: Google,
  gemini: Google, 
  anthropic: Claude, 
  claude: Claude,
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
  const IconComponent = BRAND_MAP[key] || LobeHub;

  if (key === 'other' || !BRAND_MAP[key]) {
       return <Bot size={size} className={className} />;
  }

  // Using .Avatar as requested for the full colored icon
  return (
    <div className={className} style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconComponent.Avatar size={size} />
    </div>
  );
};