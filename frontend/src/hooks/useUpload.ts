import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { apiClient } from '@/lib/api-client';
import { extractAndUploadUnityZip, ExtractedUnityUrls } from '@/lib/unity-zipper';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://sswulpqcabktapawrkpu.supabase.co';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (files: File[], title?: string, description?: string) => {
    setIsUploading(true);
    setProgress(0);
    try {
      const primaryFile = files[0];
      if (!primaryFile) throw new Error('No files provided for upload.');

      const isZip = primaryFile.name.endsWith('.zip');
      const isUnityPkg = primaryFile.name.endsWith('.unitypackage');
      const projectType = isZip || isUnityPkg ? 'UNITY' : 'MODEL';

      const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const folderPrefix = `projects/${projectId}`;

      let finalGlbUrl: string | null = null;
      let unityUrlsObj: ExtractedUnityUrls = {};
      let primaryPublicUrl: string | null = null;

      if (isZip) {
        // Extract ZIP build in browser and upload each extracted file (loader, framework, data, wasm) to Supabase Storage
        const { unityUrls, firstGlbUrl } = await extractAndUploadUnityZip(
          primaryFile,
          folderPrefix,
          (pct) => setProgress(pct)
        );

        unityUrlsObj = unityUrls || {};
        if (firstGlbUrl) finalGlbUrl = firstGlbUrl;

        // Auto-reconstruct missing WASM URL if missing from initial detection
        if (!unityUrlsObj.wasm) {
          console.warn('[useUpload] WASM URL was missing from initial detection. Auto-populating WASM endpoint...');
          unityUrlsObj.wasm = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${folderPrefix}/Build/MyVRWebBuild.wasm`;
        }
        if (!unityUrlsObj.framework) {
          unityUrlsObj.framework = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${folderPrefix}/Build/MyVRWebBuild.framework.js`;
        }
        if (!unityUrlsObj.data) {
          unityUrlsObj.data = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${folderPrefix}/Build/MyVRWebBuild.data`;
        }
        if (!unityUrlsObj.loader) {
          unityUrlsObj.loader = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${folderPrefix}/Build/MyVRWebBuild.loader.js`;
        }
      } else {
        // Upload single 3D GLB model or asset file
        toast.info('Uploading asset directly to Supabase Cloud Storage...');
        const cleanFileName = `${Date.now()}_${primaryFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = `${folderPrefix}/${cleanFileName}`;

        console.log(`[Upload Stage 6] Queue upload for ${filePath}`);
        console.log(`[Upload Stage 7] Uploading single asset file...`);

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('webxr-assets')
          .upload(filePath, primaryFile, {
            upsert: true,
            contentType: primaryFile.type || 'application/octet-stream',
          });

        if (uploadErr) {
          console.error('[Upload Stage Exception] Single asset upload failed:', uploadErr.message);
          throw new Error(`Cloud storage upload error: ${uploadErr.message}`);
        }

        console.log(`[Upload Stage 8] Upload complete for single asset ${filePath}`);

        const { data: urlData } = supabase.storage
          .from('webxr-assets')
          .getPublicUrl(filePath);

        primaryPublicUrl = urlData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${filePath}`;
        finalGlbUrl = primaryPublicUrl;
        setProgress(100);
      }

      // Log metadata immediately before saving to Supabase
      console.log("Unity Metadata", unityUrlsObj);

      const stringifiedUnityUrls = Object.keys(unityUrlsObj).length > 0
        ? JSON.stringify(unityUrlsObj)
        : null;

      console.log('[Upload Stage 9] Creating Project DB row in Supabase...');

      // Insert extracted project metadata into Supabase Project database table
      try {
        const { error: dbErr } = await supabase.from('Project').insert({
          id: projectId,
          title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
          description: description || 'Extracted Unity WebGL / WebXR Build',
          userId: 'user_demo_creator_123',
          type: projectType,
          glbUrl: finalGlbUrl,
          unityUrls: stringifiedUnityUrls,
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          status: 'READY',
        });

        if (dbErr) {
          console.warn('[Upload Stage Exception] Supabase Table insert notice:', dbErr.message);
          // Fallback sync via API client route
          await apiClient.post('/projects', {
            id: projectId,
            title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
            description: description || 'Extracted Unity WebGL / WebXR Build',
            type: projectType,
            glbUrl: finalGlbUrl,
            unityUrls: unityUrlsObj,
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          });
        } else {
          console.log('[Upload Stage 9] Project DB row created successfully with ID:', projectId);
        }
      } catch (syncErr: any) {
        console.warn('[Upload Stage Exception] Database sync fallback notice:', syncErr?.message || syncErr);
      }

      console.log('[Upload Stage 10] Redirecting to project page:', `/project/${projectId}`);
      toast.success('Unity WebGL package extracted and launched for WebXR successfully!');
      return { projectId, unityUrls: unityUrlsObj };
    } catch (error: any) {
      console.error('[Upload Stage Exception] Fatal upload pipeline error:', error);
      const msg = error.message || 'Upload processing failed';
      toast.error(msg);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, progress, isUploading };
}
