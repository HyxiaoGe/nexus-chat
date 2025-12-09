import React from 'react';
import { AlertTriangle, Info, X, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type DialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'info',
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const getStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/20',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          icon: <Trash2 size={24} />,
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-100 dark:bg-orange-900/20',
          iconColor: 'text-orange-600 dark:text-orange-400',
          buttonBg: 'bg-orange-500 hover:bg-orange-600',
          icon: <AlertTriangle size={24} />,
        };
      default:
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/20',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          icon: <Info size={24} />,
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#151b26] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 scale-100">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-3 rounded-full ${styles.iconBg} ${styles.iconColor}`}>
              {styles.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-6">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-colors"
          >
            {cancelLabel || t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center gap-2 ${styles.buttonBg}`}
          >
            {variant === 'danger' ? <Trash2 size={16} /> : <Check size={16} />}
            {confirmLabel || t('common.confirm')}
          </button>
        </div>

        {/* Close X */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
