
import React, { useState, useEffect } from 'react';
import { generateStockImage, enhancePrompt } from '../services/geminiService';
import { traceImageToSVG } from '../services/vectorService';
import { ImageModelType, AssetCategory, GeneratedImage } from '../types';
import { useToast } from '../contexts/ToastContext';
import { MODELS, ASPECT_RATIOS, ASSET_CATEGORIES } from '../constants';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { PageHeader } from './ui/PageHeader';
import { Textarea } from './ui/Input';
import { Loader } from './ui/Loader';
import { downloadUrl } from '../utils';

interface ImageGeneratorProps {
  initialPrompt?: string;
  onImageGenerated?: (image: GeneratedImage) => void;
}

interface ImageSlot {
  id: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  url?: string;
  error?: string;
  isVectorizing?: boolean;
  modelUsed?: string;
}

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ initialPrompt = '', onImageGenerated }) => {
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const [preferredModel, setPreferredModel] = useState<ImageModelType>('pro'); 
  const [category, setCategory] = useState<AssetCategory>('photo');
  const [quantity, setQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [images, setImages] = useState<ImageSlot[]>([]);
  
  const completedCount = images.filter(img => img.status === 'success' || img.status === 'error').length;
  const totalCount = images.length;
  const remainingInBatch = totalCount - completedCount;

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const getTargetModel = () => {
      return preferredModel === 'standard' ? MODELS.GEMINI_2_5 : MODELS.GEMINI_3_PRO;
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) {
        showToast("Please enter a basic concept first", "error");
        return;
    }
    setIsEnhancing(true);
    try {
        const enhanced = await enhancePrompt(prompt, category);
        if (enhanced) {
            setPrompt(enhanced);
            showToast("Prompt enhanced!", "success");
        }
    } catch (e) {
        showToast("Failed to enhance prompt", "error");
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const targetModelId = getTargetModel();

    setIsGenerating(true);
    
    const newImages: ImageSlot[] = Array(quantity).fill(null).map((_, i) => ({
      id: `${Date.now()}-${i}`,
      status: 'pending',
    }));
    setImages(newImages);

    for (let i = 0; i < newImages.length; i++) {
        const currentSlot = newImages[i];
        
        setImages(prev => prev.map(img => 
            img.id === currentSlot.id ? { ...img, status: 'loading' } : img
        ));

        try {
            const result = await generateStockImage(prompt, aspectRatio, targetModelId, category, 1);
            
            if (result) {
                setImages(prev => prev.map(img => 
                    img.id === currentSlot.id ? { ...img, status: 'success', url: result, modelUsed: targetModelId } : img
                ));

                if (onImageGenerated) {
                    const galleryItem: GeneratedImage = {
                        id: currentSlot.id,
                        url: result,
                        prompt: prompt,
                        aspectRatio: aspectRatio,
                        createdAt: Date.now(),
                        category: category,
                        model: targetModelId
                    };
                    onImageGenerated(galleryItem);
                }

            } else {
                 throw new Error("No image data returned");
            }

        } catch (err: any) {
            console.error(`Model ${targetModelId} failed:`, err);
            
            let msg = err?.message || 'Generation Failed';
            if (typeof err === 'object') msg = JSON.stringify(err);

            const isQuota = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
            
            if (isQuota) {
                showToast(`API Limit reached for ${targetModelId}.`, 'error');
            }

            setImages(prev => prev.map(img => 
                img.id === currentSlot.id ? { ...img, status: 'error', error: isQuota ? 'API Limit' : 'Generation Failed' } : img
            ));
        }

        if (i < newImages.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    setIsGenerating(false);
  };

  const handleDownload = async (imageUrl: string, index: number, asSvg: boolean = false) => {
    if (asSvg) {
      setImages(prev => prev.map((img, i) => i === index ? { ...img, isVectorizing: true } : img));
      try {
        const svgString = await traceImageToSVG(imageUrl);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        downloadUrl(url, `stock-vector-${index + 1}-${Date.now()}.svg`);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Vectorization failed", e);
        alert("Could not generate SVG. Downloading PNG instead.\nCheck console for network details.");
        downloadPng(imageUrl, index);
      } finally {
        setImages(prev => prev.map((img, i) => i === index ? { ...img, isVectorizing: false } : img));
      }
    } else {
      downloadPng(imageUrl, index);
    }
  };

  const downloadPng = (imageUrl: string, index: number) => {
    downloadUrl(imageUrl, `stock-asset-${category}-${index + 1}-${Date.now()}.png`);
  };

  const formatModelName = (name: string) => {
    return name
      .replace('gemini-', '')
      .replace('-preview', '')
      .replace('-image', '')
      .replace('-flash', '')
      .toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 h-full animate-fadeIn">
      <div className="xl:col-span-5 flex flex-col h-full space-y-4 md:space-y-6">
        <PageHeader 
          title="Create Assets" 
          description="Generate commercially viable stock imagery in bulk."
        />

        <form onSubmit={handleGenerate}>
          <Card className="space-y-4 md:space-y-6">
            
            <div className="flex p-1 bg-slate-900/80 rounded-xl border border-slate-700/50">
              {ASSET_CATEGORIES.map((cat) => (
                  <Button
                    key={cat.id}
                    type="button"
                    variant={category === cat.id ? 'secondary' : 'ghost'}
                    onClick={() => setCategory(cat.id)}
                    className={`flex-1 !py-2 !text-xs md:!text-sm ${category === cat.id ? '!shadow-lg' : 'hover:!bg-slate-800'}`}
                  >
                    {cat.label}
                  </Button>
              ))}
            </div>

            <div className="bg-slate-900/80 p-1 rounded-xl flex border border-slate-700/50">
               <Button
                  type="button"
                  variant={preferredModel === 'standard' ? 'secondary' : 'ghost'}
                  onClick={() => setPreferredModel('standard')}
                  className="flex-1 !py-2 !text-xs md:!text-sm flex flex-col items-center gap-1"
                  title="Flash Model: Fast, 1MP (Draft quality)"
               >
                 <span>Draft Mode</span>
                 <span className="text-[9px] opacity-60 font-normal">Standard (Low Res)</span>
               </Button>
               <Button
                  type="button"
                  variant={preferredModel === 'pro' ? 'primary' : 'ghost'}
                  onClick={() => setPreferredModel('pro')}
                  className="flex-1 !py-2 !text-xs md:!text-sm flex flex-col items-center gap-1"
                  title="Pro Model: Slow, 4MP+ (Stock Ready)"
               >
                 <span>Stock Ready</span>
                 <span className="text-[9px] opacity-80 font-normal">Gemini 3 Pro (4K)</span>
               </Button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs uppercase tracking-wider font-bold text-slate-500">Prompt Concept</label>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEnhance}
                    disabled={isEnhancing || !prompt.trim()}
                    className={`!p-1.5 !h-auto text-indigo-400 hover:text-indigo-300 ${isEnhancing ? 'animate-pulse' : ''}`}
                    leftIcon={
                      <svg className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isEnhancing ? (
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        )}
                      </svg>
                    }
                >
                    {isEnhancing ? 'Improving...' : 'Magic Enhance'}
                </Button>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe your ${category}...`}
                className="h-24 md:h-32"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Aspect Ratio</label>
                  <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        type="button"
                        onClick={() => setAspectRatio(ratio.value)}
                        className={`p-2 rounded-lg border text-left transition-all ${
                            aspectRatio === ratio.value
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                      <div className="font-semibold text-[10px] md:text-xs truncate">{ratio.label}</div>
                      </button>
                  ))}
                  </div>
              </div>

              <div>
                  <div className="flex justify-between items-end mb-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-slate-500">
                          Batch Quantity
                      </label>
                  </div>
                  <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                      {QUANTITY_OPTIONS.map((q) => (
                          <Button
                              key={q}
                              type="button"
                              variant={quantity === q ? 'primary' : 'ghost'}
                              onClick={() => setQuantity(q)}
                              className="flex-1 !py-2 !text-sm !px-0"
                          >
                              {q}
                          </Button>
                      ))}
                  </div>
              </div>
            </div>

            <Button
              type="submit"
              variant={preferredModel === 'pro' ? 'gradient' : 'secondary'}
              size="lg"
              fullWidth
              disabled={isGenerating || !prompt.trim()}
              isLoading={isGenerating}
            >
              {isGenerating ? `Processing... (${remainingInBatch} in queue)` : 'Generate Assets'}
            </Button>
          </Card>
        </form>
      </div>

      <Card className="xl:col-span-7 flex flex-col relative min-h-[400px] xl:h-auto xl:min-h-0 !p-4 md:!p-6">
        {images.length > 0 ? (
          <div className={`h-full overflow-y-auto pr-0 md:pr-2 custom-scrollbar grid gap-4 ${
              images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {images.map((img, idx) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50 aspect-square flex items-center justify-center">
                    
                    {img.status === 'pending' && (
                         <div className="flex flex-col items-center gap-2">
                            <Loader size="sm" color="border-slate-600" className="opacity-50" />
                            <span className="text-xs text-slate-500 font-medium">Waiting...</span>
                         </div>
                    )}

                    {img.status === 'loading' && (
                        <div className="flex flex-col items-center gap-3">
                           <Loader size="md" />
                           <span className="text-xs text-indigo-400 font-medium animate-pulse">Rendering...</span>
                        </div>
                    )}

                    {img.status === 'error' && (
                        <div className="flex flex-col items-center gap-2 text-red-400 px-4 text-center">
                           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           <span className="text-xs">{img.error || 'Failed'}</span>
                        </div>
                    )}

                    {img.status === 'success' && img.url && (
                        <>
                            <img 
                                src={img.url} 
                                alt={`Generated Stock ${idx + 1}`} 
                                className="w-full h-full object-cover animate-fadeIn"
                            />
                            {img.modelUsed && (
                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[9px] text-white/70 font-mono">
                                    {formatModelName(img.modelUsed)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3 backdrop-blur-sm p-4">
                                
                                {category === 'vector' ? (
                                  <>
                                    <Button
                                      variant="gradient"
                                      onClick={() => handleDownload(img.url!, idx, true)}
                                      disabled={img.isVectorizing}
                                      isLoading={img.isVectorizing}
                                      className="w-full max-w-[200px]"
                                    >
                                      {img.isVectorizing ? 'Vectorizing...' : 'Download SVG'}
                                    </Button>
                                    
                                    <Button
                                      variant="secondary"
                                      onClick={() => handleDownload(img.url!, idx, false)}
                                      className="w-full max-w-[200px]"
                                    >
                                      Download PNG
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    onClick={() => handleDownload(img.url!, idx, false)}
                                    className="!bg-white !text-slate-900 hover:!bg-slate-100 transform translate-y-2 group-hover:translate-y-0 shadow-xl"
                                    leftIcon={
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    }
                                  >
                                    Download
                                  </Button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 md:p-8 opacity-50">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-800/50 rounded-full mb-4 md:mb-6 flex items-center justify-center text-slate-600 border border-slate-700">
               <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
               </svg>
            </div>
            <p className="text-slate-400 font-medium text-lg">Ready to Create</p>
            <p className="text-slate-500 text-sm mt-2 max-w-xs">Select your parameters and generate high-quality assets.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
