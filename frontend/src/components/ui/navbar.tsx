'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Box, Upload, LayoutDashboard, Shield, User as UserIcon, LogOut, Compass } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-vr group-hover:scale-105 transition">
          <Box className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-purple-400">
            META<span className="text-primary">VR</span>
          </span>
          <span className="text-[10px] block font-semibold text-secondary tracking-widest uppercase">
            Hybrid Platform
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-6 text-sm font-medium">
        <Link
          href="/projects"
          className={`flex items-center gap-2 hover:text-primary transition ${
            pathname === '/projects' ? 'text-primary font-bold' : 'text-slate-300'
          }`}
        >
          <Compass className="w-4 h-4" /> Explore 3D/VR
        </Link>
        <Link
          href="/upload"
          className={`flex items-center gap-2 hover:text-primary transition ${
            pathname === '/upload' ? 'text-primary font-bold' : 'text-slate-300'
          }`}
        >
          <Upload className="w-4 h-4" /> Upload Build
        </Link>
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 hover:text-primary transition ${
            pathname === '/dashboard' ? 'text-primary font-bold' : 'text-slate-300'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <Link
          href="/admin"
          className={`flex items-center gap-2 hover:text-primary transition ${
            pathname === '/admin' ? 'text-primary font-bold' : 'text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" /> Admin
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {token ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="w-9 h-9 rounded-full bg-slate-800 border border-purple-500/40 flex items-center justify-center text-slate-300 hover:text-white hover:border-primary transition"
            >
              <UserIcon className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg flex items-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-bold bg-primary hover:bg-primary-glow text-white rounded-lg shadow-vr hover:scale-105 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
