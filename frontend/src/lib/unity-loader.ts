export interface UnityConfig {
  loaderUrl: string;
  frameworkUrl: string;
  dataUrl: string;
  wasmUrl: string;
  onProgress?: (progress: number) => void;
}

export function loadUnityInstance(
  canvas: HTMLCanvasElement,
  config: UnityConfig
): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log('[Unity Stage 1] Loader URL resolved:', config.loaderUrl);
    console.log('[Unity Stage 2] Framework URL resolved:', config.frameworkUrl);
    console.log('[Unity Stage 3] Data URL resolved:', config.dataUrl);
    console.log('[Unity Stage 4] WASM URL resolved:', config.wasmUrl);

    if (!config.loaderUrl) {
      console.error('[Unity Stage Error] Missing loaderUrl in configuration');
      return reject(new Error('Unity loader.js script URL is missing'));
    }

    // Reuse existing loader script if present
    let script = document.querySelector(`script[src="${config.loaderUrl}"]`) as HTMLScriptElement;

    const initialize = () => {
      console.log('[Unity Stage 5] createUnityInstance started');
      if ((window as any).createUnityInstance) {
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
          .then((unityInstance: any) => {
            console.log('[Unity Stage 6] createUnityInstance resolved successfully');
            console.log('[Unity Stage 7] Unity WebGL runtime 100% initialized and rendering');
            (window as any).unityInstance = unityInstance;
            resolve(unityInstance);
          })
          .catch((err: any) => {
            console.error('[Unity Stage Error] createUnityInstance failed:', err);
            reject(err);
          });
      } else {
        const err = new Error('createUnityInstance function not found on window object');
        console.error('[Unity Stage Error]', err);
        reject(err);
      }
    };

    if (script) {
      console.log('[Unity Stage 1.1] Reusing existing loader script element');
      initialize();
    } else {
      console.log('[Unity Stage 1.2] Injecting script tag for loader.js');
      script = document.createElement('script');
      script.src = config.loaderUrl;
      script.onload = () => {
        console.log('[Unity Stage 1.3] loader.js script loaded successfully');
        initialize();
      };
      script.onerror = (e) => {
        const err = new Error(`Failed to load Unity loader script from ${config.loaderUrl}`);
        console.error('[Unity Stage Error]', err, e);
        reject(err);
      };
      document.body.appendChild(script);
    }
  });
}
