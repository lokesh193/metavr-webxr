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
    if (!config.loaderUrl) {
      return reject(new Error('Unity loader URL missing'));
    }

    // Assign explicit canvas ID required by Unity's _JS_SystemInfo_GetCanvasClientSize
    if (!canvas.id) {
      canvas.id = 'unity-canvas';
    }

    // Reuse existing loader script if present
    let script = document.querySelector(`script[src="${config.loaderUrl}"]`) as HTMLScriptElement;

    const initialize = () => {
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
              if (config.onProgress) config.onProgress(progress);
            }
          )
          .then((unityInstance: any) => {
            (window as any).unityInstance = unityInstance;
            resolve(unityInstance);
          })
          .catch((err: any) => reject(err));
      } else {
        reject(new Error('createUnityInstance function not found on window object'));
      }
    };

    if (script) {
      initialize();
    } else {
      script = document.createElement('script');
      script.src = config.loaderUrl;
      script.onload = () => initialize();
      script.onerror = () => reject(new Error(`Failed to load Unity loader script from ${config.loaderUrl}`));
      document.body.appendChild(script);
    }
  });
}
