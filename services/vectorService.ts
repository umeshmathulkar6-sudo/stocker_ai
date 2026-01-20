
// Validated CDN sources for ImageTracer 1.2.6
const VECTOR_ENGINE_SOURCES = [
  'https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/imagetracer_v1.2.6.js',
  'https://unpkg.com/imagetracerjs@1.2.6/imagetracer_v1.2.6.js',
  'https://cdn.jsdelivr.net/gh/jankovicsandras/imagetracerjs@master/imagetracer_v1.2.6.js'
];

let vectorEnginePromise: Promise<void> | null = null;

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load ${src}`));
    };
    
    document.head.appendChild(script);
  });
};

const waitForGlobal = (maxAttempts = 20): Promise<void> => {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.ImageTracer) {
        clearInterval(interval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        reject(new Error('Script loaded but ImageTracer global not found'));
      }
    }, 100);
  });
};

export const loadVectorEngine = (): Promise<void> => {
  if (typeof window !== 'undefined' && window.ImageTracer) {
    return Promise.resolve();
  }

  if (vectorEnginePromise) {
    return vectorEnginePromise;
  }

  vectorEnginePromise = (async () => {
    for (const src of VECTOR_ENGINE_SOURCES) {
      try {
        await loadScript(src);
        await waitForGlobal();
        console.log(`Vector engine loaded successfully from ${src}`);
        return;
      } catch (e) {
        console.warn(`Vector engine source failed: ${src}`, e);
      }
    }
    throw new Error("Failed to load vector engine from all available sources.");
  })();

  vectorEnginePromise.catch(() => {
    vectorEnginePromise = null;
  });

  return vectorEnginePromise;
};

export const traceImageToSVG = async (imageUrl: string): Promise<string> => {
  await loadVectorEngine();

  if (!window.ImageTracer) {
    throw new Error("Vector engine not ready.");
  }

  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageUrl;
  
  await new Promise((resolve, reject) => {
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error("Failed to load image for processing"));
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context unavailable");
  
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, img.width, img.height);

  // Optimized settings for stock-quality vectors
  const options = {
    colorsampling: 2,
    numberofcolors: 32,
    quantcycles: 3,
    strokewidth: 0,
    ltres: 1,
    qtres: 1,
    pathomit: 8,
    blurradius: 0,
    blurdelta: 20,
    scale: 1,
    viewbox: true,
    desc: false
  };

  return window.ImageTracer.imagedataToSVG(imageData, options);
};
