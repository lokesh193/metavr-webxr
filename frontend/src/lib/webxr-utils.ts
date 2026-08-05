export interface DeviceXRMatrix {
  supported: boolean;
  handTrackingSupported: boolean;
  eyeTrackingSupported: boolean;
  passthroughSupported: boolean;
  deviceType: 'VR_HEADSET' | 'APPLE_VISION_PRO' | 'DESKTOP' | 'MOBILE';
  hardwareName: string;
}

export async function checkWebXRSupport(): Promise<DeviceXRMatrix> {
  if (typeof window === 'undefined' || !('xr' in navigator)) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    return {
      supported: false,
      handTrackingSupported: false,
      eyeTrackingSupported: false,
      passthroughSupported: false,
      deviceType: isMobile ? 'MOBILE' : 'DESKTOP',
      hardwareName: isMobile ? 'Mobile Browser' : 'Desktop Browser',
    };
  }

  try {
    const supported = await (navigator as any).xr.isSessionSupported('immersive-vr');
    const ua = navigator.userAgent;

    let deviceType: 'VR_HEADSET' | 'APPLE_VISION_PRO' | 'DESKTOP' | 'MOBILE' = 'VR_HEADSET';
    let hardwareName = 'WebXR 6DOF Headset (Quest / Vive / Index / Pico / WMR)';

    if (ua.includes('Oculus') || ua.includes('Quest')) {
      hardwareName = 'Meta Quest Headset';
    } else if (ua.includes('Vision') || (ua.includes('Macintosh') && 'ontouchend' in document)) {
      hardwareName = 'Apple Vision Pro';
      deviceType = 'APPLE_VISION_PRO';
    } else if (ua.includes('Pico')) {
      hardwareName = 'Pico VR Headset';
    } else if (ua.includes('HTC') || ua.includes('Vive')) {
      hardwareName = 'HTC Vive Headset';
    }

    let handTrackingSupported = false;
    let eyeTrackingSupported = false;
    let passthroughSupported = false;

    if (supported) {
      try {
        handTrackingSupported = await (navigator as any).xr.isSessionSupported('immersive-vr', {
          requiredFeatures: ['hand-tracking'],
        });
      } catch (e) {
        handTrackingSupported = false;
      }
    }

    return {
      supported,
      handTrackingSupported,
      eyeTrackingSupported,
      passthroughSupported,
      deviceType,
      hardwareName,
    };
  } catch (error) {
    return {
      supported: false,
      handTrackingSupported: false,
      eyeTrackingSupported: false,
      passthroughSupported: false,
      deviceType: 'DESKTOP',
      hardwareName: 'Desktop Browser (Orbit Fallback)',
    };
  }
}
