export interface UnityConfig {
  loaderUrl: string;
  frameworkUrl: string;
  dataUrl: string;
  wasmUrl: string;
  onProgress?: (progress: number) => void;
}

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: any,
      onProgress?: (progress: number) => void
    ) => Promise<any>;
  }
}

export async function loadUnityInstance(
  canvas: HTMLCanvasElement,
  config: UnityConfig
): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!config.loaderUrl || !config.loaderUrl.startsWith('http')) {
      return reject(new Error('Unity loader.js script URL is missing or invalid. Please re-upload your Unity build.'));
    }
    if (!config.wasmUrl || !config.wasmUrl.startsWith('http')) {
      return reject(new Error('Unity WebAssembly (.wasm) file URL is missing from project metadata. Please re-upload your Unity build.'));
    }
    if (!config.frameworkUrl || !config.frameworkUrl.startsWith('http')) {
      return reject(new Error('Unity framework.js file URL is missing from project metadata. Please re-upload your Unity build.'));
    }
    if (!config.dataUrl || !config.dataUrl.startsWith('http')) {
      return reject(new Error('Unity data file URL is missing from project metadata. Please re-upload your Unity build.'));
    }

    console.log('[UnityLoader] Starting runtime script loading for:', config);

    // Dynamically inject loader.js script element into DOM
    const script = document.createElement('script');
    script.src = config.loaderUrl;
    script.async = true;

    script.onload = () => {
      console.log('[UnityLoader] loader.js script loaded into DOM.');
      if (!window.createUnityInstance) {
        return reject(new Error('createUnityInstance function not found on window after loading loader.js.'));
      }

      console.log('[UnityLoader] Invoking window.createUnityInstance...');

      const unityConfig = {
        dataUrl: config.dataUrl,
        frameworkUrl: config.frameworkUrl,
        codeUrl: config.wasmUrl,
        streamingAssetsUrl: 'StreamingAssets',
        companyName: 'VRPlatform',
        productName: 'UnityWebGLProject',
        productVersion: '1.0',
        webglContextAttributes: {
          alpha: false,
          depth: true,
          stencil: true,
          antialias: true,
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance',
          failIfMajorPerformanceCaveat: false,
        },
      };

      window
        .createUnityInstance(canvas, unityConfig, (p: number) => {
          if (config.onProgress) config.onProgress(p);
        })
        .then((instance) => {
          console.log('[UnityLoader] createUnityInstance resolved successfully!');
          resolve(instance);
        })
        .catch((err) => {
          console.error('[UnityLoader] createUnityInstance error:', err);
          reject(err);
        });
    };

    script.onerror = (err) => {
      console.error('[UnityLoader] loader.js script load error:', err);
      reject(new Error(`Failed to load Unity loader script from ${config.loaderUrl}`));
    };

    document.body.appendChild(script);
  });
}
