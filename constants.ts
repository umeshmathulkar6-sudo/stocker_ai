
import { AspectRatioOption, AssetCategory } from './types';

export const APP_NAME = 'Stocker AI';

export const MODELS = {
  GEMINI_2_5: 'gemini-2.5-flash-image', // Flash Tier (Faster)
  GEMINI_3_PRO: 'gemini-3-pro-image-preview', // Pro Tier (Stricter limits)
  GEMINI_METADATA: 'gemini-3-flash-preview',
  GEMINI_TRENDS: 'gemini-3-flash-preview',
};

// Rate Limits based on Google Gemini API Free Tier
// We add a safety buffer (1.1x interval) to ensure we don't hit the edge.
export const RATE_LIMITS: Record<string, { rpm: number }> = {
  [MODELS.GEMINI_2_5]: { rpm: 15 }, // ~4 seconds/req
  [MODELS.GEMINI_3_PRO]: { rpm: 2 },  // ~30 seconds/req (Very strict on free tier)
  [MODELS.GEMINI_METADATA]: { rpm: 15 },
  [MODELS.GEMINI_TRENDS]: { rpm: 15 },
  'default': { rpm: 10 }
};

export const ASPECT_RATIOS: AspectRatioOption[] = [
  { label: 'Landscape', value: '4:3', desc: 'Editorial & Web' },
  { label: 'Cinematic', value: '16:9', desc: 'Headers' },
  { label: 'Square', value: '1:1', desc: 'Social Media' },
  { label: 'Portrait', value: '3:4', desc: 'Mobile & Covers' },
];

export const ASSET_CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: 'photo', label: 'Photos' },
  { id: 'illustration', label: 'Illustrations' },
  { id: 'vector', label: 'Vector Art' },
];

export const IMAGE_STYLE_PROMPTS: Record<AssetCategory, string> = {
  illustration: "Professional digital illustration, Adobe Stock quality, highly detailed, vibrant colors, commercial composition, artistic style, no text, no watermarks.",
  vector: "Flat vector art style, simple limited color palette, clean vector lines, minimal, svg style, high contrast, isolated on a pure white background, no drop shadows, no gradients, hard edges, cel shaded, no anti-aliasing, easy to trace.",
  photo: "Professional stock photography, award-winning cinematography, highly detailed, 8k resolution, perfect lighting, photorealistic, depth of field, commercial quality."
};

export const METADATA_SYSTEM_PROMPT = "Act as an Adobe Stock SEO expert. Analyze this image. Provide a catchy, SEO-friendly Title (max 70 chars). Provide a detailed commercial description (min 2 sentences). Suggest the best Adobe Stock Category. Provide exactly 30 high-relevance keywords, sorted by importance (most important first).";

export const TRENDS_PROMPT = "Analyze current global stock market trends for Adobe Stock. Identify exactly 6 high-demand niches: 2 specifically for Stock Photography, 2 for Digital Illustrations, and 2 for Vector Graphics. For each, provide a topic, description, correct category ('photo', 'illustration', or 'vector'), commercial value, and suggested prompts.";

export const PROMPT_ENHANCER_SYSTEM_PROMPT = "You are an expert Adobe Stock prompt engineer. Rewrite the user's basic concept into a highly detailed, commercially viable generative AI prompt. Include specific details about lighting, composition, texture, mood, and technical style relevant to the asset type. Keep the output as a single, potent paragraph under 60 words. Do not include introductory text.";
