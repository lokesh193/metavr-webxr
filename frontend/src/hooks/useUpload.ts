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

      // Direct upload to Supabase Storage over HTTPS
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('webxr-assets')
        .upload(filePath, primaryFile, {
          upsert: true,
          contentType: primaryFile.type || 'application/octet-stream',
        });

      if (uploadErr) {
        throw new Error(`Cloud storage upload failed: ${uploadErr.message}`);
      }

      // Get public HTTPS URL from Supabase Storage
      const { data: urlData } = supabase.storage
        .from('webxr-assets')
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || `https://sswulpqcabktapawrkpu.supabase.co/storage/v1/object/public/webxr-assets/${filePath}`;

      setProgress(100);

      // Post project metadata
      let projectId = `proj_${Date.now()}`;
      try {
        const { data: projectData } = await apiClient.post('/projects', {
          title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
          description: description || 'Uploaded WebXR asset via Supabase Cloud Storage',
          type: projectType,
          glbUrl: isUnity ? null : publicUrl,
          unityUrls: isUnity ? { indexUrl: publicUrl, loader: publicUrl } : null,
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        });
        if (projectData?.id) projectId = projectData.id;
      } catch (e) {
        console.warn('[useUpload] API metadata sync notice:', e);
      }

      toast.success('Asset uploaded and launched for WebXR successfully!');
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
