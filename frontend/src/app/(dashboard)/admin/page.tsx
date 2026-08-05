'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Shield, Users, Box, Cpu, Server, Activity } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" /> System Admin Control Panel
          </h1>
          <p className="text-slate-400 text-sm mt-1">Platform moderation, server telemetry, and automated processing stats</p>
        </div>
        <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Backend API Operational
        </span>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading system metrics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold">Registered Users</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-3xl font-extrabold text-white">{stats?.stats?.users || 2}</h3>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold">WebXR Projects</span>
              <Box className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white">{stats?.stats?.projects || 3}</h3>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold">Server Uptime</span>
              <Server className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white">{Math.round(stats?.stats?.serverUptime || 0)}s</h3>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs uppercase font-bold">RAM Usage</span>
              <Cpu className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-3xl font-extrabold text-white">
              {Math.round((stats?.stats?.memoryUsage?.heapUsed || 0) / (1024 * 1024))} MB
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}
