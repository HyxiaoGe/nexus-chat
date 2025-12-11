import React, { useState } from 'react';
import { X, Check, BookTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AgentConfig } from '../types';
import { getSystemPrompt, getTemplateMetadata } from '../data/systemPrompts';

interface SystemPromptManagerProps {
  isOpen: boolean;
  onClose: () => void;
  agents: AgentConfig[];
  onApplyToAgent: (agentId: string, prompt: string) => void;
}

type TemplateCategory = 'general' | 'conversation' | 'coding' | 'writing' | 'reasoning' | 'multilingual' | 'knowledge' | 'creative';

const CATEGORY_ICONS: Record<TemplateCategory, string> = {
  general: '🤖',
  conversation: '💬',
  coding: '💻',
  writing: '✍️',
  reasoning: '🧠',
  multilingual: '🌐',
  knowledge: '📚',
  creative: '🎨',
};

export const SystemPromptManager: React.FC<SystemPromptManagerProps> = ({
  isOpen,
  onClose,
  agents,
  onApplyToAgent,
}) => {
  const { i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('general');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');

  const templates = getTemplateMetadata();
  const currentLanguage = i18n.language as 'en' | 'zh';

  // Find template for selected category
  const selectedTemplate = templates.find((t) => t.id === selectedCategory);

  // Get full prompt text
  const promptText = selectedTemplate
    ? getSystemPrompt(selectedTemplate.id, currentLanguage)
    : '';

  // Get enabled agents
  const enabledAgents = agents.filter((a) => a.enabled);

  const handleApply = () => {
    if (!selectedAgentId) {
      alert(currentLanguage === 'zh' ? '请选择一个模型' : 'Please select an agent');
      return;
    }
    onApplyToAgent(selectedAgentId, promptText);
    onClose();
  };

  const handleApplyToAll = () => {
    enabledAgents.forEach((agent) => {
      onApplyToAgent(agent.id, promptText);
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BookTemplate className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentLanguage === 'zh' ? '系统提示词模板' : 'System Prompt Templates'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Categories */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-3 space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedCategory(template.id as TemplateCategory)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    selectedCategory === template.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xl">{CATEGORY_ICONS[template.id as TemplateCategory]}</span>
                  <span className="text-sm font-medium truncate">
                    {currentLanguage === 'zh' ? template.name.zh : template.name.en}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Content - Template Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Template Info */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <span className="text-3xl">
                  {CATEGORY_ICONS[selectedCategory]}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedTemplate
                      ? currentLanguage === 'zh'
                        ? selectedTemplate.name.zh
                        : selectedTemplate.name.en
                      : ''}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedTemplate
                      ? currentLanguage === 'zh'
                        ? selectedTemplate.description.zh
                        : selectedTemplate.description.en
                      : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt Preview */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                  {promptText}
                </pre>
              </div>
            </div>

            {/* Footer - Apply Actions */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {/* Agent Selector */}
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">
                    {currentLanguage === 'zh' ? '选择一个模型...' : 'Select an agent...'}
                  </option>
                  {enabledAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>

                {/* Apply Button */}
                <button
                  onClick={handleApply}
                  disabled={!selectedAgentId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  <Check size={16} />
                  {currentLanguage === 'zh' ? '应用' : 'Apply'}
                </button>

                {/* Apply to All Button */}
                <button
                  onClick={handleApplyToAll}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                >
                  <Check size={16} />
                  {currentLanguage === 'zh' ? '应用到全部' : 'Apply to All'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
