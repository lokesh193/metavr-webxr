'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, X, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface ProjectCardMenuProps {
  projectId: string;
  currentTitle: string;
  currentDescription?: string | null;
  onUpdateSuccess?: (updated: { title: string; description?: string }) => void;
  onDeleteSuccess?: (deletedId: string) => void;
}

export function ProjectCardMenu({
  projectId,
  currentTitle,
  currentDescription,
  onUpdateSuccess,
  onDeleteSuccess,
}: ProjectCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(currentTitle);
  const [newDescription, setNewDescription] = useState(currentDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const { data } = await apiClient.put(`/projects/${projectId}`, {
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      toast.success('Project renamed successfully!');
      if (onUpdateSuccess) onUpdateSuccess(data);
      setIsRenameOpen(false);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to rename project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${currentTitle}"? This action cannot be undone.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/projects/${projectId}`);
      toast.success(`"${currentTitle}" deleted successfully!`);
      if (onDeleteSuccess) onDeleteSuccess(projectId);
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* 3-Dot Trigger Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md border border-white/10 transition shadow-lg"
        title="Project Options"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-2 w-44 rounded-xl bg-slate-900 border border-white/15 shadow-vr z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <button
            onClick={() => {
              setIsRenameOpen(true);
              setIsOpen(false);
            }}
            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-primary flex items-center gap-2.5 transition"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> Rename Project
          </button>
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-400 hover:bg-red-950/50 hover:text-red-300 flex items-center gap-2.5 transition border-t border-white/5"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" /> Delete Project
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {isRenameOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="bg-slate-900 border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-vr space-y-4 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" /> Rename Project
              </h3>
              <button
                onClick={() => setIsRenameOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRename} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-glow text-xs font-bold text-white rounded-xl shadow-vr flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
