'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CanvasNode, ProjectState, NodeType, ComponentProps, ComponentStyles } from '../types/canvas';
import { db } from '../lib/db';
import { DatabaseConfig, DatabaseTable, DataBinding } from '../types/database';
import { LayoutTemplate } from '../lib/templates';

export interface EditorToast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface EditorContextType {
  project: ProjectState | null;
  canvasState: CanvasNode | null;
  selectedNodeId: string | null;
  loading: boolean;
  snapToGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectNode: (id: string | null) => void;
  updateNodeProps: (nodeId: string, props: Partial<ComponentProps>) => void;
  addNode: (targetId: string, type: NodeType, props?: ComponentProps, position?: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, targetId: string, position?: { x: number; y: number }) => void;
  addTemplate: (template: LayoutTemplate) => void;
  saveProject: () => void;
  loadProject: (projectId: string) => void;
  setSnapToGrid: (snap: boolean) => void;
  undo: () => void;
  redo: () => void;
  toasts: EditorToast[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
  renameNode: (nodeId: string, name: string) => void;
  toggleNodeVisibility: (nodeId: string) => void;
  toggleNodeLock: (nodeId: string) => void;
  reorderNode: (nodeId: string, direction: 'up' | 'down' | 'front' | 'back') => void;
  alignNode: (nodeId: string, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  guides: EditorGuide[];
  addGuide: (type: 'horizontal' | 'vertical', value: number) => void;
  removeGuide: (id: string) => void;
  isPreview: boolean;
  setIsPreview: (preview: boolean) => void;
  pages: Record<string, CanvasNode>;
  currentPageId: string;
  changePage: (pageId: string) => void;
  addPage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  workspaceMode: 'design' | 'data-flow' | 'scripting' | 'backend';
  setWorkspaceMode: (mode: 'design' | 'data-flow' | 'scripting' | 'backend') => void;
  leftSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  rightSidebarCollapsed: boolean;
  toggleRightSidebar: () => void;
  customScripts: Record<string, string>;
  updateCustomScript: (id: string, code: string) => void;
  backendServices: { id: string; name: string; enabled: boolean; config: any }[];
  updateBackendService: (id: string, enabled: boolean, config: any) => void;
  dbConfig: DatabaseConfig | null;
  updateDbConfig: (config: DatabaseConfig) => void;
  dbTables: DatabaseTable[];
  addDbTable: (table: DatabaseTable) => void;
  updateDbTable: (tableId: string, updates: Partial<DatabaseTable>) => void;
  deleteDbTable: (tableId: string) => void;
  dbBindings: DataBinding[];
  createDataBinding: (binding: Omit<DataBinding, 'id'>) => void;
  deleteDataBinding: (bindingId: string) => void;
  clipboard: { type: 'copy' | 'cut'; node: CanvasNode } | null;
  copyNode: (nodeId: string) => void;
  cutNode: (nodeId: string) => void;
  pasteNode: (targetParentId: string | null) => void;
}

export interface EditorGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  value: number;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Helper functions for immutable tree updates
const updateNodeInTree = (
  node: CanvasNode,
  id: string,
  updater: (n: CanvasNode) => Partial<CanvasNode>
): CanvasNode => {
  if (node.id === id) {
    const updates = updater(node);
    
    // Merge props & style objects cleanly
    const existingStyle = node.props.style || {};
    const newStyle = updates.props?.style || {};
    const mergedStyle = { ...existingStyle, ...newStyle };

    return {
      ...node,
      ...updates,
      props: {
        ...node.props,
        ...updates.props,
        style: mergedStyle
      }
    } as CanvasNode;
  }
  return {
    ...node,
    children: node.children.map(c => updateNodeInTree(c, id, updater))
  };
};

const addNodeToTree = (node: CanvasNode, parentId: string, newNode: CanvasNode, index?: number): CanvasNode => {
  if (node.id === parentId) {
    // Only Containers can have children
    if (node.type !== 'Container') return node;
    const newChildren = [...node.children];
    if (index !== undefined) {
      newChildren.splice(index, 0, newNode);
    } else {
      newChildren.push(newNode);
    }
    return {
      ...node,
      children: newChildren
    };
  }
  return {
    ...node,
    children: node.children.map(c => addNodeToTree(c, parentId, newNode, index))
  };
};

const deleteNodeFromTree = (node: CanvasNode, id: string): CanvasNode => {
  return {
    ...node,
    children: node.children
      .filter(c => c.id !== id)
      .map(c => deleteNodeFromTree(c, id))
  };
};

const moveNodeInTree = (
  rootNode: CanvasNode,
  nodeId: string,
  targetParentId: string,
  index?: number
): CanvasNode => {
  let nodeToMove: CanvasNode | null = null;

  // Extract from original parent
  const findAndExtract = (node: CanvasNode): CanvasNode => {
    if (node.id === nodeId) {
      nodeToMove = node;
    }
    return {
      ...node,
      children: node.children
        .filter(c => c.id !== nodeId)
        .map(findAndExtract)
    };
  };

  const tempRoot = findAndExtract(rootNode);
  if (!nodeToMove) return rootNode;

  // Insert into new parent
  const insertNode = (node: CanvasNode): CanvasNode => {
    if (node.id === targetParentId) {
      if (node.type !== 'Container') return node;
      const newChildren = [...node.children];
      if (index !== undefined) {
        newChildren.splice(index, 0, nodeToMove!);
      } else {
        newChildren.push(nodeToMove!);
      }
      return {
        ...node,
        children: newChildren
      };
    }
    return {
      ...node,
      children: node.children.map(insertNode)
    };
  };

  return insertNode(tempRoot);
};

const reorderNodeInTree = (node: CanvasNode, nodeId: string, direction: 'up' | 'down' | 'front' | 'back'): CanvasNode => {
  const childIndex = node.children.findIndex(c => c.id === nodeId);
  if (childIndex !== -1) {
    const newChildren = [...node.children];
    const item = newChildren[childIndex];
    
    if (direction === 'up') {
      if (childIndex < newChildren.length - 1) {
        newChildren[childIndex] = newChildren[childIndex + 1];
        newChildren[childIndex + 1] = item;
      }
    } else if (direction === 'down') {
      if (childIndex > 0) {
        newChildren[childIndex] = newChildren[childIndex - 1];
        newChildren[childIndex - 1] = item;
      }
    } else if (direction === 'front') {
      newChildren.splice(childIndex, 1);
      newChildren.push(item);
    } else if (direction === 'back') {
      newChildren.splice(childIndex, 1);
      newChildren.unshift(item);
    }
    
    return {
      ...node,
      children: newChildren
    };
  }
  
  return {
    ...node,
    children: node.children.map(c => reorderNodeInTree(c, nodeId, direction))
  };
};

const findNodeAndParent = (
  root: CanvasNode, 
  id: string, 
  parent: CanvasNode | null = null
): { node: CanvasNode; parent: CanvasNode | null } | null => {
  if (root.id === id) {
    return { node: root, parent };
  }
  for (const child of root.children) {
    const found = findNodeAndParent(child, id, root);
    if (found) return found;
  }
  return null;
};

const parsePixelVal = (val?: string, defaultVal = 0): number => {
  if (!val) return defaultVal;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [project, setProject] = useState<ProjectState | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasNode | null>(null);
  const [pages, setPages] = useState<Record<string, CanvasNode>>({
    index: {
      id: 'root',
      type: 'Container',
      props: {
        style: {
          width: '800px',
          height: '600px',
          backgroundColor: '#0f172a',
          position: 'relative'
        }
      },
      children: []
    }
  });
  const [currentPageId, setCurrentPageId] = useState<string>('index');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Database Flow & Binding States
  const [workspaceMode, setWorkspaceMode] = useState<'design' | 'data-flow' | 'scripting' | 'backend'>('design');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState<boolean>(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState<boolean>(false);
  const [customScripts, setCustomScripts] = useState<Record<string, string>>({});
  const [backendServices, setBackendServices] = useState<{ id: string; name: string; enabled: boolean; config: any }[]>([
    { id: 'auth', name: 'User Authentication', enabled: false, config: { provider: 'email' } },
    { id: 'stripe', name: 'Stripe Payments (E-Commerce)', enabled: false, config: { mode: 'checkout', successUrl: '', cancelUrl: '' } },
    { id: 'db-sync', name: 'Real-time Database Sync', enabled: false, config: { mode: 'auto' } },
    { id: 'smtp', name: 'Email Notifications (SMTP)', enabled: false, config: { host: 'smtp.mailgun.org', port: '587' } },
  ]);
  const [dbConfig, setDbConfig] = useState<DatabaseConfig | null>(null);
  const [dbTables, setDbTables] = useState<DatabaseTable[]>([]);
  const [dbBindings, setDbBindings] = useState<DataBinding[]>([]);

  // Advanced SaaS States: History Stack & Snap parameters
  const [pastStates, setPastStates] = useState<CanvasNode[]>([]);
  const [futureStates, setFutureStates] = useState<CanvasNode[]>([]);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [toasts, setToasts] = useState<EditorToast[]>([]);
  const [guides, setGuides] = useState<EditorGuide[]>([]);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [clipboard, setClipboard] = useState<{ type: 'copy' | 'cut'; node: CanvasNode } | null>(null);

  // Sync canvasState to pages object when changes happen
  useEffect(() => {
    if (canvasState) {
      setPages(prev => {
        if (JSON.stringify(prev[currentPageId]) !== JSON.stringify(canvasState)) {
          return {
            ...prev,
            [currentPageId]: canvasState
          };
        }
        return prev;
      });
    }
  }, [canvasState, currentPageId]);

  const addGuide = (type: 'horizontal' | 'vertical', value: number) => {
    const id = `${type}-${value}-${Math.random().toString(36).substring(2, 5)}`;
    setGuides(prev => [...prev, { id, type, value }]);
    showToast(`Added ${type} guide at ${value}px`, 'success');
  };

  const removeGuide = (id: string) => {
    setGuides(prev => prev.filter(g => g.id !== id));
    showToast('Guide removed', 'info');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = `${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadProject = (projectId: string) => {
    setLoading(true);
    const loaded = db.getProjectById(projectId);
    if (loaded) {
      setProject(loaded);
      
      let projectPages = loaded.pages;
      let activePageId = loaded.currentPageId || 'index';
      if (!projectPages || Object.keys(projectPages).length === 0) {
        projectPages = {
          index: loaded.canvasState
        };
        activePageId = 'index';
      }
      
      setPages(projectPages);
      setCurrentPageId(activePageId);
      setCanvasState(projectPages[activePageId]);

      // Load database config
      setDbConfig(loaded.dbConfig || null);
      setDbTables(loaded.dbTables || []);
      setDbBindings(loaded.dbBindings || []);
      setCustomScripts(loaded.customScripts || {});
      setBackendServices(loaded.backendServices || [
        { id: 'auth', name: 'User Authentication', enabled: false, config: { provider: 'email' } },
        { id: 'stripe', name: 'Stripe Payments (E-Commerce)', enabled: false, config: { mode: 'checkout', successUrl: '', cancelUrl: '' } },
        { id: 'db-sync', name: 'Real-time Database Sync', enabled: false, config: { mode: 'auto' } },
        { id: 'smtp', name: 'Email Notifications (SMTP)', enabled: false, config: { host: 'smtp.mailgun.org', port: '587' } },
      ]);
      setWorkspaceMode('design');
      setLeftSidebarCollapsed(false);
      setRightSidebarCollapsed(false);
      
      // Clear stacks on new project load
      setPastStates([]);
      setFutureStates([]);
    }
    setLoading(false);
  };

  // State update wrapper that logs changes onto history stacks
  const setCanvasStateWithHistory = (
    updater: CanvasNode | ((prev: CanvasNode | null) => CanvasNode | null)
  ) => {
    setCanvasState(prev => {
      if (!prev) return null;
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!next) return prev;

      // Only push to stack if structural changes actually happen
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        const cloned = JSON.parse(JSON.stringify(prev));
        setPastStates(history => [...history, cloned]);
        setFutureStates([]); // Clear redo
      }
      return next;
    });
  };

  const undo = () => {
    if (pastStates.length === 0 || !canvasState) return;
    const previous = pastStates[pastStates.length - 1];
    const remainingPast = pastStates.slice(0, pastStates.length - 1);
    
    const currentCloned = JSON.parse(JSON.stringify(canvasState));
    setFutureStates(redoHistory => [currentCloned, ...redoHistory]);
    setCanvasState(previous);
    setPastStates(remainingPast);
    setSelectedNodeId(null); // Clear selection outline to prevent mismatch
    showToast('Undo action applied', 'info');
  };

  const redo = () => {
    if (futureStates.length === 0 || !canvasState) return;
    const next = futureStates[0];
    const remainingFuture = futureStates.slice(1);

    const currentCloned = JSON.parse(JSON.stringify(canvasState));
    setPastStates(history => [...history, currentCloned]);
    setCanvasState(next);
    setFutureStates(remainingFuture);
    setSelectedNodeId(null);
    showToast('Redo action applied', 'info');
  };

  const selectNode = (id: string | null) => {
    setSelectedNodeId(id);
  };

  const updateNodeProps = (nodeId: string, props: Partial<ComponentProps>) => {
    if (!canvasState) return;
    setCanvasStateWithHistory(prev => {
      if (!prev) return null;
      return updateNodeInTree(prev, nodeId, (node) => ({
        props: {
          ...node.props,
          ...props,
          style: {
            ...node.props.style,
            ...props.style
          }
        }
      }));
    });
  };

  const addNode = (targetId: string, type: NodeType, props?: ComponentProps, position?: { x: number; y: number }) => {
    if (!canvasState) return;

    // Create a new node with some sensible defaults
    const nodeId = `${type.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`;
    const defaultProps: ComponentProps = props || {};
    
    // Add default UI styling to newly dropped primitive elements
    if (!defaultProps.style) {
      if (type === 'Container') {
        defaultProps.style = {
          width: '240px',
          height: '180px',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '20px',
          paddingRight: '20px',
          paddingBottom: '20px',
          paddingLeft: '20px',
          backgroundColor: '#1e293b', // slate-800
          borderRadius: '8px',
          gap: '12px'
        };
      } else if (type === 'TextBlock') {
        defaultProps.tag = 'p';
        defaultProps.text = 'Write your custom text here...';
        defaultProps.style = {
          width: '180px',
          height: '40px',
          textColor: '#f1f5f9', // slate-100
          textAlign: 'left'
        };
      } else if (type === 'Button') {
        defaultProps.text = 'Click Here';
        defaultProps.linkTo = '#';
        defaultProps.style = {
          width: '120px',
          height: '36px',
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          borderRadius: '6px'
        };
      } else if (type === 'ImageBlock') {
        defaultProps.imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
        defaultProps.imageAlt = 'Placeholder Image';
        defaultProps.style = {
          width: '240px',
          height: '160px',
          borderRadius: '8px'
        };
      } else if (type === 'Divider') {
        defaultProps.style = {
          width: '100%',
          height: '2px',
          backgroundColor: '#334155'
        };
      } else if (type === 'Icon') {
        defaultProps.iconName = 'Star';
        defaultProps.style = {
          width: '32px',
          height: '32px',
          textColor: '#eab308'
        };
      }
    }

    if (position) {
      defaultProps.style = {
        ...defaultProps.style,
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`
      };
    }

    const newNode: CanvasNode = {
      id: nodeId,
      type,
      props: defaultProps,
      children: []
    };

    // Determine target parent container and insertion index
    let parentId = targetId;
    let insertIndex: number | undefined = undefined;

    const findNodeTypeAndParent = (root: CanvasNode, id: string): { type: NodeType; parentInfo: { parentId: string; index: number } | null } | null => {
      if (root.id === id) {
        return { type: root.type, parentInfo: null };
      }
      for (let i = 0; i < root.children.length; i++) {
        if (root.children[i].id === id) {
          return { type: root.children[i].type, parentInfo: { parentId: root.id, index: i } };
        }
        const found = findNodeTypeAndParent(root.children[i], id);
        if (found) return found;
      }
      return null;
    };

    const targetInfo = findNodeTypeAndParent(canvasState, targetId);
    if (targetInfo) {
      if (targetInfo.type !== 'Container' && targetInfo.parentInfo) {
        parentId = targetInfo.parentInfo.parentId;
        insertIndex = targetInfo.parentInfo.index + 1; // Insert right after sibling
      }
    }

    setCanvasStateWithHistory(prev => {
      if (!prev) return null;
      return addNodeToTree(prev, parentId, newNode, insertIndex);
    });
    
    // Auto-select the newly added node for instant custom editing
    setSelectedNodeId(nodeId);
  };

  const deleteNode = (nodeId: string) => {
    if (!canvasState || nodeId === 'root') return;
    setCanvasStateWithHistory(prev => {
      if (!prev) return null;
      return deleteNodeFromTree(prev, nodeId);
    });
    // Cascade delete any data bindings associated with this canvas node
    setDbBindings(prev => prev.filter(b => b.nodeId !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const moveNode = (nodeId: string, targetId: string, position?: { x: number; y: number }) => {
    if (!canvasState || nodeId === 'root' || nodeId === targetId) return;

    let targetParentId = targetId;
    let insertIndex: number | undefined = undefined;

    const findNodeTypeAndParent = (root: CanvasNode, id: string): { type: NodeType; parentInfo: { parentId: string; index: number } | null } | null => {
      if (root.id === id) {
        return { type: root.type, parentInfo: null };
      }
      for (let i = 0; i < root.children.length; i++) {
        if (root.children[i].id === id) {
          return { type: root.children[i].type, parentInfo: { parentId: root.id, index: i } };
        }
        const found = findNodeTypeAndParent(root.children[i], id);
        if (found) return found;
      }
      return null;
    };

    const targetInfo = findNodeTypeAndParent(canvasState, targetId);
    if (targetInfo) {
      if (targetInfo.type !== 'Container' && targetInfo.parentInfo) {
        targetParentId = targetInfo.parentInfo.parentId;
        insertIndex = targetInfo.parentInfo.index + 1; // Insert as sibling next to target
      }
    }

    setCanvasStateWithHistory(prev => {
      if (!prev) return null;

      let updatedTree = prev;
      if (position) {
        updatedTree = updateNodeInTree(prev, nodeId, (node) => ({
          props: {
            ...node.props,
            style: {
              ...node.props.style,
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`
            }
          }
        }));
      }

      return moveNodeInTree(updatedTree, nodeId, targetParentId, insertIndex);
    });
  };

  const addTemplate = (template: LayoutTemplate) => {
    if (!canvasState) return;
    const targetParentId = selectedNodeId || 'root';

    // Duplicate layout nodes recursively resetting IDs to avoid collisions
    const cloneWithNewIds = (node: CanvasNode): CanvasNode => {
      const newId = `${node.type.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`;
      return {
        ...node,
        id: newId,
        children: node.children.map(cloneWithNewIds)
      };
    };

    const clonedStructure = cloneWithNewIds(template.structure);

    setCanvasStateWithHistory(prev => {
      if (!prev) return null;
      return addNodeToTree(prev, targetParentId, clonedStructure);
    });

    // Auto-select the root container of the injected template
    setSelectedNodeId(clonedStructure.id);
    showToast(`Template "${template.name}" added`, 'success');
  };

  const saveProject = () => {
    if (!project || !canvasState) return;
    const updatedPages = {
      ...pages,
      [currentPageId]: canvasState
    };
    const updatedProject: ProjectState = {
      ...project,
      canvasState,
      pages: updatedPages,
      currentPageId,
      dbConfig: dbConfig || undefined,
      dbTables: dbTables || undefined,
      dbBindings: dbBindings || undefined,
      customScripts: customScripts || undefined,
      backendServices: backendServices || undefined,
      updatedAt: new Date().toISOString()
    };
    db.saveProject(updatedProject);
    setProject(updatedProject);
    showToast('Project saved successfully!', 'success');
  };

  const updateDbConfig = (config: DatabaseConfig) => {
    setDbConfig(config);
    showToast(`Database provider configured: ${config.provider}`, 'success');
  };

  const toggleLeftSidebar = () => setLeftSidebarCollapsed(prev => !prev);
  const toggleRightSidebar = () => setRightSidebarCollapsed(prev => !prev);

  const updateCustomScript = (id: string, code: string) => {
    setCustomScripts(prev => ({ ...prev, [id]: code }));
    showToast('Custom script saved!', 'success');
  };

  const updateBackendService = (id: string, enabled: boolean, config: any) => {
    setBackendServices(prev => prev.map(s => s.id === id ? { ...s, enabled, config } : s));
    showToast('Backend service updated!', 'success');
  };

  const addDbTable = (table: DatabaseTable) => {
    setDbTables(prev => [...prev, table]);
    showToast(`Table "${table.name}" added to schema`, 'success');
  };

  const updateDbTable = (tableId: string, updates: Partial<DatabaseTable>) => {
    setDbTables(prev => prev.map(t => t.id === tableId ? { ...t, ...updates } : t));
  };

  const deleteDbTable = (tableId: string) => {
    setDbTables(prev => prev.filter(t => t.id !== tableId));
    // Cascade delete any bindings associated with this table
    setDbBindings(prev => prev.filter(b => b.tableId !== tableId));
    showToast(`Table removed`, 'info');
  };

  const createDataBinding = (binding: Omit<DataBinding, 'id'>) => {
    const id = `binding-${Math.random().toString(36).substring(2, 9)}`;
    const newBinding: DataBinding = { ...binding, id };
    
    // Replace duplicate binding (same node, same type)
    setDbBindings(prev => {
      const filtered = prev.filter(b => b.nodeId !== binding.nodeId || b.bindType !== binding.bindType);
      return [...filtered, newBinding];
    });

    // Update element props directly to persist
    updateNodeProps(binding.nodeId, {
      dataBinding: {
        tableId: binding.tableId,
        columnName: binding.columnName,
        bindType: binding.bindType
      }
    });

    showToast(`Data bound: UI Linked to ${binding.columnName}`, 'success');
  };

  const deleteDataBinding = (bindingId: string) => {
    const binding = dbBindings.find(b => b.id === bindingId);
    if (binding) {
      updateNodeProps(binding.nodeId, {
        dataBinding: undefined
      });
    }
    setDbBindings(prev => prev.filter(b => b.id !== bindingId));
    showToast(`Data binding removed`, 'info');
  };

  const changePage = (pageId: string) => {
    if (!pages[pageId]) return;
    
    if (canvasState) {
      setPages(prev => ({
        ...prev,
        [currentPageId]: canvasState
      }));
    }
    
    setCurrentPageId(pageId);
    setCanvasState(pages[pageId]);
    setPastStates([]);
    setFutureStates([]);
    setSelectedNodeId(null);
    showToast(`Switched to page: ${pageId}`, 'info');
  };

  const addPage = (pageId: string) => {
    const cleanPageId = pageId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
    if (!cleanPageId) {
      showToast('Invalid page name', 'error');
      return;
    }
    if (pages[cleanPageId]) {
      showToast('Page already exists', 'error');
      return;
    }
    
    const newPageRoot: CanvasNode = {
      id: 'root',
      type: 'Container',
      props: {
        style: {
          width: '800px',
          height: '600px',
          backgroundColor: '#0f172a',
          position: 'relative'
        }
      },
      children: []
    };
    
    let updatedPages = { ...pages };
    if (canvasState) {
      updatedPages[currentPageId] = canvasState;
    }
    updatedPages[cleanPageId] = newPageRoot;
    
    setPages(updatedPages);
    setCurrentPageId(cleanPageId);
    setCanvasState(newPageRoot);
    setPastStates([]);
    setFutureStates([]);
    setSelectedNodeId(null);
    showToast(`Created page: ${cleanPageId}`, 'success');
  };

  const deletePage = (pageId: string) => {
    if (pageId === 'index') {
      showToast('Cannot delete the homepage', 'error');
      return;
    }
    if (!pages[pageId]) return;
    
    const newPages = { ...pages };
    delete newPages[pageId];
    
    setPages(newPages);
    
    if (currentPageId === pageId) {
      setCurrentPageId('index');
      setCanvasState(newPages['index']);
      setPastStates([]);
      setFutureStates([]);
      setSelectedNodeId(null);
    }
    showToast(`Deleted page: ${pageId}`, 'info');
  };

  const renameNode = (nodeId: string, name: string) => {
    updateNodeProps(nodeId, { layerName: name });
    showToast(`Layer renamed to "${name}"`, 'success');
  };

  const toggleNodeVisibility = (nodeId: string) => {
    if (!canvasState) return;
    
    const findVisibility = (node: CanvasNode): boolean => {
      if (node.id === nodeId) {
        return node.props.visible !== false;
      }
      for (const child of node.children) {
        const val = findVisibility(child);
        if (val !== undefined) return val;
      }
      return true;
    };

    const currentVisible = findVisibility(canvasState);
    const nextVisibility = !currentVisible;
    
    updateNodeProps(nodeId, { visible: nextVisibility });
    showToast(nextVisibility ? 'Layer made visible' : 'Layer hidden', 'info');
  };

  const toggleNodeLock = (nodeId: string) => {
    if (!canvasState) return;
    
    const findLock = (node: CanvasNode): boolean => {
      if (node.id === nodeId) {
        return !!node.props.locked;
      }
      for (const child of node.children) {
        const val = findLock(child);
        if (val !== undefined) return val;
      }
      return false;
    };

    const currentLocked = findLock(canvasState);
    updateNodeProps(nodeId, { locked: !currentLocked });
    showToast(!currentLocked ? 'Layer locked' : 'Layer unlocked', 'info');
  };

  const reorderNode = (nodeId: string, direction: 'up' | 'down' | 'front' | 'back') => {
    if (!canvasState || nodeId === 'root') return;
    setCanvasStateWithHistory(prev => {
      if (!prev) return null;
      return reorderNodeInTree(prev, nodeId, direction);
    });
    showToast(`Layer order adjusted`, 'info');
  };

  const alignNode = (nodeId: string, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!canvasState) return;
    const match = findNodeAndParent(canvasState, nodeId);
    if (!match || !match.parent) return;
    
    const { node, parent } = match;
    
    const childW = parsePixelVal(node.props.style?.width, 180);
    const childH = parsePixelVal(node.props.style?.height, 40);
    const parentW = parsePixelVal(parent.props.style?.width, 800);
    const parentH = parsePixelVal(parent.props.style?.height, 600);
    
    const newStyle: Partial<ComponentStyles> = {};
    
    switch (alignment) {
      case 'left':
        newStyle.left = '0px';
        break;
      case 'right':
        newStyle.left = `${parentW - childW}px`;
        break;
      case 'center':
        newStyle.left = `${Math.round((parentW - childW) / 2)}px`;
        break;
      case 'top':
        newStyle.top = '0px';
        break;
      case 'bottom':
        newStyle.top = `${parentH - childH}px`;
        break;
      case 'middle':
        newStyle.top = `${Math.round((parentH - childH) / 2)}px`;
        break;
    }
    
    updateNodeProps(nodeId, {
      style: {
        ...node.props.style,
        ...newStyle
      }
    });
    
    showToast(`Aligned ${alignment}`, 'info');
  };

  const copyNode = (nodeId: string) => {
    if (!canvasState) return;
    const found = findNodeAndParent(canvasState, nodeId);
    if (found && found.node) {
      setClipboard({ type: 'copy', node: JSON.parse(JSON.stringify(found.node)) });
      showToast(`Copied ${found.node.props.layerName || found.node.type}`, 'success');
    }
  };

  const cutNode = (nodeId: string) => {
    if (!canvasState || nodeId === 'root') return;
    const found = findNodeAndParent(canvasState, nodeId);
    if (found && found.node) {
      setClipboard({ type: 'cut', node: JSON.parse(JSON.stringify(found.node)) });
      setCanvasStateWithHistory(prev => {
        if (!prev) return null;
        return deleteNodeFromTree(prev, nodeId);
      });
      setDbBindings(prev => prev.filter(b => b.nodeId !== nodeId));
      showToast(`Cut ${found.node.props.layerName || found.node.type}`, 'info');
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    }
  };

  const pasteNode = (targetParentId: string | null) => {
    if (!canvasState || !clipboard) return;

    let parentId = targetParentId || selectedNodeId || 'root';
    let insertIndex: number | undefined = undefined;

    const findNodeTypeAndParent = (root: CanvasNode, id: string): { type: NodeType; parentInfo: { parentId: string; index: number } | null } | null => {
      if (root.id === id) {
        return { type: root.type, parentInfo: null };
      }
      for (let i = 0; i < root.children.length; i++) {
        if (root.children[i].id === id) {
          return { type: root.children[i].type, parentInfo: { parentId: root.id, index: i } };
        }
        const found = findNodeTypeAndParent(root.children[i], id);
        if (found) return found;
      }
      return null;
    };

    const targetInfo = findNodeTypeAndParent(canvasState, parentId);
    if (targetInfo) {
      if (targetInfo.type !== 'Container' && targetInfo.parentInfo) {
        parentId = targetInfo.parentInfo.parentId;
        insertIndex = targetInfo.parentInfo.index + 1;
      }
    }

    const cloneWithNewIds = (node: CanvasNode): CanvasNode => {
      const newId = `${node.type.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`;
      const updatedStyle = { ...(node.props.style || {}) };
      if (updatedStyle.position === 'absolute' && updatedStyle.left && updatedStyle.top) {
        const leftVal = parseInt(updatedStyle.left) || 0;
        const topVal = parseInt(updatedStyle.top) || 0;
        updatedStyle.left = `${leftVal + 20}px`;
        updatedStyle.top = `${topVal + 20}px`;
      }
      return {
        ...node,
        id: newId,
        props: {
          ...node.props,
          style: updatedStyle,
          layerName: node.props.layerName ? `${node.props.layerName} (Copy)` : undefined
        },
        children: node.children.map(cloneWithNewIds)
      };
    };

    let nodeToInsert: CanvasNode;
    if (clipboard.type === 'copy') {
      nodeToInsert = cloneWithNewIds(clipboard.node);
    } else {
      const node = clipboard.node;
      const updatedStyle = { ...(node.props.style || {}) };
      if (updatedStyle.position === 'absolute' && updatedStyle.left && updatedStyle.top) {
        const leftVal = parseInt(updatedStyle.left) || 0;
        const topVal = parseInt(updatedStyle.top) || 0;
        updatedStyle.left = `${leftVal + 20}px`;
        updatedStyle.top = `${topVal + 20}px`;
      }
      nodeToInsert = {
        ...node,
        props: {
          ...node.props,
          style: updatedStyle
        }
      };
      setClipboard({ type: 'copy', node: JSON.parse(JSON.stringify(nodeToInsert)) });
    }

    setCanvasStateWithHistory(prev => {
      if (!prev) return null;
      return addNodeToTree(prev, parentId, nodeToInsert, insertIndex);
    });

    setSelectedNodeId(nodeToInsert.id);
    showToast(`Pasted ${nodeToInsert.props.layerName || nodeToInsert.type}`, 'success');
  };

  return (
    <EditorContext.Provider
      value={{
        project,
        canvasState,
        selectedNodeId,
        loading,
        snapToGrid,
        canUndo: pastStates.length > 0,
        canRedo: futureStates.length > 0,
        selectNode,
        updateNodeProps,
        addNode,
        deleteNode,
        moveNode,
        addTemplate,
        saveProject,
        loadProject,
        setSnapToGrid,
        undo,
        redo,
        toasts,
        showToast,
        removeToast,
        renameNode,
        toggleNodeVisibility,
        toggleNodeLock,
        reorderNode,
        alignNode,
        guides,
        addGuide,
        removeGuide,
        isPreview,
        setIsPreview,
        pages,
        currentPageId,
        changePage,
        addPage,
        deletePage,
        workspaceMode,
        setWorkspaceMode,
        leftSidebarCollapsed,
        toggleLeftSidebar,
        rightSidebarCollapsed,
        toggleRightSidebar,
        customScripts,
        updateCustomScript,
        backendServices,
        updateBackendService,
        dbConfig,
        updateDbConfig,
        dbTables,
        addDbTable,
        updateDbTable,
        deleteDbTable,
        dbBindings,
        createDataBinding,
        deleteDataBinding,
        clipboard,
        copyNode,
        cutNode,
        pasteNode
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
