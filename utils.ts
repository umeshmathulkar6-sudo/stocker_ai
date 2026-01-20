
// --- Image File Processing ---
export const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) {
        reject(new Error("File size too large (Max 10MB)"));
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      
      if (file.type === 'image/svg+xml') {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
           const canvas = document.createElement('canvas');
           canvas.width = img.width || 2048;
           canvas.height = img.height || 2048;
           const ctx = canvas.getContext('2d');
           if (ctx) {
             ctx.fillStyle = '#FFFFFF';
             ctx.fillRect(0, 0, canvas.width, canvas.height);
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
             resolve(canvas.toDataURL('image/png'));
           } else {
             reject(new Error("Browser capability error: Canvas context missing"));
           }
        };
        img.onerror = () => reject(new Error("Failed to parse SVG file"));
        img.src = result;
      } else {
        resolve(result);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

/**
 * Triggers a browser download for a given URL
 */
export const downloadUrl = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

/**
 * PRO-GRADE FREQUENCY SEPARATION ENGINE
 * ... (Existing implementation remains unchanged) ...
 */
const applyProEngine = (ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number = 1.0) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const w = width;
  const h = height;
  
  const copy = new Uint8ClampedArray(data);

  const sharpenAmount = 0.6 * intensity; 
  const structureAmount = 0.3 * intensity; 
  const grainAmount = 8.0; 
  
  const idx = (x: number, y: number) => (y * w + x) * 4;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = idx(x, y);

      const up = idx(x, y - 1);
      const down = idx(x, y + 1);
      const left = idx(x - 1, y);
      const right = idx(x + 1, y);
      
      const up2 = idx(x, Math.max(0, y - 2));
      const down2 = idx(x, Math.min(h - 1, y + 2));
      const left2 = idx(Math.max(0, x - 2), y);
      const right2 = idx(Math.min(w - 1, x + 2), y);

      const luma = (copy[i] * 0.299 + copy[i + 1] * 0.587 + copy[i + 2] * 0.114) / 255;
      
      const grainMask = 4.0 * luma * (1.0 - luma); 
      const noise = (Math.random() - 0.5) * grainAmount * grainMask;

      for (let c = 0; c < 3; c++) {
        const val = copy[i + c];
        
        const neighbors = copy[up + c] + copy[down + c] + copy[left + c] + copy[right + c];
        const blur = neighbors * 0.25;
        const highPass = val - blur;
        
        const wideNeighbors = copy[up2 + c] + copy[down2 + c] + copy[left2 + c] + copy[right2 + c];
        const wideBlur = wideNeighbors * 0.25;
        const midPass = val - wideBlur;

        let final = val;
        
        final += highPass * sharpenAmount * 2.0;
        final += midPass * structureAmount;
        final += noise;

        data[i + c] = Math.max(0, Math.min(255, final));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
};

// --- Algorithmic Super-Resolution ---
export const upscaleImage = async (base64Str: string, targetMP: number = 4, format: 'png' | 'jpeg' = 'png'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; 
    
    img.onload = () => {
      const currentPixels = img.width * img.height;
      const targetPixels = targetMP * 1000000;
      
      let targetWidth = img.width;
      let targetHeight = img.height;
      let performUpscale = false;

      if (targetMP > 0 && currentPixels < targetPixels) {
          performUpscale = true;
          const scale = Math.sqrt(targetPixels / currentPixels);
          targetWidth = Math.floor(img.width * scale);
          targetHeight = Math.floor(img.height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) { 
        reject(new Error("Canvas context unavailable")); 
        return; 
      }
      
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      if (performUpscale || format === 'jpeg') {
          try {
             const upscaleFactor = targetWidth / img.width;
             const intensity = Math.min(1.5, Math.max(0.8, upscaleFactor * 0.5));
             applyProEngine(ctx, targetWidth, targetHeight, intensity);
          } catch (e) {
             console.warn("Enhancement engine failed (likely cross-origin or memory).", e);
          }
      }
      
      try {
          const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
          const quality = format === 'jpeg' ? 0.98 : 1.0;
          const dataUrl = canvas.toDataURL(mime, quality);
          resolve(dataUrl);
      } catch (e) {
          reject(new Error("Failed to encode image format"));
      }
    };
    
    img.onerror = () => reject(new Error("Failed to load image for processing"));
    img.src = base64Str;
  });
};
