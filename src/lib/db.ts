import { ProjectState } from '../types/canvas';

export interface LocalUser {
  id: string;
  email: string;
  password?: string; // stored simple password for mock auth
  createdAt: string;
}

const USERS_KEY = 'design_to_code_users';
const PROJECTS_KEY = 'design_to_code_projects';
const ACTIVE_SESSION_KEY = 'design_to_code_session';

// Helper to check if we are in browser environment
const isClient = () => typeof window !== 'undefined';

export const db = {
  // Users Storage
  getUsers(): LocalUser[] {
    if (!isClient()) return [];
    const usersJson = localStorage.getItem(USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  },

  getUserByEmail(email: string): LocalUser | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  saveUser(user: LocalUser): void {
    if (!isClient()) return;
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex > -1) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  // Auth Sessions
  getActiveSession(): LocalUser | null {
    if (!isClient()) return null;
    const sessionJson = localStorage.getItem(ACTIVE_SESSION_KEY);
    return sessionJson ? JSON.parse(sessionJson) : null;
  },

  setActiveSession(user: LocalUser | null): void {
    if (!isClient()) return;
    if (user) {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  },

  // Projects Storage
  getProjects(userId: string): ProjectState[] {
    if (!isClient()) return [];
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    const projects: ProjectState[] = projectsJson ? JSON.parse(projectsJson) : [];
    
    // Filter by user
    const userProjects = projects.filter(p => p.userId === userId);
    
    // If no projects exist for the user, create a default landing page project
    if (userProjects.length === 0) {
      const defaultProject: ProjectState = {
        id: 'default-project-id',
        name: 'My Landing Page',
        userId: userId,
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
              backgroundColor: '#0f172a', // Tailwind slate-900
              gap: '24px'
            }
          },
          children: [
            {
              id: 'node-1',
              type: 'TextBlock',
              props: {
                tag: 'h1',
                text: 'Create Stunning Web Interfaces Instantly',
                style: {
                  textColor: '#f8fafc', // slate-50
                  width: '100%',
                  textAlign: 'center' as any,
                  marginBottom: '12px'
                },
                className: 'text-5xl font-extrabold tracking-tight'
              },
              children: []
            },
            {
              id: 'node-2',
              type: 'TextBlock',
              props: {
                tag: 'p',
                text: 'Drag components, customize styles using pure Tailwind properties, and export production-ready code with a single click.',
                style: {
                  textColor: '#94a3b8', // slate-400
                  width: '100%',
                  textAlign: 'center' as any,
                  marginBottom: '20px'
                },
                className: 'text-lg max-w-2xl mx-auto'
              },
              children: []
            },
            {
              id: 'node-3',
              type: 'Button',
              props: {
                text: 'Export Code Now',
                linkTo: 'https://github.com',
                style: {
                  backgroundColor: '#3b82f6', // blue-500
                  textColor: '#ffffff',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  paddingLeft: '24px',
                  paddingRight: '24px',
                  borderRadius: '8px'
                },
                className: 'font-semibold hover:bg-blue-600 transition-all shadow-md'
              },
              children: []
            }
          ]
        }
      };
      
      this.saveProject(defaultProject);
      return [defaultProject];
    }
    
    return userProjects;
  },

  getProjectById(id: string): ProjectState | undefined {
    if (!isClient()) return undefined;
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    const projects: ProjectState[] = projectsJson ? JSON.parse(projectsJson) : [];
    return projects.find(p => p.id === id);
  },

  saveProject(project: ProjectState): void {
    if (!isClient()) return;
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    const projects: ProjectState[] = projectsJson ? JSON.parse(projectsJson) : [];
    
    const existingIndex = projects.findIndex(p => p.id === project.id);
    if (existingIndex > -1) {
      projects[existingIndex] = {
        ...project,
        updatedAt: new Date().toISOString()
      };
    } else {
      projects.push(project);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  deleteProject(id: string): void {
    if (!isClient()) return;
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    if (!projectsJson) return;
    const projects: ProjectState[] = JSON.parse(projectsJson);
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  }
};
