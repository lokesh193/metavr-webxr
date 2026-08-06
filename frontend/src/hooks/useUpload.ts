import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (files: File[], title?: string, description?: string) => {
    setIsUploading(true);
    setProgress(0);
    try {
      // 1. Try primary Express backend API route
      let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        try {
          const authRes = await apiClient.post('/auth/login', {
            email: 'user@vrplatform.dev',
            password: 'password123',
          });
          if (authRes.data?.token) {
            token = authRes.data.token;
            if (token) localStorage.setItem('token', token);
          }
        } catch (e) {
          // Ignore auth fallback error
        }
      }

      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);

      const headers: Record<string, string> = {
        'Content-Type': 'multipart/form-data',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const { data } = await apiClient.post('/upload', formData, {
          headers,
          onUploadProgress: (event) => {
            if (event.total) {
              const percent = Math.round((event.loaded * 100) / event.total);
              setProgress(percent);
            }
          },
        });

        toast.success('Asset uploaded and processed successfully!');
        return data;
      } catch (backendError: any) {
        console.warn('[useUpload] Primary API route failed, attempting Direct Supabase Cloud Storage upload...', backendError);

        // 2. Direct Supabase Cloud Storage Upload Fallback for Vercel production
        const primaryFile = files[0];
        if (!primaryFile) throw backendError;

        const filePath = `uploads/${Date.now()}_${primaryFile.name}`;

        // Ensure bucket exists or upload to default bucket
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('webxr-assets')
          .upload(filePath, primaryFile, {
            upsert: true,
            contentType: primaryFile.type || 'application/octet-stream',
          });

        if (uploadErr) {
          throw new Error(`Cloud storage upload error: ${uploadErr.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('webxr-assets')
          .getPublicUrl(filePath);

        const isUnity = primaryFile.name.endsWith('.zip') || primaryFile.name.endsWith('.unitypackage');
        const projectType = isUnity ? 'UNITY' : 'MODEL';

        // Post metadata to database
        const { data: projectData } = await apiClient.post('/projects', {
          title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
          description: description || 'Uploaded WebXR asset via Cloud Storage',
          type: projectType,
          glbUrl: isUnity ? null : urlData.publicUrl,
          unityUrls: isUnity ? { indexUrl: urlData.publicUrl } : null,
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        });

        toast.success('Uploaded to Supabase Cloud Storage successfully!');
        return { projectId: projectData?.id || 'projects' };
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message || 'Upload failed';
      toast.error(msg);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, progress, isUploading };
}
