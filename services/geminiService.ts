
import { GoogleGenAI, Type } from "@google/genai";
import { Trend, StockMetadata, AssetCategory } from "../types";
import { MODELS, IMAGE_STYLE_PROMPTS, METADATA_SYSTEM_PROMPT, TRENDS_PROMPT, PROMPT_ENHANCER_SYSTEM_PROMPT, RATE_LIMITS } from "../constants";

// --- Rate Limiter Implementation ---
class RequestQueue {
  private queue: Array<{ task: () => Promise<any>; resolve: (v: any) => void; reject: (e: any) => void }> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval: number;

  constructor(rpm: number) {
    // Calculate interval in ms. Added 10% buffer to be safe.
    // e.g., 15 RPM = 60000/15 = 4000ms + buffer = ~4400ms
    this.minInterval = (60000 / rpm) * 1.1;
  }

  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;
      
      // Enforce Rate Limit Delay
      if (timeSinceLast < this.minInterval) {
        const waitTime = this.minInterval - timeSinceLast;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const item = this.queue.shift();
      if (item) {
        this.lastRequestTime = Date.now();
        try {
          // Execute the actual API call
          const result = await item.task();
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        }
      }
    }

    this.processing = false;
  }
}

// Singleton to hold queues for each model
class RateLimitManager {
  private queues: Map<string, RequestQueue> = new Map();

  schedule<T>(model: string, operation: () => Promise<T>): Promise<T> {
    if (!this.queues.has(model)) {
      const config = RATE_LIMITS[model] || RATE_LIMITS['default'];
      this.queues.set(model, new RequestQueue(config.rpm));
    }
    return this.queues.get(model)!.add(operation);
  }
}

const rateLimiter = new RateLimitManager();

// --- End Rate Limiter ---

// Helper to ensure we always get a fresh client with the latest key
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Executes a function with exponential backoff retry logic for transient errors.
 * Note: The RateLimiter above handles "preventing" 429s. This handles "recovering" from them
 * if they still slip through or if other network errors occur.
 */
async function runWithRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Determine if error is retryable
      const status = error.status || error.response?.status;
      const isRetryable = 
        status === 429 || 
        status === 503 || 
        status === 500 || 
        (error.message && (
          error.message.includes('overloaded') || 
          error.message.includes('quota') || 
          error.message.includes('timeout') ||
          error.message.includes('fetch failed')
        ));

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      console.warn(`API Attempt ${attempt + 1} failed (Status: ${status}), retrying...`);
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt) + (Math.random() * 500);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

// Robust JSON parser
const parseJSON = <T>(text: string | undefined): T | null => {
  if (!text) return null;
  try {
    let cleanText = text.replace(/```json\s*|\s*```/g, '').replace(/```\s*/g, '');
    const firstBrace = cleanText.indexOf('{');
    const firstBracket = cleanText.indexOf('[');
    
    let startIndex = -1;
    if (firstBrace !== -1 && firstBracket !== -1) {
        startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace !== -1) {
        startIndex = firstBrace;
    } else if (firstBracket !== -1) {
        startIndex = firstBracket;
    }

    if (startIndex !== -1) {
        cleanText = cleanText.substring(startIndex);
        const lastBrace = cleanText.lastIndexOf('}');
        const lastBracket = cleanText.lastIndexOf(']');
        const endIndex = Math.max(lastBrace, lastBracket);
        
        if (endIndex !== -1) {
            cleanText = cleanText.substring(0, endIndex + 1);
        }
    }

    return JSON.parse(cleanText) as T;
  } catch (e) {
    console.error("JSON Parse Error:", e);
    return null;
  }
};

export const getMarketTrends = async (): Promise<Trend[]> => {
  const model = MODELS.GEMINI_TRENDS;
  
  // Wrap with Rate Limiter AND Retry Logic
  return rateLimiter.schedule(model, () => 
    runWithRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: model,
        contents: "Generate the current high-demand market trends report for Adobe Stock contributors.",
        config: {
          systemInstruction: TRENDS_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                description: { type: Type.STRING },
                category: { type: Type.STRING, enum: ['photo', 'illustration', 'vector'] },
                commercialValue: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                suggestedPrompts: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["topic", "description", "category", "commercialValue", "suggestedPrompts"]
            }
          }
        }
      });

      const data = parseJSON<Trend[]>(response.text);
      if (!data) throw new Error("Received malformed JSON for trends");
      return data;
    })
  );
};

export const enhancePrompt = async (prompt: string, category: string): Promise<string | null> => {
  const model = MODELS.GEMINI_METADATA;

  return rateLimiter.schedule(model, () => 
    runWithRetry(async () => {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: model,
        contents: `Asset Type: ${category}\nUser Concept: ${prompt}`,
        config: {
          systemInstruction: PROMPT_ENHANCER_SYSTEM_PROMPT,
          temperature: 0.7, 
        }
      });
      
      if (!response.text) throw new Error("Empty response from enhancer");
      return response.text.trim();
    })
  );
};

export const generateStockImage = async (
  prompt: string, 
  aspectRatio: string, 
  model: string,
  category: AssetCategory = 'photo',
  retries: number = 2
): Promise<string | null> => {
  // IMPORTANT: Images have strict rate limits. The UI loops this function.
  // The RateLimiter here will serialize them with delays automatically.
  return rateLimiter.schedule(model, () => 
    runWithRetry(async () => {
      const ai = getClient();
      const stylePrompt = IMAGE_STYLE_PROMPTS[category] || IMAGE_STYLE_PROMPTS.photo;
      const fullPrompt = `${stylePrompt} ${prompt}`;

      const imageConfig: any = {
        aspectRatio: aspectRatio,
      };

      if (model === MODELS.GEMINI_3_PRO) {
        // Adobe requires minimum 4MP. 1K=1MP, 2K=4MP, 4K=16MP.
        // We set 4K for maximum quality retention during post-processing.
        imageConfig.imageSize = "4K"; 
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig,
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data found in response");
    }, retries, 2000)
  );
};

export const generateMetadata = async (base64Image: string): Promise<StockMetadata | null> => {
  const model = MODELS.GEMINI_METADATA;

  return rateLimiter.schedule(model, () => 
    runWithRetry(async () => {
      const ai = getClient();
      
      const mimeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
              text: "Generate optimization metadata for this image."
          }
        ],
        config: {
          systemInstruction: METADATA_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              keywords: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["title", "description", "keywords", "category"]
          }
        }
      });

      const data = parseJSON<StockMetadata>(response.text);
      if (!data) throw new Error("Received malformed JSON for metadata");
      return data;
    })
  );
};
