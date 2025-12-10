import React, { useState, useEffect } from 'react';
import { TestCase, TestCaseCategory } from '../types';
import { BUILTIN_TEST_CASES, TEST_CASE_CATEGORIES } from '../data/testCases';
import { STORAGE_KEYS } from '../constants';
import { X, Send, Star, Plus, Trash2, Edit2 } from 'lucide-react';
import { generateId } from '../utils/common';

interface TestCaseLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTestCase: (prompt: string) => void;
}

export const TestCaseLibrary: React.FC<TestCaseLibraryProps> = ({
  isOpen,
  onClose,
  onSendTestCase,
}) => {
  const [activeCategory, setActiveCategory] = useState<TestCaseCategory>('conversation');
  const [customTestCases, setCustomTestCases] = useState<TestCase[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTestCase, setNewTestCase] = useState({ title: '', prompt: '' });

  // Load custom test cases from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEST_CASES);
    if (saved) {
      try {
        setCustomTestCases(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load custom test cases:', error);
      }
    }
  }, []);

  // Save custom test cases to localStorage
  const saveCustomTestCases = (cases: TestCase[]) => {
    setCustomTestCases(cases);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TEST_CASES, JSON.stringify(cases));
  };

  // Get all test cases for current category
  const allTestCases =
    activeCategory === 'custom'
      ? customTestCases
      : BUILTIN_TEST_CASES.filter((tc) => tc.category === activeCategory);

  // Handle send test case
  const handleSend = (testCase: TestCase) => {
    onSendTestCase(testCase.prompt);
    onClose();
  };

  // Toggle favorite
  const handleToggleFavorite = (testCaseId: string) => {
    const updated = customTestCases.map((tc) =>
      tc.id === testCaseId ? { ...tc, isFavorite: !tc.isFavorite } : tc
    );
    saveCustomTestCases(updated);
  };

  // Add to favorites (for built-in test cases)
  const handleAddToFavorites = (testCase: TestCase) => {
    const newCustomCase: TestCase = {
      ...testCase,
      id: generateId(),
      isCustom: false,
      isFavorite: true,
      createdAt: Date.now(),
    };
    saveCustomTestCases([...customTestCases, newCustomCase]);
  };

  // Add new custom test case
  const handleAddCustom = () => {
    if (!newTestCase.title.trim() || !newTestCase.prompt.trim()) return;

    const newCase: TestCase = {
      id: generateId(),
      title: newTestCase.title,
      prompt: newTestCase.prompt,
      category: 'custom',
      isCustom: true,
      createdAt: Date.now(),
    };

    saveCustomTestCases([...customTestCases, newCase]);
    setNewTestCase({ title: '', prompt: '' });
    setIsAddingNew(false);
  };

  // Delete custom test case
  const handleDelete = (testCaseId: string) => {
    const updated = customTestCases.filter((tc) => tc.id !== testCaseId);
    saveCustomTestCases(updated);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-5xl h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden m-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">测试用例库</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              选择测试问题，一键对比多个模型的回答
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Category Navigation */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-800 p-4 overflow-y-auto">
            <div className="space-y-1">
              {TEST_CASE_CATEGORIES.map((cat) => {
                const count =
                  cat.id === 'custom'
                    ? customTestCases.length
                    : BUILTIN_TEST_CASES.filter((tc) => tc.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as TestCaseCategory)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                      activeCategory === cat.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat.icon}</span>
                      <span className="text-sm flex-1">{cat.name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test Case List */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Info */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {TEST_CASE_CATEGORIES.find((c) => c.id === activeCategory)?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {TEST_CASE_CATEGORIES.find((c) => c.id === activeCategory)?.description}
                  </p>
                </div>
                {activeCategory === 'custom' && (
                  <button
                    onClick={() => setIsAddingNew(!isAddingNew)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Plus size={16} />
                    新建测试
                  </button>
                )}
              </div>
            </div>

            {/* Test Cases */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Add New Form */}
              {isAddingNew && activeCategory === 'custom' && (
                <div className="mb-6 p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl bg-blue-50/50 dark:bg-blue-900/10">
                  <input
                    type="text"
                    placeholder="测试用例标题"
                    value={newTestCase.title}
                    onChange={(e) => setNewTestCase({ ...newTestCase, title: e.target.value })}
                    className="w-full px-3 py-2 mb-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    placeholder="测试问题内容"
                    value={newTestCase.prompt}
                    onChange={(e) => setNewTestCase({ ...newTestCase, prompt: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 mb-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCustom}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNew(false);
                        setNewTestCase({ title: '', prompt: '' });
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* Test Case Cards */}
              <div className="grid grid-cols-1 gap-3">
                {allTestCases.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <p>暂无测试用例</p>
                    {activeCategory === 'custom' && (
                      <button
                        onClick={() => setIsAddingNew(true)}
                        className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        创建第一个测试用例
                      </button>
                    )}
                  </div>
                ) : (
                  allTestCases.map((testCase) => (
                    <div
                      key={testCase.id}
                      className="group p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {testCase.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {testCase.prompt}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Send Button */}
                          <button
                            onClick={() => handleSend(testCase)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="发送测试"
                          >
                            <Send size={18} />
                          </button>

                          {/* Favorite Button (for built-in) or Delete (for custom) */}
                          {testCase.isCustom ? (
                            <button
                              onClick={() => handleDelete(testCase.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAddToFavorites(testCase)}
                              className="p-2 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="添加到收藏"
                            >
                              <Star size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
