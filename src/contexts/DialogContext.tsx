import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmDialog, DialogVariant } from '../components/ConfirmDialog';
import { useTranslation } from 'react-i18next';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: DialogVariant;
}

interface DialogContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a DialogProvider');
  }
  return context.confirm;
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: _t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    description: '',
  });

  // We store the resolve function of the Promise here
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={options.title}
        description={options.description}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
      />
    </DialogContext.Provider>
  );
};
