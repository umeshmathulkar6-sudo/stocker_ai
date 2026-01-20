
import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useCopyToClipboard = () => {
  const { showToast } = useToast();

  const copy = useCallback((text: string, label: string = 'Text') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard`, "success");
  }, [showToast]);

  return copy;
};
