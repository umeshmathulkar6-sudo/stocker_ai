
import React, { useState } from 'react';
import { GeneratedImage } from '../types';
import { PageHeader } from './ui/PageHeader';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ASSET_CATEGORIES } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { upscaleImage, downloadUrl, formatDate } from '../utils';
import { generateMetadata } from '../services/geminiService';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface GalleryProps {
  images: GeneratedImage[];
  onDelete: (id: string) => void;
  onUpdate: (image: GeneratedImage) => void;
}

const Gallery: React.FC<GalleryProps> = ({ images, onDelete, onUpdate }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedMetadataImage, setSelectedMetadataImage] = useState<GeneratedImage | null>(null);
  const [processingAction, setProcessingAction] = useState<{id: string, type: 'upscale' | 'metadata'} | null>(null);
  const { showToast } = useToast();
  const copy = useCopyToClipboard();

  const categories = [
    { id: 'all', label: 'All Assets' },
    ...ASSET_CATEGORIES
  ];

  const visibleImages = activeCategory === 'all' 
    ? images 
    : images.filter(img => img.category === activeCategory);

  const sortedImages = [...visibleImages].sort((a, b) => b.createdAt - a.createdAt);

  const handleDownload = async (imageUrl: string, id: string, upscale: boolean, format: 'png' | 'jpeg') => {
    try {
        let finalUrl = imageUrl;
        const needsProcessing = upscale || (format === 'jpeg') || (!imageUrl.startsWith('data:image/png'));

        if (needsProcessing) {
            setProcessingAction({ id, type: 'upscale' });
            if (upscale) {
                showToast("Running Frequency Separation Engine (4K)...", "info");
            } else {
                showToast("Optimizing format & structure...", "info");
            }
            
            const targetMP = upscale ? 16 : 0;
            // Allow UI update
            await new Promise(resolve => setTimeout(resolve, 50));
            finalUrl = await upscaleImage(imageUrl, targetMP, format);
        }

        downloadUrl(finalUrl, `stock-gallery-${id}${upscale ? '-4k-ultra' : ''}.${format === 'jpeg' ? 'jpg' : 'png'}`);
        
        if (needsProcessing) {
            showToast("Asset remastered & downloaded.", "success");
        }
    } catch (e) {
        showToast("Processing failed", "error");
        console.error(e);
    } finally {
        if (upscale || (format === 'jpeg') || (!imageUrl.startsWith('data:image/png'))) {
            setProcessingAction(null);
        }
    }
  };

  const handleGenerateMetadata = async (img: GeneratedImage) => {
    setProcessingAction({ id: img.id, type: 'metadata' });
    showToast("Generating SEO metadata...", "info");
    
    try {
        const metadata = await generateMetadata(img.url);
        if (metadata) {
            const updatedImage = { ...img, metadata };
            onUpdate(updatedImage);
            showToast("Metadata saved successfully", "success");
        } else {
            throw new Error("No metadata returned");
        }
    } catch (e) {
        console.error(e);
        showToast("Failed to generate metadata", "error");
    } finally {
        setProcessingAction(null);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn">
      <PageHeader 
        title="Asset Gallery" 
        description="Your personal library of generated stock assets. Ready for export."
        action={
            <div className="text-sm text-slate-500">
                {images.length} item{images.length !== 1 ? 's' : ''} stored
            </div>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-1 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-t-lg transition-all relative whitespace-nowrap ${
              activeCategory === cat.id 
                ? 'text-indigo-400 bg-slate-800/50 border-b-2 border-indigo-500' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {sortedImages.length === 0 ? (
        <Card variant="flat" className="flex flex-col items-center justify-center h-96 border-slate-800 bg-slate-900/50 text-center p-6">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No images found</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            {activeCategory === 'all' 
                ? "You haven't generated any assets yet. Head to the 'Create' tab to get started." 
                : `No assets found in the '${activeCategory}' category.`}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedImages.map((img) => (
            <Card 
                key={img.id} 
                variant="hoverable" 
                className="group flex flex-col overflow-hidden !p-0"
                noPadding
            >
                <div className="relative aspect-square bg-slate-900 overflow-hidden">
                    <img 
                        src={img.url} 
                        alt={img.prompt} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                    />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center backdrop-blur-sm p-4">
                        <div className="w-full max-w-[180px] space-y-2.5">
                            <div className="space-y-1">
                                <span className="text-[9px] text-slate-300 uppercase font-bold tracking-wider pl-1">Standard</span>
                                <div className="flex gap-1.5">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleDownload(img.url, img.id, false, 'png')}
                                        className="flex-1 text-[10px] !py-1.5 h-8"
                                    >
                                        PNG
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleDownload(img.url, img.id, false, 'jpeg')}
                                        className="flex-1 text-[10px] !py-1.5 h-8"
                                    >
                                        JPG
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[9px] text-indigo-300 uppercase font-bold tracking-wider pl-1">Pro Upscale (4K)</span>
                                <div className="flex gap-1.5">
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        onClick={() => handleDownload(img.url, img.id, true, 'png')}
                                        isLoading={processingAction?.id === img.id && processingAction?.type === 'upscale'}
                                        disabled={!!processingAction}
                                        className="flex-1 text-[10px] !py-1.5 h-8"
                                    >
                                        PNG
                                    </Button>
                                    <Button
                                        variant="gradient"
                                        size="sm"
                                        onClick={() => handleDownload(img.url, img.id, true, 'jpeg')}
                                        isLoading={processingAction?.id === img.id && processingAction?.type === 'upscale'}
                                        disabled={!!processingAction}
                                        className="flex-1 text-[10px] !py-1.5 h-8"
                                    >
                                        JPG
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-1 flex gap-1.5">
                                {img.metadata ? (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSelectedMetadataImage(img)}
                                        className="flex-1 h-8 !px-0"
                                        title="View Metadata"
                                        leftIcon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    >
                                        Info
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleGenerateMetadata(img)}
                                        isLoading={processingAction?.id === img.id && processingAction?.type === 'metadata'}
                                        disabled={!!processingAction}
                                        className="flex-1 h-8 !px-0 !bg-slate-800/80 hover:!bg-indigo-600 !border-indigo-400/50 !text-indigo-100"
                                        title="Generate Metadata"
                                        leftIcon={<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547" /></svg>}
                                    >
                                        SEO
                                    </Button>
                                )}

                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => onDelete(img.id)}
                                    className="w-8 h-8 !px-0 flex-shrink-0"
                                    title="Delete"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </Button>
                            </div>

                        </div>
                    </div>

                    <div className="absolute top-2 left-2 flex gap-2">
                        <Badge variant={img.category as any} size="sm">{img.category}</Badge>
                        {img.metadata && <Badge variant="info" size="sm">SEO Ready</Badge>}
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3 h-8" title={img.prompt}>
                        {img.prompt}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">{formatDate(img.createdAt)}</span>
                        <button 
                            onClick={() => copy(img.prompt, "Prompt")}
                            className="text-indigo-400 hover:text-white text-[10px] uppercase font-bold tracking-wider transition-colors"
                        >
                            Copy Prompt
                        </button>
                    </div>
                </div>
            </Card>
          ))}
        </div>
      )}

      {selectedMetadataImage && selectedMetadataImage.metadata && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={() => setSelectedMetadataImage(null)}>
            <div 
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-xl font-bold text-white">Asset Metadata</h3>
                    <button onClick={() => setSelectedMetadataImage(null)} className="text-slate-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="flex gap-4 items-start">
                         <img src={selectedMetadataImage.url} alt="Thumbnail" className="w-24 h-24 object-cover rounded-lg border border-slate-700" />
                         <div>
                             <p className="text-xs text-slate-500 uppercase font-bold mb-1">ID: {selectedMetadataImage.id}</p>
                             <div className="flex gap-2 mb-2">
                                <Badge variant={selectedMetadataImage.category as any}>{selectedMetadataImage.category}</Badge>
                                <Badge variant="success">{selectedMetadataImage.metadata.category}</Badge>
                             </div>
                         </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Title</span>
                                <button onClick={() => copy(selectedMetadataImage.metadata!.title, "Title")} className="text-xs text-indigo-400 hover:text-white">Copy</button>
                             </div>
                             <p className="text-white font-medium">{selectedMetadataImage.metadata.title}</p>
                        </div>

                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Description</span>
                                <button onClick={() => copy(selectedMetadataImage.metadata!.description, "Description")} className="text-xs text-indigo-400 hover:text-white">Copy</button>
                             </div>
                             <p className="text-slate-300 text-sm">{selectedMetadataImage.metadata.description}</p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase">Keywords ({selectedMetadataImage.metadata.keywords.length})</span>
                                <button onClick={() => copy(selectedMetadataImage.metadata!.keywords.join(', '), "Keywords")} className="text-xs text-indigo-400 hover:text-white">Copy All</button>
                             </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedMetadataImage.metadata.keywords.map((k, i) => (
                                    <span key={i} onClick={() => copy(k, "Keyword")} className="cursor-pointer hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300">
                                        {k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex justify-end">
                    <Button onClick={() => setSelectedMetadataImage(null)} variant="secondary">Close</Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
