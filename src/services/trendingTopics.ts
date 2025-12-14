/**
 * Service for fetching trending topics and generating dynamic test cases
 */

export interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  timestamp: number;
}

const CACHE_KEY = 'nexus_trending_topics_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

/**
 * Get cached trending topics
 */
function getCachedTopics(): TrendingTopic[] | null {
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;

  try {
    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;
    if (age > CACHE_DURATION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data.topics;
  } catch {
    return null;
  }
}

/**
 * Cache trending topics
 */
function cacheTopics(topics: TrendingTopic[]) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        topics,
        timestamp: Date.now(),
      })
    );
  } catch (e) {
    console.warn('Failed to cache trending topics:', e);
  }
}

/**
 * Fetch GitHub Trending repositories
 */
async function fetchGitHubTrending(): Promise<TrendingTopic[]> {
  try {
    const response = await fetch('https://api.github.com/search/repositories?q=created:>2025-12-10&sort=stars&order=desc&per_page=5');
    if (!response.ok) throw new Error('GitHub API request failed');

    const data = await response.json();
    return data.items.slice(0, 5).map((repo: any) => ({
      id: `gh-${repo.id}`,
      title: repo.full_name,
      description: repo.description || 'No description',
      source: 'GitHub Trending',
      url: repo.html_url,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to fetch GitHub trending:', error);
    return [];
  }
}

/**
 * Fetch Hacker News top stories
 */
async function fetchHackerNews(): Promise<TrendingTopic[]> {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!response.ok) throw new Error('HN API request failed');

    const storyIds = await response.json();
    const topStories = storyIds.slice(0, 5);

    const stories = await Promise.all(
      topStories.map(async (id: number) => {
        const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        return storyResponse.json();
      })
    );

    return stories.map((story: any) => ({
      id: `hn-${story.id}`,
      title: story.title,
      description: story.text || 'No description',
      source: 'Hacker News',
      url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to fetch Hacker News:', error);
    return [];
  }
}

/**
 * Generate fallback topics when API fails
 */
function getFallbackTopics(): TrendingTopic[] {
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return [
    {
      id: 'fallback-1',
      title: `${currentDate} - AI技术发展现状`,
      description: '分析当前人工智能技术的发展趋势和应用场景',
      source: 'Default',
      timestamp: Date.now(),
    },
    {
      id: 'fallback-2',
      title: '大语言模型的最新进展',
      description: '探讨GPT-4、Claude、Gemini等大模型的技术特点',
      source: 'Default',
      timestamp: Date.now(),
    },
    {
      id: 'fallback-3',
      title: '开源软件社区热点项目',
      description: '分析GitHub上最受欢迎的开源项目及其技术栈',
      source: 'Default',
      timestamp: Date.now(),
    },
  ];
}

/**
 * Fetch all trending topics from multiple sources
 */
export async function fetchTrendingTopics(): Promise<TrendingTopic[]> {
  // Check cache first
  const cached = getCachedTopics();
  if (cached && cached.length > 0) {
    return cached;
  }

  // Fetch from multiple sources in parallel
  const [githubTopics, hnTopics] = await Promise.all([
    fetchGitHubTrending(),
    fetchHackerNews(),
  ]);

  // Combine and deduplicate
  const allTopics = [...githubTopics, ...hnTopics];

  // If no topics fetched, use fallback
  const topics = allTopics.length > 0 ? allTopics : getFallbackTopics();

  // Cache the results
  cacheTopics(topics);

  return topics;
}

/**
 * Analysis perspectives for trending topics
 */
export type AnalysisPerspective = 'summary' | 'background' | 'impact' | 'opinion' | 'solution';

export interface TopicPrompt {
  perspective: AnalysisPerspective;
  title: string;
  prompt: string;
  icon: string;
}

/**
 * Generate multiple analysis prompts for a trending topic
 */
export function generateTopicPrompts(topic: TrendingTopic, language: 'en' | 'zh'): TopicPrompt[] {
  const baseInfo = language === 'zh'
    ? `【话题】${topic.title}\n【来源】${topic.source}${topic.url ? `\n【链接】${topic.url}` : ''}`
    : `[Topic] ${topic.title}\n[Source] ${topic.source}${topic.url ? `\n[Link] ${topic.url}` : ''}`;

  if (language === 'zh') {
    return [
      {
        perspective: 'summary',
        title: '📋 事实总结',
        icon: '📋',
        prompt: `${baseInfo}\n\n请总结这个话题的核心内容和关键信息，包括：\n• 主要事件或内容是什么？\n• 涉及哪些关键人物、组织或技术？\n• 当前的进展状态如何？\n\n要求：客观陈述事实，避免主观评价。`,
      },
      {
        perspective: 'background',
        title: '🔍 背景分析',
        icon: '🔍',
        prompt: `${baseInfo}\n\n请分析这个话题的背景和原因：\n• 为什么会出现这个话题/事件？\n• 有哪些历史背景或前因后果？\n• 相关的技术原理或理论基础是什么？\n\n要求：深入挖掘背后的原因和逻辑。`,
      },
      {
        perspective: 'impact',
        title: '💡 影响评估',
        icon: '💡',
        prompt: `${baseInfo}\n\n请评估这个话题可能产生的影响：\n• 对行业、技术、社会会产生什么影响？\n• 短期和长期的影响分别是什么？\n• 哪些群体会受到影响？\n\n要求：从多个维度分析影响范围和程度。`,
      },
      {
        perspective: 'opinion',
        title: '💭 观点讨论',
        icon: '💭',
        prompt: `${baseInfo}\n\n请分享你对这个话题的看法：\n• 你如何评价这个事件/内容？\n• 有哪些值得关注的亮点或问题？\n• 不同立场的人可能会有什么不同看法？\n\n要求：提供多角度的观点，保持客观理性。`,
      },
      {
        perspective: 'solution',
        title: '🎯 解决方案',
        icon: '🎯',
        prompt: `${baseInfo}\n\n如果这个话题涉及问题或挑战，请提出解决思路：\n• 可以采取哪些应对措施？\n• 有什么最佳实践或参考案例？\n• 未来应该如何发展或改进？\n\n要求：提供可行的建议和行动方向。`,
      },
    ];
  } else {
    return [
      {
        perspective: 'summary',
        title: '📋 Summary',
        icon: '📋',
        prompt: `${baseInfo}\n\nPlease summarize the core content and key information:\n• What is the main event or content?\n• What key people, organizations, or technologies are involved?\n• What is the current progress?\n\nRequirement: State facts objectively, avoid subjective evaluations.`,
      },
      {
        perspective: 'background',
        title: '🔍 Background',
        icon: '🔍',
        prompt: `${baseInfo}\n\nPlease analyze the background and reasons:\n• Why did this topic/event emerge?\n• What historical context or cause-and-effect relationships exist?\n• What are the relevant technical principles or theoretical foundations?\n\nRequirement: Dig deep into underlying reasons and logic.`,
      },
      {
        perspective: 'impact',
        title: '💡 Impact',
        icon: '💡',
        prompt: `${baseInfo}\n\nPlease assess the potential impact:\n• What impact will it have on industry, technology, or society?\n• What are the short-term and long-term impacts?\n• Which groups will be affected?\n\nRequirement: Analyze impact scope and magnitude from multiple dimensions.`,
      },
      {
        perspective: 'opinion',
        title: '💭 Opinion',
        icon: '💭',
        prompt: `${baseInfo}\n\nPlease share your views on this topic:\n• How do you evaluate this event/content?\n• What highlights or issues deserve attention?\n• What different perspectives might people from different positions have?\n\nRequirement: Provide multi-perspective views, maintain objectivity.`,
      },
      {
        perspective: 'solution',
        title: '🎯 Solution',
        icon: '🎯',
        prompt: `${baseInfo}\n\nIf this topic involves problems or challenges, please propose solutions:\n• What countermeasures can be taken?\n• What best practices or reference cases exist?\n• How should it develop or improve in the future?\n\nRequirement: Provide feasible suggestions and action directions.`,
      },
    ];
  }
}

/**
 * Convert trending topic to test case prompt (backward compatibility)
 */
export function topicToTestPrompt(topic: TrendingTopic, language: 'en' | 'zh'): string {
  const prompts = generateTopicPrompts(topic, language);
  return prompts[0].prompt; // Return summary prompt by default
}
