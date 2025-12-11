import { Message, MessageRating } from '../types';

/**
 * Calculate quality metrics for a message
 */
export function calculateMessageMetrics(message: Message): MessageRating['metrics'] {
  if (!message.streamStartTime || !message.streamEndTime) {
    return undefined;
  }

  const responseTime = message.streamEndTime - message.streamStartTime;
  const outputLength = message.content.length;

  // Calculate tokens per second if we have token usage
  let tokensPerSecond: number | undefined;
  if (message.tokenUsage?.completionTokens && responseTime > 0) {
    tokensPerSecond = (message.tokenUsage.completionTokens / (responseTime / 1000));
  }

  // Simple completeness score based on output length and presence of error
  // In the future, this could be AI-based analysis
  let completenessScore: number | undefined;
  if (!message.error) {
    if (outputLength < 50) {
      completenessScore = 30; // Too short, likely incomplete
    } else if (outputLength < 200) {
      completenessScore = 60; // Short but might be complete for simple queries
    } else if (outputLength < 1000) {
      completenessScore = 85; // Good length
    } else {
      completenessScore = 95; // Comprehensive response
    }
  } else {
    completenessScore = 0; // Error occurred
  }

  return {
    responseTime,
    outputLength,
    tokensPerSecond,
    completenessScore,
  };
}

/**
 * Format response time for display
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Format tokens per second for display
 */
export function formatTokensPerSecond(tps: number): string {
  return `${Math.round(tps)} tok/s`;
}

/**
 * Get performance rating based on tokens per second
 * Returns: 'excellent' | 'good' | 'average' | 'slow'
 */
export function getPerformanceRating(tokensPerSecond: number): string {
  if (tokensPerSecond >= 100) return 'excellent';
  if (tokensPerSecond >= 50) return 'good';
  if (tokensPerSecond >= 20) return 'average';
  return 'slow';
}

/**
 * Get color for performance rating
 */
export function getPerformanceColor(rating: string): string {
  switch (rating) {
    case 'excellent':
      return 'text-green-600 dark:text-green-400';
    case 'good':
      return 'text-blue-600 dark:text-blue-400';
    case 'average':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'slow':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Get completeness color based on score
 */
export function getCompletenessColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Compare messages by different criteria
 */
export function comparemessages(messages: Message[], criteria: 'speed' | 'cost' | 'length' | 'completeness'): Message[] {
  const validMessages = messages.filter(m => m.role === 'model' && !m.error);

  switch (criteria) {
    case 'speed':
      return [...validMessages].sort((a, b) => {
        const timeA = a.rating?.metrics?.responseTime ?? Infinity;
        const timeB = b.rating?.metrics?.responseTime ?? Infinity;
        return timeA - timeB; // Faster is better
      });

    case 'cost':
      return [...validMessages].sort((a, b) => {
        const costA = a.tokenUsage?.estimatedCost ?? Infinity;
        const costB = b.tokenUsage?.estimatedCost ?? Infinity;
        return costA - costB; // Cheaper is better
      });

    case 'length':
      return [...validMessages].sort((a, b) => {
        const lengthA = a.rating?.metrics?.outputLength ?? 0;
        const lengthB = b.rating?.metrics?.outputLength ?? 0;
        return lengthB - lengthA; // Longer is better (more detailed)
      });

    case 'completeness':
      return [...validMessages].sort((a, b) => {
        const scoreA = a.rating?.metrics?.completenessScore ?? 0;
        const scoreB = b.rating?.metrics?.completenessScore ?? 0;
        return scoreB - scoreA; // Higher score is better
      });

    default:
      return validMessages;
  }
}

/**
 * Get ranking badge (1st, 2nd, 3rd) for a message
 */
export function getRankingBadge(rank: number): { emoji: string; color: string } | null {
  switch (rank) {
    case 0:
      return { emoji: '🥇', color: 'text-yellow-500' };
    case 1:
      return { emoji: '🥈', color: 'text-gray-400' };
    case 2:
      return { emoji: '🥉', color: 'text-orange-400' };
    default:
      return null;
  }
}
