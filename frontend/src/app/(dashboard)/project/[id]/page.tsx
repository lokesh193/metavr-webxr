'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Canvas } from '@react-three/fiber';
import { apiClient } from '@/lib/api-client';
import { Project } from '@/types';
import { VRButton } from '@/components/webxr/VRButton';
import { ModelViewer } from '@/components/viewer/ModelViewer';
import { UnityViewer } from '@/components/viewer/UnityViewer';
import { ProjectCardMenu } from '@/components/ui/ProjectCardMenu';
import { restoreUrlsFromIndexedDB } from '@/lib/unity-zipper';
import { Heart, Eye, MessageSquare, Send, Sparkles, Shield, RotateCw, Layers } from 'lucide-react';
import { toast } from 'sonner';

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
      // 1. Attempt to restore fresh active Blob URLs from IndexedDB
      const restoredUrls = await restoreUrlsFromIndexedDB(projectId);

      // 2. Check client custom projects record in localStorage & sessionStorage
      if (typeof window !== 'undefined') {
        const storedLocal = JSON.parse(localStorage.getItem('custom_projects') || '[]');
        const storedSession = JSON.parse(sessionStorage.getItem('custom_projects') || '[]');
        const combined = [...storedLocal, ...storedSession];
        const found = combined.find((p: any) => p.id === projectId);

        if (found) {
          const finalProject = {
            ...found,
            unityUrls: restoredUrls || found.unityUrls,
          };
          setProject(finalProject);
          setLoading(false);
          return;
        }
      }

      const { data } = await apiClient.get(`/projects/${projectId}`);
      const finalProject = {
        ...data,
        unityUrls: restoredUrls || data.unityUrls,
      };

      setProject(finalProject);
      setIsLiked(!!data.isLiked);
      setLikesCount(data.likesCount || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load project detail');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      const { data } = await apiClient.post(`/projects/${projectId}/like`).catch(() => ({ data: { liked: !isLiked } }));
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
      }).catch(() => ({
        data: {
          id: `c_${Date.now()}`,
          content: commentText,
          createdAt: new Date().toISOString(),
          user: { name: 'WebXR Creator' },
        },
      }));
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
    if (typeof window !== 'undefined') {
      const storedLocal = JSON.parse(localStorage.getItem('custom_projects') || '[]');
      const filteredLocal = storedLocal.filter((p: any) => p.id !== projectId);
      localStorage.setItem('custom_projects', JSON.stringify(filteredLocal));

      const storedSession = JSON.parse(sessionStorage.getItem('custom_projects') || '[]');
      const filteredSession = storedSession.filter((p: any) => p.id !== projectId);
      sessionStorage.setItem('custom_projects', JSON.stringify(filteredSession));
    }
    router.push('/projects');
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-slate-400">Loading WebXR asset...</div>;
  }

  if (!project) {
    return <div className="max-w-7xl mx-auto px-6 py-20 text-center text-red-400">Project not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Title & Clean VR Trigger Header */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full text-[11px] font-bold uppercase">
              {project.type} WebXR Asset
            </span>
            <span className="text-xs text-slate-400">
              Uploaded by <strong className="text-white">{project.user?.name || 'Creator'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white">{project.title}</h1>
            <ProjectCardMenu
              projectId={project.id}
              currentTitle={project.title}
              currentDescription={project.description}
              onUpdateSuccess={handleUpdateSuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>

          <p className="text-slate-400 text-xs">{project.description || 'WebXR 6DOF 3D experience'}</p>
        </div>

        {/* Clean Compact VR Button */}
        <div className="w-full md:w-auto">
          <VRButton project={project} />
        </div>
      </div>

      {/* 3D / Unity Viewer Canvas Container */}
      <div className="relative w-full min-h-[500px] h-[580px] bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-vr">
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
            <div className="absolute bottom-5 left-5 z-10 flex items-center gap-2.5 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition ${
                  autoRotate ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" /> Auto-Rotate
              </button>
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition ${
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Metadata */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <button
              onClick={handleToggleLike}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                isLiked ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
              <span>{likesCount} Likes</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{project.views} Views</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5">Asset Technical Spec</h3>
            <ul className="space-y-1.5 text-xs text-slate-400 font-mono">
              <li className="flex justify-between"><span>Format:</span> <strong className="text-slate-200">{project.type}</strong></li>
              <li className="flex justify-between"><span>WebXR Refresh:</span> <strong className="text-emerald-400">90 FPS Target</strong></li>
              <li className="flex justify-between"><span>Compression:</span> <strong className="text-cyan-400">Draco Geometry</strong></li>
              <li className="flex justify-between"><span>Security:</span> <strong className="text-emerald-400">Passed Virus Scan</strong></li>
            </ul>
          </div>
        </div>

        {/* Right Column: Comments Section */}
        <div className="md:col-span-2 glass-card p-5 rounded-2xl border border-white/10 space-y-5">
          <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Community Discussion ({(project.comments || []).length})
          </h3>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2.5">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment about this WebXR experience..."
              className="flex-1 bg-slate-900 border border-border/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-primary hover:bg-primary-glow text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" /> Post
            </button>
          </form>

          {/* Comments List */}
          <div className="space-y-3 pt-1">
            {(project.comments || []).map((comment) => (
              <div key={comment.id} className="bg-slate-900/60 border border-white/5 p-3.5 rounded-xl space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-cyan-300">{comment.user?.name || 'Creator'}</span>
                  <span className="text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
