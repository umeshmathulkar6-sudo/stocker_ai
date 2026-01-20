
export interface Trend {
  topic: string;
  description: string;
  category: string;
  commercialValue: 'High' | 'Medium' | 'Low';
  suggestedPrompts: string[];
}

export type AssetCategory = 'photo' | 'illustration' | 'vector';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  createdAt: number;
  category: AssetCategory;
  model: string;
  metadata?: StockMetadata;
}

export interface StockMetadata {
  title: string;
  description: string;
  keywords: string[];
  category: string;
}

export type ViewState = 'trends' | 'create' | 'metadata' | 'gallery' | 'upscale';

export interface AspectRatioOption {
  label: string;
  value: string;
  desc: string;
}

export type ImageModelType = 'standard' | 'pro';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
    ImageTracer: any;
  }
  
  var ImageTracer: any;
}
