'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Project } from '@/types';
import { Search, Glasses, Eye, Heart, Filter, Sparkles } from 'lucide-react';
import { ProjectCardMenu } from '@/components/ui/ProjectCardMenu';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'MODEL' | 'UNITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [filterType]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      let url = '/projects';
      if (filterType !== 'ALL') url += `?type=${filterType}`;
      const { data } = await apiClient.get(url);
      setProjects(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const filteredProjects = projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card p-8 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            WebXR 3D & Unity Showcase <Sparkles className="w-6 h-6 text-cyan-400" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">Explore 6DOF GLB models and streaming Unity WebGL builds</p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3D assets..."
              className="w-full bg-slate-900 border border-border/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-border/80 p-1 rounded-xl gap-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'ALL' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('MODEL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'MODEL' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              GLB Models
            </button>
            <button
              onClick={() => setFilterType('UNITY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterType === 'UNITY' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unity WebGL
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading WebXR catalog...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 text-slate-400">No matching 3D assets found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition group flex flex-col hover:-translate-y-1 shadow-lg relative"
            >
              {/* 3-Dot Options Menu */}
              <div className="absolute top-3 right-3 z-30">
                <ProjectCardMenu
                  projectId={project.id}
                  currentTitle={project.title}
                  currentDescription={project.description}
                  onUpdateSuccess={(updated) => handleUpdateSuccess(project.id, updated)}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              </div>

              <Link href={`/project/${project.id}`} className="block relative h-56 bg-slate-950 overflow-hidden">
                <img
                  src={project.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-cyan-300 border border-cyan-400/30">
                  {project.type}
                </div>
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-primary/90 backdrop-blur-md rounded-full text-xs font-bold text-white flex items-center gap-1 shadow-vr">
                  <Glasses className="w-3.5 h-3.5" /> VR Ready
                </div>
              </Link>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <Link href={`/project/${project.id}`} className="block">
                  <h3 className="font-extrabold text-xl text-white group-hover:text-primary transition line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {project.description || 'Interactive 6DOF WebXR asset'}
                  </p>
                </Link>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-cyan-400" /> {project.views} views</span>
                  <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-rose-400" /> {project.likesCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
