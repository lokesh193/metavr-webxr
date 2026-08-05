import { create } from 'zustand';
import { Project } from '@/types';

interface VRStore {
  project: Project | null;
  isPresenting: boolean;
  isLoadingVR: boolean;
  webxrSupported: boolean;
  setProject: (project: Project | null) => void;
  setIsPresenting: (isPresenting: boolean) => void;
  setIsLoadingVR: (isLoading: boolean) => void;
  setWebxrSupported: (supported: boolean) => void;
}

export const useVRStore = create<VRStore>((set) => ({
  project: null,
  isPresenting: false,
  isLoadingVR: false,
  webxrSupported: false,
  setProject: (project) => set({ project }),
  setIsPresenting: (isPresenting) => set({ isPresenting }),
  setIsLoadingVR: (isLoadingVR) => set({ isLoadingVR }),
  setWebxrSupported: (webxrSupported) => set({ webxrSupported }),
}));
