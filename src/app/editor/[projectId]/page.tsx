'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { EditorProvider, useEditor } from '../../../context/EditorContext';
import SidebarLeft from '../../../components/SidebarLeft';
import SidebarRight from '../../../components/SidebarRight';
import Canvas from '../../../components/Canvas';
import { useRouter, useParams } from 'next/navigation';

function EditorInner() {
  const { user, loading: authLoading } = useAuth();
  const { loadProject, project, loading: projectLoading } = useEditor();
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string;

  // 1. Session authorization redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 2. Fetch project metadata
  useEffect(() => {
    if (user && projectId) {
      loadProject(projectId);
    }
  }, [user, projectId]);

  if (authLoading || projectLoading || !user || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading project canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Left Widget Selection Panel */}
      <SidebarLeft />

      {/* Main Drag/Drop Dropzone Viewport */}
      <Canvas />

      {/* Right Styling Inspector Panel */}
      <SidebarRight />
    </div>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorInner />
    </EditorProvider>
  );
}
