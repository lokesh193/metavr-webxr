'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Project } from '@/types';
import { Glasses, Eye, Heart, UserPlus, Check, Share2, Globe, Sparkles, Grid, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface CreatorProfile {
  id: string;
  name: string;
  image: string;
  bio: string;
  website: string;
  followersCount: number;
  totalProjects: number;
  totalViews: number;
  totalLikes: number;
  isFollowing: boolean;
}

export default function PublicCreatorPage() {
  const params = useParams();
  const creatorId = params.id as string;

  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    fetchCreatorProfile();
  }, [creatorId]);

  const fetchCreatorProfile = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/creator/${creatorId}`);
      setCreator(data.creator);
      setProjects(data.projects || []);
      setIsFollowing(!!data.creator.isFollowing);
      setFollowersCount(data.creator.followersCount || 0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const { data } = await apiClient.post(`/creator/${creatorId}/follow`);
      setIsFollowing(data.following);
      setFollowersCount((prev) => (data.following ? prev + 1 : prev - 1));
      toast.success(data.following ? `Now following ${creator?.name}!` : `Unfollowed ${creator?.name}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Sign in to follow creators');
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Creator profile link copied to clipboard for students!');
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-slate-400">Loading creator showcase...</div>;
  }

  if (!creator) {
    return <div className="max-w-6xl mx-auto px-6 py-20 text-center text-red-400">Creator profile not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      {/* Instagram-Style Header Card */}
      <div className="glass-card p-8 md:p-12 rounded-3xl border border-white/10 shadow-vr relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
          {/* Avatar with Glowing Instagram Story Ring */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-rose-500 via-purple-500 to-cyan-400 shadow-vr animate-pulse-slow">
              <img
                src={creator.image}
                alt={creator.name}
                className="w-full h-full object-cover rounded-full border-4 border-slate-950"
              />
            </div>
            <div className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-cyan-400 border-2 border-slate-950 flex items-center justify-center text-slate-950 font-extrabold text-xs shadow-lg">
              ✓
            </div>
          </div>

          {/* Creator Details */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{creator.name}</h1>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleFollow}
                  className={`px-6 py-2.5 rounded-xl font-extrabold text-sm flex items-center gap-2 transition shadow-lg ${
                    isFollowing
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10'
                      : 'bg-gradient-to-r from-primary to-secondary hover:from-purple-600 hover:to-cyan-500 text-white shadow-vr'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" /> Follow Creator
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyShareLink}
                  className="p-2.5 glass-card hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-white/10 transition"
                  title="Share Profile Link with Students"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Instagram Statistics Row */}
            <div className="flex items-center justify-center md:justify-start gap-8 py-2 text-sm">
              <div>
                <strong className="text-white font-extrabold text-lg block">{creator.totalProjects}</strong>
                <span className="text-xs text-slate-400 uppercase font-semibold">WebXR Projects</span>
              </div>
              <div>
                <strong className="text-white font-extrabold text-lg block">{followersCount}</strong>
                <span className="text-xs text-slate-400 uppercase font-semibold">Students / Followers</span>
              </div>
              <div>
                <strong className="text-white font-extrabold text-lg block">{creator.totalViews}</strong>
                <span className="text-xs text-slate-400 uppercase font-semibold">VR Headset Views</span>
              </div>
              <div>
                <strong className="text-white font-extrabold text-lg block">{creator.totalLikes}</strong>
                <span className="text-xs text-slate-400 uppercase font-semibold">Total Likes</span>
              </div>
            </div>

            {/* Bio & Link */}
            <div className="space-y-1 max-w-xl">
              <p className="text-sm text-slate-300 leading-relaxed font-medium">{creator.bio}</p>
              {creator.website && (
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-semibold pt-1"
                >
                  <Globe className="w-3.5 h-3.5" /> {creator.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Header Filter */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Grid className="w-5 h-5 text-primary" /> WebXR Projects & Unity Builds
        </h2>
        <span className="text-xs text-slate-400 font-mono">
          Showing {projects.length} public asset showcase entries
        </span>
      </div>

      {/* Instagram-Style Media Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-slate-400 glass-card rounded-3xl border border-white/5">
          No WebXR projects published by this creator yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group relative glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-primary/60 transition duration-300 aspect-square flex flex-col justify-end shadow-lg"
            >
              {/* Media Thumbnail */}
              <img
                src={project.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}
                alt={project.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-500"
              />

              {/* Type Badge */}
              <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-[11px] font-bold text-cyan-300 border border-cyan-400/30">
                {project.type}
              </div>

              {/* Hover Dark Overlay with Stats */}
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
          ))}
        </div>
      )}
    </div>
  );
}
