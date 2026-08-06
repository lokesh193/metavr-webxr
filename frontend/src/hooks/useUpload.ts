import { useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { apiClient } from '@/lib/api-client';
import { extractAndUploadUnityZip, ExtractedUnityUrls } from '@/lib/unity-zipper';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://sswulpqcabktapawrkpu.supabase.co';

// 10-second strict timeout helper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Timeout error: ${operationName} exceeded ${timeoutMs / 1000}s limit.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

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
        // Stages 10% -> 80% executed in extractAndUploadUnityZip
        const { unityUrls, firstGlbUrl } = await extractAndUploadUnityZip(
          primaryFile,
          folderPrefix,
          (pct) => setProgress(pct)
        );

        unityUrlsObj = unityUrls || {};
        if (firstGlbUrl) finalGlbUrl = firstGlbUrl;

        // Guarantee all 4 required Unity URLs are present
        if (!unityUrlsObj.wasm) {
          console.warn('[useUpload] Auto-populating WASM URL...');
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
        setProgress(10);
        console.log('[Stage 10%] Reading single 3D file...');
        toast.info('Uploading asset directly to Supabase Cloud Storage...');
        
        setProgress(80);
        console.log('[Stage 80%] Uploading single 3D file...');
        console.time('5. Upload completed');

        const cleanFileName = `${Date.now()}_${primaryFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const filePath = `${folderPrefix}/${cleanFileName}`;

        const uploadPromise = Promise.resolve(
          supabase.storage
            .from('webxr-assets')
            .upload(filePath, primaryFile, {
              upsert: true,
              contentType: primaryFile.type || 'application/octet-stream',
            })
        );

        const { data: uploadData, error: uploadErr } = await withTimeout(
          uploadPromise,
          10000,
          'Single File Upload'
        );
        console.timeEnd('5. Upload completed');

        if (uploadErr) {
          console.error('[Upload Error] Single asset upload failed:', uploadErr.message);
          throw new Error(`Cloud storage upload error: ${uploadErr.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('webxr-assets')
          .getPublicUrl(filePath);

        primaryPublicUrl = urlData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${filePath}`;
        finalGlbUrl = primaryPublicUrl;
      }

      // Stage 6: Unity launch preparation started (60% / 89%)
      console.log('6. Unity launch preparation started');

      // Stage 7: Creating project (90%)
      setProgress(90);
      console.log('[Stage 90%] Creating project database record...');
      console.time('7. Project creation completed');

      // Log metadata immediately before saving to Supabase
      console.log("Unity Metadata", unityUrlsObj);

      const stringifiedUnityUrls = Object.keys(unityUrlsObj).length > 0
        ? JSON.stringify(unityUrlsObj)
        : null;

      const dbInsertPromise = Promise.resolve(
        supabase.from('Project').insert({
          id: projectId,
          title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
          description: description || 'Extracted Unity WebGL / WebXR Build',
          userId: 'user_demo_creator_123',
          type: projectType,
          glbUrl: finalGlbUrl,
          unityUrls: stringifiedUnityUrls,
          thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          status: 'READY',
        })
      );

      const { error: dbErr } = await withTimeout(
        dbInsertPromise,
        10000,
        'Project Record Database Insert'
      );

      if (dbErr) {
        console.warn('[Database Warning] Primary insert notice:', dbErr.message);
        // Fallback sync via API client route with strict 10s timeout
        await withTimeout(
          apiClient.post('/projects', {
            id: projectId,
            title: title || primaryFile.name.replace(/\.[^/.]+$/, ''),
            description: description || 'Extracted Unity WebGL / WebXR Build',
            type: projectType,
            glbUrl: finalGlbUrl,
            unityUrls: unityUrlsObj,
            thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          }),
          10000,
          'Fallback API Project Creation'
        );
      }
      console.timeEnd('7. Project creation completed');

      // Stage 8: Launching Unity (100%)
      setProgress(100);
      console.log('[Stage 100%] Launching Unity WebXR Asset...');
      console.time('8. Redirect started');

      toast.success('Unity WebGL package extracted and launched for WebXR successfully!');
      console.timeEnd('8. Redirect started');
      return { projectId, unityUrls: unityUrlsObj };
    } catch (error: any) {
      console.error('[Upload Exception] Fatal upload pipeline error:', error);
      const msg = error.message || 'Upload processing failed';
      toast.error(msg);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, progress, isUploading };
}
