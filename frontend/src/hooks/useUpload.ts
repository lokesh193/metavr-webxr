import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (files: File[], title?: string, description?: string) => {
    setIsUploading(true);
    setProgress(0);
    try {
      // Auto-authenticate as guest demo user if no token is currently stored
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
    } catch (error: any) {
      const isNetworkOrMixedContent =
        !error.response ||
        error.message?.includes('Network Error') ||
        error.response?.status === 413 ||
        error.response?.status === 500 ||
        error.response?.status === 502;

      const msg = isNetworkOrMixedContent
        ? 'Please use http://localhost:3000/upload to upload full Unity WebGL builds up to 1GB!'
        : error.response?.data?.error || 'Upload failed';

      toast.error(msg);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, progress, isUploading };
}
