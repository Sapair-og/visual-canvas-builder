'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/db';
import { ProjectState } from '../types/canvas';
import { 
  Sparkles, 
  LogOut, 
  FolderPlus, 
  Layers, 
  Trash2, 
  ArrowRight,
  User as UserIcon,
  Calendar
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Load user's projects when user session is available
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      const userProjects = db.getProjects(user.id);
      setProjects(userProjects);
    }
  }, [user, loading, router]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName.trim()) return;

    const newProject: ProjectState = {
      id: Math.random().toString(36).substring(2, 9),
      name: newProjectName.trim(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvasState: {
        id: 'root',
        type: 'Container',
        props: {
          style: {
            width: '100%',
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: '40px',
            paddingBottom: '40px',
            paddingLeft: '20px',
            paddingRight: '20px',
            backgroundColor: '#0f172a',
            gap: '24px'
          }
        },
        children: [
          {
            id: 'node-title-' + Math.random().toString(36).substring(2, 5),
            type: 'TextBlock',
            props: {
              tag: 'h1',
              text: 'New Project Canvas',
              style: {
                textColor: '#ffffff',
                width: '100%',
                textAlign: 'center' as any
              },
              className: 'text-4xl font-bold'
            },
            children: []
          }
        ]
      }
    };

    db.saveProject(newProject);
    setProjects(db.getProjects(user.id));
    setNewProjectName('');
    setIsCreating(false);
  };

  const handleDeleteProject = (id: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this project?')) {
      db.deleteProject(id);
      setProjects(db.getProjects(user.id));
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Antigravity SaaS
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-red-400 text-slate-300 text-sm font-medium rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        
        {/* Welcome Section & Create Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Project Dashboard
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Design, build, and export websites using a visual canvas.
            </p>
          </div>

          {/* New Project Action Button */}
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 transition-all text-sm"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          ) : (
            <form onSubmit={handleCreateProject} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                required
                autoFocus
                placeholder="Project Name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full md:w-60 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-sm transition-all"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
            <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No Projects Found</h3>
            <p className="text-slate-500 text-sm mt-1">Get started by creating your first design project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id}
                className="bg-slate-900/50 hover:bg-slate-900/80 border border-slate-900 hover:border-slate-800/80 rounded-xl p-6 transition-all duration-300 group shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-slate-800/80 rounded-lg text-blue-400 group-hover:text-blue-300 transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-1.5 hover:bg-slate-850 hover:text-red-400 text-slate-500 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-100 mb-1 group-hover:text-white transition-colors truncate">
                  {project.name}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Updated {new Date(project.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-950">
                  <span className="text-xs text-slate-400 font-mono">ID: {project.id}</span>
                  <button 
                    onClick={() => {
                      router.push(`/editor/${project.id}`);
                    }}
                    className="flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300 group-hover:translate-x-0.5 transition-all"
                  >
                    <span>Open Editor</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
