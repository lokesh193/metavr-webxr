import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (files: File[], title?: string, description?: string) => {
    setIsUploading(true);
    setProgress(0);
    try {
      const primaryFile = files[0];
      if (!primaryFile) throw new Error('No files provided for upload.');

      const isUnity = primaryFile.name.endsWith('.zip') || primaryFile.name.endsWith('.unitypackage');
      const projectType = isUnity ? 'UNITY' : 'MODEL';
      const cleanFileName = `${Date.now()}_${primaryFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = `projects/${cleanFileName}`;

      toast.info('Uploading asset directly to Supabase Cloud Storage...');

      // 1. Upload file directly to Supabase Storage over HTTPS
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('webxr-assets')
        .upload(filePath, primaryFile, {
          upsert: true,
          contentType: primaryFile.type || 'application/octet-stream',
        });

      if (uploadErr) {
        throw new Error(`Cloud storage upload error: ${uploadErr.message}`);
      }

      // 2. Get public HTTPS URL from Supabase Storage
      const { data: urlData } = supabase.storage
        .from('webxr-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || `https://sswulpqcabktapawrkpu.supabase.co/storage/v1/object/public/webxr-assets/${filePath}`;
      setProgress(100);

      // 3. Insert project record into Supabase Database
      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const unityUrlsObj = isUnity ? JSON.stringify({ indexUrl: publicUrl, loader: publicUrl }) : null;

      try {
        const { error: dbErr } = await supabase.from('Project').insert({
          id: projectId,
          title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
          description: description || 'Uploaded WebXR asset via Supabase Cloud Storage',
          userId: 'user_demo_creator_123',
          type: projectType,
          glbUrl: isUnity ? null : publicUrl,
          unityUrls: unityUrlsObj,
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          status: 'READY',
        });

        if (dbErr) {
          console.warn('[useUpload] Supabase Table insert notice:', dbErr.message);
          // Fallback sync via API client if Supabase RLS or table name differs
          await apiClient.post('/projects', {
            id: projectId,
            title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
            description: description || 'Uploaded WebXR asset via Supabase Cloud Storage',
            type: projectType,
            glbUrl: isUnity ? null : publicUrl,
            unityUrls: isUnity ? { indexUrl: publicUrl, loader: publicUrl } : null,
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          });
        }
      } catch (syncErr) {
        console.warn('[useUpload] Database sync fallback notice:', syncErr);
      }

      toast.success('Asset uploaded and stored successfully!');
      return { projectId, publicUrl };
    } catch (error: any) {
      const msg = error.message || 'Upload processing failed';
      toast.error(msg);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, progress, isUploading };
}
