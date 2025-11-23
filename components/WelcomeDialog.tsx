import React from 'react';
import { Sparkles, Settings, X, Rocket, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ isOpen, onClose, onOpenSettings }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{t('welcome.title', 'Welcome to NexusChat')}</h2>
              <p className="text-white/90 text-sm">{t('welcome.subtitle', 'Multi-LLM Orchestrator')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Rocket size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {t('welcome.feature1.title', 'Chat with Multiple AI Models')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('welcome.feature1.desc', 'Get responses from Claude, GPT-4, Gemini, and DeepSeek simultaneously.')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Key size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {t('welcome.feature2.title', 'Setup Required')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('welcome.feature2.desc', 'You need to configure your OpenRouter API key to get started.')}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>{t('welcome.getStarted', 'Get Started:')}</strong>
            </p>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-decimal">
              <li>{t('welcome.step1', 'Visit OpenRouter.ai and create an account')}</li>
              <li>{t('welcome.step2', 'Get your API key from the Keys page')}</li>
              <li>{t('welcome.step3', 'Paste it in Settings → Providers → OpenRouter')}</li>
              <li>{t('welcome.step4', 'Start chatting with multiple AI models!')}</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t('welcome.later', 'Maybe Later')}
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Settings size={18} />
            {t('welcome.configure', 'Configure Now')}
          </button>
        </div>
      </div>
    </div>
  );
};
