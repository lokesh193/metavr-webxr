'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Project } from '@/types';
import { Box, Eye, Heart, Glasses, Upload, Plus, Sparkles } from 'lucide-react';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/projects')
      .then((res) => {
        setProjects(res.data.data || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const totalViews = projects.reduce((acc, p) => acc + p.views, 0);
  const totalLikes = projects.reduce((acc, p) => acc + p.likesCount, 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-8 rounded-3xl border border-white/10">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            Creator Dashboard <Sparkles className="w-6 h-6 text-cyan-400" />
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage your WebXR 3D assets, views, and Unity WebGL builds</p>
        </div>
        <Link
          href="/upload"
          className="px-6 py-3.5 bg-primary hover:bg-primary-glow text-white font-extrabold rounded-xl shadow-vr flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-5 h-5" /> Upload New Asset
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Projects</p>
            <h3 className="text-2xl font-extrabold text-white">{projects.length}</h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/20 text-secondary flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">WebXR Views</p>
            <h3 className="text-2xl font-extrabold text-white">{totalViews}</h3>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Likes</p>
            <h3 className="text-2xl font-extrabold text-white">{totalLikes}</h3>
          </div>
        </div>
      </div>

      {/* Recent Projects Gallery */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-white">Your WebXR Projects</h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading project telemetry...</div>
        ) : projects.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center border border-white/5 space-y-4">
            <Upload className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No 3D projects uploaded yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Upload your first GLB 3D model or Unity WebGL build to launch in WebXR.
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl"
            >
              Upload Asset Now
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition group flex flex-col"
              >
                <div className="relative h-48 bg-slate-900 overflow-hidden">
                  <img
                    src={project.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-cyan-400 border border-cyan-400/30">
                    {project.type}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {project.description || 'WebXR 6DOF asset'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/5">
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {project.views}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {project.likesCount}</span>
                    <span className="text-primary font-bold flex items-center gap-1"><Glasses className="w-3.5 h-3.5" /> Launch VR</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
