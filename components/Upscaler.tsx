
import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { upscaleImage, downloadUrl } from '../utils';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { GeneratedImage } from '../types';
import { Badge } from './ui/Badge';
import { useImageUpload } from '../hooks/useImageUpload';

interface UpscalerProps {
  onSaveToGallery?: (image: GeneratedImage) => void;
}

const Upscaler: React.FC<UpscalerProps> = ({ onSaveToGallery }) => {
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();
  
  // Use the new centralized hook
  const { 
    image: originalImage, 
    setImage: setOriginalImage, 
    fileInputRef, 
    handleFileChange, 
    triggerUpload 
  } = useImageUpload(() => setUpscaledImage(null));

  const handleUpscale = async (mode: '2k' | '4k') => {
    if (!originalImage) return;

    setIsProcessing(true);
    const targetMP = mode === '4k' ? 16 : 4;
    const label = mode === '4k' ? 'Pro 4K Ultra' : 'Fast 2K';

    showToast(`Applying ${label} Enhancement...`, "info");
    
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const result = await upscaleImage(originalImage, targetMP, 'png');
      setUpscaledImage(result);
      showToast(`${label} Upscale Complete`, "success");
    } catch (e) {
      console.error(e);
      showToast("Upscaling failed. Try a smaller image.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (imageUrl: string, suffix: string) => {
    downloadUrl(imageUrl, `upscaled-${Date.now()}-${suffix}.png`);
    showToast("Download started", "success");
  };

  const handleSave = () => {
    if (!upscaledImage || !onSaveToGallery) return;
    
    const newImage: GeneratedImage = {
      id: `upscaled-${Date.now()}`,
      url: upscaledImage,
      prompt: 'Imported & Upscaled Asset',
      aspectRatio: 'custom',
      createdAt: Date.now(),
      category: 'photo',
      model: 'Pro Upscaler',
      metadata: undefined
    };

    onSaveToGallery(newImage);
    showToast("Saved to Asset Gallery", "success");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-fadeIn">
      <PageHeader 
        title="Pro Upscaler" 
        description="Enhance resolution, detail, and structure using our frequency separation engine. Prepare any image for stock submission."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <Card className={`relative overflow-hidden transition-all h-[400px] flex flex-col items-center justify-center p-0 border-2 border-dashed ${originalImage ? 'border-slate-700 bg-slate-900' : 'border-slate-700 hover:border-indigo-500 cursor-pointer bg-slate-900/50'}`}>
            
            {!originalImage && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center z-10"
                onClick={triggerUpload}
              >
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-indigo-400 shadow-lg shadow-indigo-500/10">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-slate-300 font-medium">Click to Upload Image</p>
                <p className="text-slate-500 text-xs mt-2">JPG, PNG (Max 10MB)</p>
              </div>
            )}

            {originalImage && (
              <>
                 <img src={originalImage} className="w-full h-full object-contain" alt="Original" />
                 <div className="absolute top-4 left-4">
                    <Badge variant="default">Original</Badge>
                 </div>
                 <button 
                   onClick={() => { setOriginalImage(null); setUpscaledImage(null); }}
                   className="absolute top-4 right-4 bg-slate-900/80 p-2 rounded-lg text-slate-400 hover:text-white"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </>
            )}

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </Card>

          <div className="flex gap-4">
             <Button
               variant="secondary"
               fullWidth
               disabled={!originalImage || isProcessing}
               onClick={() => handleUpscale('2k')}
             >
               2K Upscale (Fast)
             </Button>
             <Button
               variant="gradient"
               fullWidth
               disabled={!originalImage || isProcessing}
               isLoading={isProcessing}
               onClick={() => handleUpscale('4k')}
               leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
             >
               Pro 4K Upscale
             </Button>
          </div>
        </div>

        <div className="space-y-4">
           <Card className="h-[400px] flex flex-col items-center justify-center p-0 bg-slate-900 relative overflow-hidden">
              {upscaledImage ? (
                <>
                  <img src={upscaledImage} className="w-full h-full object-contain animate-fadeIn" alt="Upscaled" />
                  <div className="absolute top-4 left-4">
                    <Badge variant="success">Enhanced 4K</Badge>
                  </div>
                </>
              ) : (
                <div className="text-center opacity-40 p-8">
                   <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547" /></svg>
                   </div>
                   <p className="text-slate-400">Processed image will appear here</p>
                </div>
              )}
           </Card>

           <div className="grid grid-cols-2 gap-4">
              <Button
                variant="primary"
                disabled={!upscaledImage}
                onClick={() => upscaledImage && handleDownload(upscaledImage, 'enhanced')}
              >
                Download PNG
              </Button>
              <Button
                variant="secondary"
                disabled={!upscaledImage}
                onClick={handleSave}
              >
                Save to Gallery
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Upscaler;
