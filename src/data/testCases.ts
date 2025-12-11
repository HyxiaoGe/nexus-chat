import { TestCase } from '../types';

/**
 * Built-in test cases for model comparison testing
 * Organized by category to evaluate different model capabilities
 */
export const BUILTIN_TEST_CASES: TestCase[] = [
  // 对话能力 - Conversation
  {
    id: 'conv-1',
    title: '日常闲聊',
    prompt: '你好！今天天气真不错，有什么推荐的户外活动吗？',
    category: 'conversation',
  },
  {
    id: 'conv-2',
    title: '情感支持',
    prompt: '我最近工作压力很大，感觉有点焦虑，你能给我一些建议吗？',
    category: 'conversation',
  },
  {
    id: 'conv-3',
    title: '多轮对话理解',
    prompt: '我想买一台笔记本电脑，预算在8000左右，主要用来写代码和偶尔玩游戏。',
    category: 'conversation',
  },

  // 编程能力 - Coding
  {
    id: 'code-1',
    title: 'React组件实现',
    prompt: '用 React + TypeScript 实现一个带搜索和分页功能的表格组件，支持自定义列配置。',
    category: 'coding',
  },
  {
    id: 'code-2',
    title: '算法问题',
    prompt: '实现一个函数，找出数组中和为目标值的两个数的索引。要求时间复杂度O(n)。',
    category: 'coding',
  },
  {
    id: 'code-3',
    title: '代码调试',
    prompt: '这段代码有bug：\n```js\nfunction findMax(arr) {\n  let max = 0;\n  for (let i = 0; i <= arr.length; i++) {\n    if (arr[i] > max) max = arr[i];\n  }\n  return max;\n}\n```\n请找出问题并修复。',
    category: 'coding',
  },
  {
    id: 'code-4',
    title: 'SQL查询',
    prompt: '写一个SQL查询，找出每个部门工资最高的员工。表结构：employees(id, name, salary, department_id)',
    category: 'coding',
  },

  // 写作能力 - Writing
  {
    id: 'write-1',
    title: '产品文案',
    prompt: '为一款智能手表写一段吸引人的产品介绍，突出健康监测和运动追踪功能。字数200字左右。',
    category: 'writing',
  },
  {
    id: 'write-2',
    title: '邮件撰写',
    prompt: '帮我写一封专业的英文邮件，向客户解释项目延期的原因，并提出补救方案。',
    category: 'writing',
  },
  {
    id: 'write-3',
    title: '故事续写',
    prompt: '续写这个故事开头：\n深夜，李明收到一封匿名邮件，邮件里只有一张老照片和一串神秘数字...',
    category: 'writing',
  },
  {
    id: 'write-4',
    title: '技术博客',
    prompt: '写一篇关于"前端性能优化"的技术博客大纲，包括5-6个主要章节。',
    category: 'writing',
  },

  // 推理能力 - Reasoning
  {
    id: 'reason-1',
    title: '逻辑推理',
    prompt: '三个人ABC，A说"B在撒谎"，B说"C在撒谎"，C说"A和B都在撒谎"。谁说的是真话？',
    category: 'reasoning',
  },
  {
    id: 'reason-2',
    title: '数学应用题',
    prompt: '一个水池有甲乙两个进水管，甲管单独注满需要3小时，乙管单独注满需要5小时。如果两管同时开，需要多长时间注满？',
    category: 'reasoning',
  },
  {
    id: 'reason-3',
    title: '因果分析',
    prompt: '分析以下现象的可能原因：最近一个月，公司网站的访问量下降了30%，但广告投放预算没有变化。',
    category: 'reasoning',
  },
  {
    id: 'reason-4',
    title: '策略规划',
    prompt: '我有10万元预算，想在3个月内将个人品牌从0做到1万粉丝，给我一个可行的策略方案。',
    category: 'reasoning',
  },

  // 多语言能力 - Multilingual
  {
    id: 'multi-1',
    title: '中译英',
    prompt: '将以下段落翻译成自然流畅的英文：\n随着人工智能技术的快速发展，大语言模型正在改变我们与计算机交互的方式。',
    category: 'multilingual',
  },
  {
    id: 'multi-2',
    title: '英译中',
    prompt: 'Translate to Chinese: "The advancement of AI has opened up unprecedented opportunities for innovation across various industries."',
    category: 'multilingual',
  },
  {
    id: 'multi-3',
    title: '日语对话',
    prompt: '用日语介绍一下自己，包括兴趣爱好和职业。',
    category: 'multilingual',
  },
  {
    id: 'multi-4',
    title: '多语言混合理解',
    prompt: 'I want to learn 日本語. Can you give me some 建议？',
    category: 'multilingual',
  },

  // 知识问答 - Knowledge
  {
    id: 'know-1',
    title: '历史知识',
    prompt: '简要介绍第一次工业革命的起因、过程和影响。',
    category: 'knowledge',
  },
  {
    id: 'know-2',
    title: '科学原理',
    prompt: '解释为什么天空是蓝色的？用通俗易懂的语言。',
    category: 'knowledge',
  },
  {
    id: 'know-3',
    title: '时事理解',
    prompt: '什么是碳中和？为什么各国都在推动碳中和目标？',
    category: 'knowledge',
  },
  {
    id: 'know-4',
    title: '技术概念',
    prompt: '用简单的语言解释什么是区块链，它解决了什么问题？',
    category: 'knowledge',
  },

  // 创意生成 - Creative
  {
    id: 'creative-1',
    title: '品牌命名',
    prompt: '我要开一家主打健康轻食的餐厅，帮我想5个有创意的店名，并说明寓意。',
    category: 'creative',
  },
  {
    id: 'creative-2',
    title: '广告语创作',
    prompt: '为一款环保材质的背包设计3条广告语，突出环保理念和实用性。',
    category: 'creative',
  },
  {
    id: 'creative-3',
    title: '活动策划',
    prompt: '策划一场面向年轻人的线上读书会活动，写出活动主题、形式和亮点。',
    category: 'creative',
  },
  {
    id: 'creative-4',
    title: '角色设计',
    prompt: '为一款科幻游戏设计一个AI助手角色，包括外观、性格和能力设定。',
    category: 'creative',
  },
];

// Category metadata for UI display
export const TEST_CASE_CATEGORIES = [
  { id: 'conversation', name: '对话能力', icon: '💬', description: '测试日常对话和交流能力' },
  { id: 'coding', name: '编程能力', icon: '💻', description: '测试代码生成和调试能力' },
  { id: 'writing', name: '写作能力', icon: '✍️', description: '测试文案创作和内容撰写' },
  { id: 'reasoning', name: '推理能力', icon: '🧠', description: '测试逻辑分析和问题解决' },
  { id: 'multilingual', name: '多语言', icon: '🌍', description: '测试翻译和多语言理解' },
  { id: 'knowledge', name: '知识问答', icon: '📚', description: '测试知识储备和解释能力' },
  { id: 'creative', name: '创意生成', icon: '🎨', description: '测试创意思维和策划能力' },
  { id: 'trending', name: '热点话题', icon: '🔥', description: '实时热点和前沿话题分析' },
  { id: 'custom', name: '我的收藏', icon: '⭐', description: '保存的自定义测试用例' },
] as const;
