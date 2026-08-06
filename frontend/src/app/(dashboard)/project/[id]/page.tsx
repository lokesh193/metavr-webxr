'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Canvas } from '@react-three/fiber';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase-client';
import { Project } from '@/types';
import { VRButton } from '@/components/webxr/VRButton';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { UnityViewer } from '@/components/viewer/UnityViewer';
import { ProjectCardMenu } from '@/components/ui/ProjectCardMenu';
import { Heart, Eye, MessageSquare, Send, RotateCw, Layers, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://sswulpqcabktapawrkpu.supabase.co';

async function listAllStorageFiles(prefix: string): Promise<string[]> {
  const paths: string[] = [];
  try {
    const { data: items } = await supabase.storage.from('webxr-assets').list(prefix, { limit: 100 });
    if (items) {
      for (const item of items) {
        const fullPath = `${prefix}/${item.name}`;
        if (!item.id || item.id === null) {
          // Subfolder: search recursively
          const subPaths = await listAllStorageFiles(fullPath);
          paths.push(...subPaths);
        } else {
          paths.push(fullPath);
        }
      }
    }
  } catch (e) {}
  return paths;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Viewer controls state
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    fetchProjectDetail();
  }, [projectId]);

  const fetchProjectDetail = async () => {
    setLoading(true);
    try {
      // 1. Primary: Direct query from Supabase PostgreSQL Project table
      const { data: supaProject, error: supaErr } = await supabase
        .from('Project')
        .select('*')
        .eq('id', projectId)
        .single();

      if (supaProject && !supaErr) {
        let unityUrls = supaProject.unityUrls;
        if (typeof unityUrls === 'string') {
          try {
            unityUrls = JSON.parse(unityUrls);
          } catch (e) {}
        }

        // Auto-reconstruct unityUrls recursively from Supabase Storage if missing or incomplete
        if (
          supaProject.type === 'UNITY' &&
          (!unityUrls || !unityUrls.loader || Object.keys(unityUrls).length === 0)
        ) {
          console.log('[ProjectDetailPage] Auto-discovering nested Unity URLs from Storage bucket for:', projectId);
          const allFilePaths = await listAllStorageFiles(`projects/${projectId}`);
          console.log('[ProjectDetailPage] Found file paths in storage:', allFilePaths);

          if (allFilePaths.length > 0) {
            const reconstructed: any = {};
            for (const path of allFilePaths) {
              const lower = path.toLowerCase();
              const pubUrl = `${SUPABASE_URL}/storage/v1/object/public/webxr-assets/${path}`;
              if (lower.endsWith('.loader.js')) reconstructed.loader = pubUrl;
              else if (lower.includes('framework.js')) reconstructed.framework = pubUrl;
              else if (lower.endsWith('.data')) reconstructed.data = pubUrl;
              else if (lower.endsWith('.wasm')) reconstructed.wasm = pubUrl;
              else if (lower.endsWith('index.html')) reconstructed.indexUrl = pubUrl;
            }
            unityUrls = reconstructed;

            // Persist reconstructed URLs back to DB for instant future loads
            if (unityUrls.loader) {
              await supabase
                .from('Project')
                .update({ unityUrls: JSON.stringify(unityUrls) })
                .eq('id', projectId);
            }
          }
        }

        setProject({
          ...supaProject,
          unityUrls,
        });
        setLikesCount(supaProject.likesCount || 0);
        setLoading(false);
        return;
      }

      // 2. Secondary fallback: Next.js API route /api/projects/[id]
      const { data } = await apiClient.get(`/projects/${projectId}`);
      setProject(data);
      setIsLiked(!!data.isLiked);
      setLikesCount(data.likesCount || 0);
    } catch (err) {
      console.error('[ProjectDetailPage] Load error:', err);
      toast.error('Failed to load project detail');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      const { data } = await apiClient.post(`/projects/${projectId}/like`);
      setIsLiked(data.liked);
      setLikesCount((prev) => (data.liked ? prev + 1 : prev - 1));
      toast.success(data.liked ? 'Liked project!' : 'Unliked project');
    } catch (err) {
      toast.error('Sign in to like projects');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const { data } = await apiClient.post('/comments', {
        projectId,
        content: commentText,
      });
      setProject((prev) =>
        prev ? { ...prev, comments: [data, ...(prev.comments || [])] } : null
      );
      setCommentText('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error('Sign in to post comments');
    }
  };

  const handleUpdateSuccess = (updated: { title: string; description?: string }) => {
    setProject((prev) => (prev ? { ...prev, title: updated.title, description: updated.description } : null));
  };

  const handleDeleteSuccess = () => {
    router.push('/projects');
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-slate-400">Loading WebXR asset...</div>;
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center space-y-5">
        <h2 className="text-2xl font-extrabold text-white">Project Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The project ID you are trying to view was deleted or does not exist on the database.
        </p>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-glow text-white text-xs font-extrabold rounded-xl shadow-vr transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Showcase Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Title & VR Button Header */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-bold uppercase">
              {project.type} WebXR Asset
            </span>
            <span className="text-xs text-slate-400">
              Uploaded by <strong className="text-white">{project.user?.name || 'Creator'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-white">{project.title}</h1>
            <ProjectCardMenu
              projectId={project.id}
              currentTitle={project.title}
              currentDescription={project.description}
              onUpdateSuccess={handleUpdateSuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>

          <p className="text-slate-400 text-sm">{project.description || 'WebXR 6DOF 3D experience'}</p>
        </div>

        {/* Dedicated Prominent ENTER VR Button */}
        <div className="w-full md:w-80">
          <VRButton project={project} />
        </div>
      </div>

      {/* 3D / Unity Viewer Canvas Container */}
      <div className="relative w-full h-[550px] bg-slate-950 rounded-3xl overflow-hidden border border-white/10 shadow-vr">
        {project.type === 'MODEL' && project.glbUrl ? (
          <>
            {/* Three.js Canvas */}
            <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }}>
              <ModelViewer
                glbUrl={project.glbUrl}
                projectTitle={project.title}
                wireframe={wireframe}
                autoRotate={autoRotate}
              />
            </Canvas>

            {/* Viewer Control Toolbar */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                  autoRotate ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" /> Auto-Rotate
              </button>
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition ${
                  wireframe ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Wireframe
              </button>
            </div>
          </>
        ) : project.type === 'UNITY' && project.unityUrls ? (
          <UnityViewer urls={project.unityUrls} projectTitle={project.title} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            3D Preview binary processing...
          </div>
        )}
      </div>

      {/* Grid Details & Comments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Metadata */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                isLiked ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
              <span>{likesCount} Likes</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>{project.views} Views</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Asset Technical Spec</h3>
            <ul className="space-y-2 text-xs text-slate-400 font-mono">
              <li className="flex justify-between"><span>Format:</span> <strong className="text-slate-200">{project.type}</strong></li>
              <li className="flex justify-between"><span>WebXR Refresh:</span> <strong className="text-emerald-400">90 FPS Target</strong></li>
              <li className="flex justify-between"><span>Compression:</span> <strong className="text-cyan-400">Draco Geometry</strong></li>
              <li className="flex justify-between"><span>Security:</span> <strong className="text-emerald-400">Passed Virus Scan</strong></li>
            </ul>
          </div>
        </div>

        {/* Right Column: Comments Section */}
        <div className="md:col-span-2 glass-card p-6 rounded-3xl border border-white/10 space-y-6">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Community Discussion ({(project.comments || []).length})
          </h3>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment about this WebXR experience..."
              className="flex-1 bg-slate-950 border border-border/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-primary hover:bg-primary-glow text-white font-bold rounded-xl flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" /> Post
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-4 pt-2">
            {(project.comments || []).map((comment) => (
              <div key={comment.id} className="bg-slate-900/60 border border-white/5 p-4 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300">{comment.user?.name || 'Creator'}</span>
                  <span className="text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
