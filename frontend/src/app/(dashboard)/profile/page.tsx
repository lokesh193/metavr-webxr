'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { User, Project } from '@/types';
import { User as UserIcon, Share2, Globe, Eye, Heart, Glasses, Plus, Edit3, Grid } from 'lucide-react';
import { ProjectCardMenu } from '@/components/ui/ProjectCardMenu';
import { toast } from 'sonner';

export default function CreatorProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [userRes, projectsRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/projects'),
      ]);
      setUser(userRes.data);
      setProjects(projectsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareProfile = () => {
    if (user?.id && typeof window !== 'undefined') {
      const shareUrl = `${window.location.origin}/creator/${user.id}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success('Public Creator Profile link copied to clipboard!');
    }
  };

  const handleUpdateSuccess = (projectId: string, updated: { title: string; description?: string }) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, title: updated.title, description: updated.description } : p))
    );
  };

  const handleDeleteSuccess = (deletedId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const totalViews = projects.reduce((acc, p) => acc + p.views, 0);
  const totalLikes = projects.reduce((acc, p) => acc + p.likesCount, 0);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-slate-400">Loading creator profile...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      {/* Instagram-Style Header Card */}
      <div className="glass-card p-8 md:p-12 rounded-3xl border border-white/10 shadow-vr relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar Ring */}
          <div className="relative">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-400 shadow-vr">
              <img
                src={user?.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80'}
                alt={user?.name || 'Creator'}
                className="w-full h-full object-cover rounded-full border-4 border-slate-950"
              />
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <h1 className="text-3xl font-extrabold text-white">{user?.name || 'WebXR Creator'}</h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleShareProfile}
                  className="px-5 py-2 bg-primary hover:bg-primary-glow text-white font-extrabold text-xs rounded-xl shadow-vr flex items-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4" /> Share Student Link
                </button>
                {user?.id && (
                  <Link
                    href={`/creator/${user.id}`}
                    className="px-4 py-2 glass-card hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-white/10 transition"
                  >
                    View Public Page
                  </Link>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="flex items-center justify-center md:justify-start gap-8 py-2 text-sm">
              <div>
                <strong className="text-white font-extrabold text-lg block">{projects.length}</strong>
                <span className="text-xs text-slate-400 uppercase font-semibold">WebXR Projects</span>
              </div>
              <div>
                <strong className="text-white font-extrabold text-lg block">{totalViews}</strong>
                <span className="text-xs text-slate-400 uppercase font-semibold">Student Views</span>
              </div>
              <div>
                <strong className="text-white font-extrabold text-lg block">{totalLikes}</strong>
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Likes</span>
              </div>
            </div>

            <p className="text-sm text-slate-300 max-w-xl">
              3D WebXR Creator & Unity Developer. Sharing immersive 6DOF virtual reality projects with students and creators.
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded Portfolio Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-cyan-400" /> My Published 3D/VR Assets
          </h2>
          <Link
            href="/upload"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 text-primary" /> Upload New Project
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 text-slate-400 glass-card rounded-3xl">
            No projects uploaded yet. Click "Upload New Project" to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/60 transition duration-300 aspect-square flex flex-col justify-end shadow-lg"
              >
                {/* 3-Dot Menu */}
                <div className="absolute top-3 right-3 z-30">
                  <ProjectCardMenu
                    projectId={project.id}
                    currentTitle={project.title}
                    currentDescription={project.description}
                    onUpdateSuccess={(updated) => handleUpdateSuccess(project.id, updated)}
                    onDeleteSuccess={handleDeleteSuccess}
                  />
                </div>

                <Link href={`/project/${project.id}`} className="absolute inset-0">
                  <img
                    src={project.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />

                  <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[11px] font-bold text-cyan-300 border border-cyan-400/30">
                    {project.type}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300 flex flex-col justify-end p-5 z-10">
                    <h3 className="font-extrabold text-lg text-white group-hover:text-primary transition line-clamp-1 mb-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-3">
                      {project.description || 'Interactive 6DOF WebXR asset'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-white/10 font-medium">
                      <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-cyan-400" /> {project.views}</span>
                      <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-rose-400" /> {project.likesCount}</span>
                      <span className="text-primary font-extrabold flex items-center gap-1">
                        <Glasses className="w-4 h-4" /> Enter VR
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
