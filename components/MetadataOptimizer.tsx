
import React, { useState } from 'react';
import { generateMetadata } from '../services/geminiService';
import { StockMetadata, GeneratedImage, AssetCategory } from '../types';
import { useToast } from '../contexts/ToastContext';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { PageHeader } from './ui/PageHeader';
import { Badge } from './ui/Badge';
import { useImageUpload } from '../hooks/useImageUpload';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface MetadataOptimizerProps {
  onSaveToGallery?: (image: GeneratedImage) => void;
}

const MetadataOptimizer: React.FC<MetadataOptimizerProps> = ({ onSaveToGallery }) => {
  const [metadata, setMetadata] = useState<StockMetadata | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const { showToast } = useToast();
  const copy = useCopyToClipboard();

  const { 
    image, 
    isLoading: isProcessing, 
    error: uploadError, 
    fileInputRef, 
    handleFileChange, 
    triggerUpload 
  } = useImageUpload(() => {
    setMetadata(null);
    setIsSaved(false);
  });

  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    setIsSaved(false);
    try {
      const data = await generateMetadata(image);
      setMetadata(data);
      showToast("Metadata generated successfully!", "success");
    } catch (err) {
      showToast("Analysis failed.", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!image || !metadata || !onSaveToGallery) return;

    let category: AssetCategory = 'photo';
    const rawCat = (metadata.category || '').toLowerCase();
    if (rawCat.includes('vector') || rawCat.includes('graphic')) category = 'vector';
    else if (rawCat.includes('illustration') || rawCat.includes('drawing')) category = 'illustration';

    const newImage: GeneratedImage = {
      id: `imported-${Date.now()}`,
      url: image,
      prompt: metadata.description || 'Imported Asset',
      aspectRatio: 'custom',
      createdAt: Date.now(),
      category: category,
      model: 'Imported',
      metadata: metadata
    };

    onSaveToGallery(newImage);
    setIsSaved(true);
    showToast("Image and metadata saved to Gallery", "success");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      <PageHeader
        title="Metadata Optimizer"
        description="Maximize discoverability with AI-generated titles, descriptions, and keywords optimized for Adobe Stock's algorithm."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-4">
          <div 
            onClick={triggerUpload}
            className={`border-2 border-dashed rounded-2xl p-4 md:p-8 flex flex-col items-center justify-center cursor-pointer transition-all h-64 md:h-96 group ${
              image 
                ? 'border-indigo-500/50 bg-slate-900/50 relative overflow-hidden' 
                : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/30'
            }`}
          >
             {image ? (
               <img src={image} alt="Upload" className="w-full h-full object-contain" />
             ) : (
               <>
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300 shadow-xl shadow-indigo-500/10">
                   <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                   </svg>
                 </div>
                 <p className="text-slate-300 font-medium text-base md:text-lg">Click to upload image</p>
                 <p className="text-slate-500 text-xs md:text-sm mt-2">JPG, PNG, SVG (Max 10MB)</p>
               </>
             )}
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               accept="image/png, image/jpeg, image/svg+xml" 
               className="hidden" 
             />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={!image || analyzing || isProcessing}
            isLoading={analyzing}
            fullWidth
            size="lg"
            variant="primary"
          >
            {analyzing ? 'Analyzing Image...' : 'Generate Optimized Metadata'}
          </Button>
          
          {uploadError && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">{uploadError}</p>}
        </div>

        <div className="flex flex-col h-full">
          {!metadata ? (
            <Card variant="flat" className="h-64 md:h-full bg-slate-800/20 flex flex-col items-center justify-center text-slate-500 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                 <svg className="w-6 h-6 md:w-8 md:h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
              </div>
              <p className="max-w-xs text-sm md:text-base">Upload an image to generate titles, descriptions, and keywords optimized for Adobe Stock sales.</p>
            </Card>
          ) : (
            <div className="space-y-4 md:space-y-6 animate-fadeIn h-full flex flex-col relative">
              
               <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-white">Analysis Results</h3>
                   {onSaveToGallery && (
                       <Button 
                           variant={isSaved ? "secondary" : "gradient"} 
                           size="sm" 
                           onClick={handleSave}
                           disabled={isSaved}
                           leftIcon={isSaved ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>}
                       >
                           {isSaved ? "Saved to Gallery" : "Save to Gallery"}
                       </Button>
                   )}
               </div>

              <Card variant="hoverable">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Recommended Title</span>
                  <Button variant="ghost" size="sm" onClick={() => copy(metadata.title, "Title")} className="text-indigo-400 hover:text-white !p-1 h-auto">Copy</Button>
                </div>
                <p className="text-white font-medium text-base md:text-lg leading-tight">{metadata.title}</p>
              </Card>

              <Card variant="hoverable">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Description</span>
                  <Button variant="ghost" size="sm" onClick={() => copy(metadata.description, "Description")} className="text-indigo-400 hover:text-white !p-1 h-auto">Copy</Button>
                </div>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{metadata.description}</p>
              </Card>

               <Card variant="default" className="flex justify-between items-center !p-3 md:!p-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Category</span>
                  <Badge variant="success" className="font-mono">{metadata.category}</Badge>
              </Card>

              <Card variant="default" className="flex-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Keywords ({metadata.keywords.length})</span>
                  <Button variant="ghost" size="sm" onClick={() => copy(metadata.keywords.join(', '), "Keywords")} className="text-indigo-400 hover:text-white !p-1 h-auto">Copy All</Button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-[200px] md:max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {metadata.keywords.map((keyword, i) => (
                    <button 
                      key={i} 
                      onClick={() => copy(keyword, "Keyword")}
                      className="bg-slate-900/80 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs px-2.5 py-1.5 rounded border border-slate-700 hover:border-indigo-500 transition-all active:scale-95"
                      title="Click to copy"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetadataOptimizer;
