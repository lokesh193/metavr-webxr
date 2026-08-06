import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { processZipClientSide } from '@/lib/unity-zipper';
import { toast } from 'sonner';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (files: File[], title?: string, description?: string) => {
    setIsUploading(true);
    setProgress(0);
    try {
      if (!files || files.length === 0) return;
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();

      // Extract ZIP client-side in memory and save to IndexedDB
      if (ext === 'zip' || ext === 'unitypackage' || file.size > 4 * 1024 * 1024) {
        if (ext === 'zip' || ext === 'unitypackage') {
          toast.info('Extracting Unity WebGL WASM build & indexing binaries...');
          const extracted = await processZipClientSide(file, (pct) => setProgress(pct));

          const projectId = extracted.projectId;
          const newProject = {
            id: projectId,
            title: title || extracted.title || file.name,
            description: description || 'Uploaded WebXR Unity Build',
            type: 'UNITY',
            glbUrl: null,
            unityUrls: extracted.unityUrls,
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            views: 1,
            likesCount: 0,
            createdAt: new Date().toISOString(),
            user: {
              id: 'cmsg96l66000ckded5qlbbupd',
              name: 'WebXR Creator',
              image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
            },
          };

          // Store project record in localStorage & sessionStorage
          if (typeof window !== 'undefined') {
            const existing = JSON.parse(localStorage.getItem('custom_projects') || sessionStorage.getItem('custom_projects') || '[]');
            existing.unshift(newProject);
            localStorage.setItem('custom_projects', JSON.stringify(existing));
            sessionStorage.setItem('custom_projects', JSON.stringify(existing));
          }

          toast.success('Unity WebGL WASM build extracted & indexed successfully!');
          return { projectId, data: newProject };
        }
      }

      // Standard small asset server upload
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);

      const { data } = await apiClient.post('/upload', formData, {
        onUploadProgress: (event) => {
          if (event.total) {
            setProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      toast.success('Asset uploaded and processed successfully!');
      return data;
    } catch (error: any) {
      console.error('[useUpload Error]:', error);
      toast.error(error.message || 'Upload processing failed');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, progress, isUploading };
}
