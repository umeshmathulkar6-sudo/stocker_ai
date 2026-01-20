
import { useState, useEffect, useCallback } from 'react';
import { GeneratedImage } from '../types';

export const useGallery = () => {
  const [galleryImages, setGalleryImages] = useState<GeneratedImage[]>(() => {
    try {
      const saved = localStorage.getItem('stocker_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load gallery from storage", e);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('stocker_gallery', JSON.stringify(galleryImages));
    } catch (e) {
      console.error("Failed to save gallery to storage", e);
    }
  }, [galleryImages]);

  const addImage = useCallback((image: GeneratedImage) => {
    setGalleryImages(prev => [image, ...prev]);
  }, []);

  const updateImage = useCallback((updatedImage: GeneratedImage) => {
    setGalleryImages(prev => prev.map(img => img.id === updatedImage.id ? updatedImage : img));
  }, []);

  const deleteImage = useCallback((id: string) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      setGalleryImages(prev => prev.filter(img => img.id !== id));
    }
  }, []);

  return {
    galleryImages,
    addImage,
    updateImage,
    deleteImage
  };
};
