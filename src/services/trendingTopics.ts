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
 * Convert trending topic to test case prompt
 */
export function topicToTestPrompt(topic: TrendingTopic, language: 'en' | 'zh'): string {
  if (language === 'zh') {
    return `分析以下热点话题：

标题：${topic.title}
来源：${topic.source}
${topic.url ? `链接：${topic.url}` : ''}

请从以下角度进行分析：
1. 核心内容和关键信息
2. 技术背景和相关知识
3. 发展趋势和未来影响
4. 实际应用场景和价值

请提供客观、全面的分析。`;
  } else {
    return `Analyze the following trending topic:

Title: ${topic.title}
Source: ${topic.source}
${topic.url ? `Link: ${topic.url}` : ''}

Please analyze from these perspectives:
1. Core content and key information
2. Technical background and related knowledge
3. Development trends and future impact
4. Practical applications and value

Provide an objective and comprehensive analysis.`;
  }
}
