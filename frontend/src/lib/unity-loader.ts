export interface UnityConfig {
  loaderUrl: string;
  frameworkUrl: string;
  dataUrl: string;
  wasmUrl: string;
  indexUrl?: string;
  onProgress?: (progress: number) => void;
}

export function loadUnityInstance(
  canvas: HTMLCanvasElement,
  config: UnityConfig
): Promise<any> {
  return new Promise(async (resolve, reject) => {
    console.log('[Unity Stage 1] loaderUrl resolved:', config.loaderUrl);
    console.log('[Unity Stage 2] frameworkUrl resolved:', config.frameworkUrl);
    console.log('[Unity Stage 3] dataUrl resolved:', config.dataUrl);
    console.log('[Unity Stage 4] wasmUrl resolved:', config.wasmUrl);

    if (!config.loaderUrl && !config.indexUrl) {
      const err = new Error('Unity loader URL missing');
      console.error('[Unity Stage Error]', err);
      return reject(err);
    }

    // Stage 1: Load and execute loader.js script tag dynamically
    const targetLoaderUrl = config.loaderUrl || config.indexUrl!;

    const executeCreateInstance = () => {
      console.log('[Unity Stage 3] createUnityInstance called');
      if (typeof (window as any).createUnityInstance === 'function') {
        console.log('[Unity Stage 4] wasm request started:', config.wasmUrl);
        console.log('[Unity Stage 5] data request started:', config.dataUrl);

        (window as any)
          .createUnityInstance(
            canvas,
            {
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
            },
            (progress: number) => {
              console.log(`[Unity Progress] ${(progress * 100).toFixed(1)}%`);
              if (config.onProgress) config.onProgress(progress);
            }
          )
          .then((instance: any) => {
            console.log('[Unity Stage 6] Unity initialized');
            (window as any).unityInstance = instance;
            resolve(instance);
          })
          .catch((err: any) => {
            console.error('[Unity Stage Error] createUnityInstance rejected:', err);
            reject(err);
          });
      } else {
        const err = new Error('createUnityInstance is not defined on window');
        console.error('[Unity Stage Error]', err);
        reject(err);
      }
    };

    // Check if loader script is already injected into DOM
    let existingScript = document.querySelector(`script[src="${targetLoaderUrl}"]`) as HTMLScriptElement;
    if (existingScript) {
      console.log('[Unity Stage 2] loader.js loaded (reusing existing script element)');
      executeCreateInstance();
    } else {
      console.log('[Unity Stage 2] loader.js loading via dynamically created <script> tag...');
      const script = document.createElement('script');
      script.src = targetLoaderUrl;
      script.async = true;
      script.onload = () => {
        console.log('[Unity Stage 2] loader.js loaded successfully');
        executeCreateInstance();
      };
      script.onerror = (e) => {
        const err = new Error(`Failed to load loader script from ${targetLoaderUrl}`);
        console.error('[Unity Stage Error]', err, e);
        reject(err);
      };
      document.body.appendChild(script);
    }
  });
}
