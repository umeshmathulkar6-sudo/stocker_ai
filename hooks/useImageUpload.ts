
import { useState, useRef, ChangeEvent } from 'react';
import { processImageFile } from '../utils';
import { useToast } from '../contexts/ToastContext';

interface UseImageUploadResult {
  image: string | null;
  setImage: (img: string | null) => void;
  isLoading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  triggerUpload: () => void;
  reset: () => void;
}

export const useImageUpload = (onUploadSuccess?: () => void): UseImageUploadResult => {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsLoading(true);
      setError(null);
      try {
        const processed = await processImageFile(file);
        setImage(processed);
        showToast("Image loaded successfully", "success");
        if (onUploadSuccess) onUploadSuccess();
      } catch (err: any) {
        const msg = err.message || "Failed to load image";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setIsLoading(false);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setImage(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    image,
    setImage,
    isLoading,
    error,
    fileInputRef,
    handleFileChange,
    triggerUpload,
    reset
  };
};
