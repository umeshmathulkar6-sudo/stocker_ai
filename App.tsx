
import React, { useState, Suspense, lazy } from 'react';
import Layout from './components/Layout';
import { ViewState, Trend } from './types';
import { ToastProvider } from './contexts/ToastContext';
import { Loader } from './components/ui/Loader';
import { useGallery } from './hooks/useGallery';

// Lazy load components to fast-track FCP (First Contentful Paint)
const TrendDashboard = lazy(() => import('./components/TrendDashboard'));
const ImageGenerator = lazy(() => import('./components/ImageGenerator').then(module => ({ default: module.ImageGenerator })));
const MetadataOptimizer = lazy(() => import('./components/MetadataOptimizer'));
const Gallery = lazy(() => import('./components/Gallery'));
const Upscaler = lazy(() => import('./components/Upscaler'));

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-[50vh] w-full gap-4">
    <div className="relative">
      <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
      <Loader size="lg" color="border-indigo-400" className="relative z-10" />
    </div>
    <p className="text-slate-400 text-sm font-medium animate-pulse">Loading module...</p>
  </div>
);

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('trends');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [trendsCache, setTrendsCache] = useState<Trend[]>([]);
  
  // Centralized Gallery Logic
  const { galleryImages, addImage, updateImage, deleteImage } = useGallery();

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleUsePrompt = (prompt: string) => {
    setSelectedPrompt(prompt);
    setCurrentView('create');
  };

  return (
    <ToastProvider>
      <Layout currentView={currentView} onNavigate={handleNavigate}>
        <Suspense fallback={<LoadingFallback />}>
          {currentView === 'trends' && (
            <TrendDashboard 
              onUsePrompt={handleUsePrompt} 
              cachedTrends={trendsCache} 
              setCachedTrends={setTrendsCache} 
            />
          )}
          
          {currentView === 'create' && (
            <ImageGenerator 
              initialPrompt={selectedPrompt} 
              onImageGenerated={addImage}
            />
          )}
          
          {currentView === 'gallery' && (
            <Gallery 
              images={galleryImages} 
              onDelete={deleteImage}
              onUpdate={updateImage}
            />
          )}

          {currentView === 'metadata' && (
            <MetadataOptimizer 
              onSaveToGallery={addImage}
            />
          )}

          {currentView === 'upscale' && (
            <Upscaler 
              onSaveToGallery={addImage}
            />
          )}
        </Suspense>
      </Layout>
    </ToastProvider>
  );
}

export default App;
