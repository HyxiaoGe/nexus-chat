
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
    cleaned.indexOf('\n')
  ].filter(pos => pos > 0);

  // Use the earliest break point or 40 characters, whichever is shorter
  let endPos = Math.min(...breakPoints.filter(p => p > 0), 40);

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
