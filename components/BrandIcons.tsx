import React from 'react';
import { Bot } from 'lucide-react';
import {
  OpenAI,
  Google,
  DeepSeek,
  Anthropic,
  Grok,
  Qwen,
  Minimax,
  LobeHub,
  Gemini
} from '@lobehub/icons';

// Import Moonshot and Zhipu from their specific paths
import Moonshot from '@lobehub/icons/es/Moonshot';
import Zhipu from '@lobehub/icons/es/Zhipu';

const BRAND_MAP: Record<string, any> = {
  openai: OpenAI,
  google: Google,
  gemini: Gemini,
  anthropic: Anthropic,
  claude: Anthropic,
  deepseek: DeepSeek,
  'x-ai': Grok,
  grok: Grok,
  qwen: Qwen,
  minimax: Minimax,
  moonshot: Moonshot,
  zhipuai: Zhipu,
  zhipu: Zhipu,
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
