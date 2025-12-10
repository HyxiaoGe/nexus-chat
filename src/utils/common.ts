export const generateId = () => Math.random().toString(36).substring(2, 15);

/**
 * Generate a smart title from message content
 * Extracts first 30 characters or until first line break/punctuation
 */
export const generateSmartTitle = (content: string): string => {
  if (!content || content.trim().length === 0) {
    return 'New Chat';
  }

  // Remove extra whitespace and line breaks
  const cleaned = content.trim().replace(/\s+/g, ' ');

  // Find natural break points (period, question mark, exclamation, newline)
  const breakPoints = [
    cleaned.indexOf('.'),
    cleaned.indexOf('?'),
    cleaned.indexOf('!'),
    cleaned.indexOf('\n'),
  ].filter((pos) => pos > 0);

  // Use the earliest break point or 40 characters, whichever is shorter
  let endPos = Math.min(...breakPoints.filter((p) => p > 0), 40);

  // If no break point found, use 40 chars
  if (!isFinite(endPos) || endPos <= 0) {
    endPos = Math.min(cleaned.length, 40);
  }

  let title = cleaned.substring(0, endPos);

  // Add ellipsis if truncated
  if (cleaned.length > endPos) {
    title += '...';
  }

  return title;
};

/**
 * Group sessions by time periods
 */
export type TimeGroup = 'today' | 'yesterday' | 'thisWeek' | 'older';

export const getTimeGroup = (timestamp: number): TimeGroup => {
  const now = new Date();
  const date = new Date(timestamp);

  // Reset time to midnight for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);

  if (date >= today) {
    return 'today';
  } else if (date >= yesterday && date < today) {
    return 'yesterday';
  } else if (date >= weekStart && date < yesterday) {
    return 'thisWeek';
  } else {
    return 'older';
  }
};

/**
 * Extract a short, human-readable model name from modelId
 * @param modelId - Full model ID (e.g., "anthropic/claude-opus-4.5")
 * @returns Short model name (e.g., "Claude Opus 4.5")
 *
 * @example
 * getShortModelName("anthropic/claude-opus-4.5") // "Claude Opus 4.5"
 * getShortModelName("openai/gpt-5.1-chat") // "GPT-5.1"
 * getShortModelName("google/gemini-3-pro-preview") // "Gemini 3 Pro"
 * getShortModelName("deepseek/deepseek-r1") // "DeepSeek R1"
 */
export const getShortModelName = (modelId: string): string => {
  if (!modelId) return '';

  // Remove vendor prefix (e.g., "anthropic/", "openai/")
  const withoutVendor = modelId.includes('/') ? modelId.split('/')[1] : modelId;

  // Remove common suffixes
  let name = withoutVendor
    .replace(/-chat$/i, '')
    .replace(/-instruct$/i, '')
    .replace(/-preview$/i, '')
    .replace(/-turbo$/i, '');

  // Handle specific patterns
  if (name.startsWith('claude-')) {
    // claude-opus-4.5 → Claude Opus 4.5
    name = name.replace(/^claude-/, '');
  } else if (name.startsWith('gpt-')) {
    // gpt-5.1-chat → GPT-5.1
    name = name.replace(/^gpt-/, 'gpt-');
  } else if (name.startsWith('gemini-')) {
    // gemini-3-pro-preview → Gemini 3 Pro
    name = name.replace(/^gemini-/, '');
  } else if (name.startsWith('deepseek-')) {
    // deepseek-r1 → DeepSeek R1
    name = name.replace(/^deepseek-/, '');
  } else if (name.includes('llama')) {
    // llama-3.1-405b-instruct → Llama 3.1 405B
    name = name.replace(/llama-/gi, '');
  }

  // Capitalize and format
  const parts = name.split('-').map(part => {
    // Keep version numbers as-is
    if (/^\d/.test(part)) return part;

    // Uppercase special terms
    if (part.toLowerCase() === 'gpt') return 'GPT';
    if (part.toLowerCase() === 'r1') return 'R1';
    if (/^\d+b$/i.test(part)) return part.toUpperCase();

    // Capitalize first letter
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  // Join with spaces
  let result = parts.join(' ');

  // Special handling for model families
  if (modelId.includes('claude')) {
    result = 'Claude ' + result;
  } else if (modelId.includes('gemini')) {
    result = 'Gemini ' + result;
  } else if (modelId.includes('deepseek')) {
    result = 'DeepSeek ' + result;
  } else if (modelId.includes('llama')) {
    result = 'Llama ' + result;
  }

  return result.trim();
};
