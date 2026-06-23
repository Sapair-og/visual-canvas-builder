import { CanvasNode, ThemeTokens, LogicFlow } from '../types/canvas';
import { DatabaseConfig, DatabaseTable } from '../types/database';

// Helper to convert camelCase style keys to kebab-case CSS keys for HTML
const kebabCase = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

const resolveThemeVal = (val: any) => {
  if (typeof val !== 'string') return val;
  if (val.startsWith('theme-')) {
    const k = val.replace('theme-', '');
    return `var(--color-${k})`;
  }
  if (val === 'primary' || val === 'secondary' || val === 'accent' || val === 'background' || val === 'text') {
    return `var(--color-${val})`;
  }
  return val;
};

const resolveThemeFont = (val: any) => {
  if (typeof val !== 'string') return val;
  if (val === 'heading' || val === 'body') {
    return `var(--font-${val})`;
  }
  return val;
};

// Map custom style keys to CSS/React properties
const mapStyleProps = (styleObj: any) => {
  const result: any = {};
  Object.entries(styleObj).forEach(([key, val]) => {
    if (val === undefined || val === '') return;
    
    // Resolve theme variables
    let resolvedVal = val;
    if (key === 'textColor' || key === 'backgroundColor' || key === 'borderColor') {
      resolvedVal = resolveThemeVal(val);
    } else if (key === 'fontFamily') {
      resolvedVal = resolveThemeFont(val);
    }

    // Map custom 'textColor' to standard 'color'
    if (key === 'textColor') {
      result.color = resolvedVal;
    } else if (key === 'backgroundImage') {
      // If it's a linear gradient or url, we keep it as is, otherwise wrap in url
      if (typeof val === 'string' && !val.startsWith('linear-gradient') && !val.startsWith('url(')) {
        result.backgroundImage = `url("${val}")`;
      } else {
        result.backgroundImage = val;
      }
      result.backgroundSize = 'cover';
      result.backgroundPosition = 'center';
    } else {
      result[key] = resolvedVal;
    }
  });
  return result;
};

const CUSTOM_STYLE_BLOCK = `
  /* Canva animations */
  @keyframes entrance-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes entrance-slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes entrance-zoom-in {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes entrance-bounce {
    0% { transform: translateY(15px); opacity: 0; }
    50% { transform: translateY(-5px); opacity: 0.8; }
    100% { transform: translateY(0); opacity: 1; }
  }

  .animate-entrance-fade {
    animation: entrance-fade 0.5s ease-out forwards;
  }
  .animate-entrance-slide-up {
    animation: entrance-slide-up 0.5s ease-out forwards;
  }
  .animate-entrance-zoom-in {
    animation: entrance-zoom-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  .animate-entrance-bounce {
    animation: entrance-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  /* Canva hover effects */
  .hover-effect-scale {
    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease;
  }
  .hover-effect-scale:hover {
    transform: scale(1.05) !important;
  }
  .hover-effect-lift {
    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease;
  }
  .hover-effect-lift:hover {
    transform: translateY(-6px) !important;
  }
  .hover-effect-glow {
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }
  .hover-effect-glow:hover {
    box-shadow: 0 0 15px 3px rgba(59, 130, 246, 0.4) !important;
    border-color: rgba(59, 130, 246, 0.6) !important;
  }
`;

// Helper to recursively collect all data bindings in a node tree
const collectDataBindings = (root: CanvasNode): any[] => {
  const bindings: any[] = [];
  const traverse = (n: CanvasNode) => {
    if (n.props.dataBinding) {
      bindings.push({
        nodeId: n.id,
        type: n.type,
        ...n.props.dataBinding,
        text: n.props.text || '',
        imageUrl: n.props.imageUrl || ''
      });
    }
    n.children.forEach(traverse);
  };
  traverse(root);
  return bindings;
};

/**
 * Traverses the Visual Node JSON Tree and compiles it into a Next.js JSX component.
 */
export function generateReactCode(
  pages: Record<string, CanvasNode>,
  dbConfig: DatabaseConfig | null = null,
  dbTables: DatabaseTable[] = [],
  customScripts: Record<string, string> = {},
  backendServices: any[] = [],
  themeTokens?: ThemeTokens,
  logicFlows: LogicFlow[] = []
): Record<string, string> {
  const result: Record<string, string> = {};

  // 1. Generate database utility config files if a dbConfig is present
  if (dbConfig) {
    if (dbConfig.provider === 'supabase') {
      result['/lib/supabaseClient.ts'] = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "${dbConfig.supabaseUrl || 'https://your-supabase.supabase.co'}";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "${dbConfig.supabaseAnonKey || 'your-anon-key'}";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
    } else if (dbConfig.provider === 'firebase') {
      const fb = dbConfig.firebaseConfig || {};
      result['/lib/firebase.ts'] = `import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "${fb.apiKey || ''}",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "${fb.authDomain || ''}",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "${fb.projectId || ''}",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
`;
    } else if (dbConfig.provider === 'mongodb') {
      result['/lib/mongodb.ts'] = `import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "${dbConfig.mongodbUri || 'mongodb://localhost:27017/mydatabase'}";
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
`;

      result['/pages/api/data/[table].ts'] = `import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { table } = req.query;
  if (!table) return res.status(400).json({ error: 'Table parameter required' });

  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(table as string);

    if (req.method === 'GET') {
      const data = await collection.find({}).toArray();
      return res.status(200).json(data[0] || {});
    }

    if (req.method === 'POST') {
      const body = req.body;
      const result = await collection.insertOne(body);
      return res.status(201).json({ id: result.insertedId, ...body });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(\`Method \${req.method} Not Allowed\`);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
`;
    }
  }

  // 2. Generate CSS Variables block
  const colors = themeTokens?.colors || {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#8b5cf6',
    background: '#0f172a',
    text: '#f8fafc'
  };
  const fonts = themeTokens?.fonts || {
    heading: 'Geist',
    body: 'Geist'
  };

  let cssVars = `\n  :root {\n`;
  Object.entries(colors).forEach(([k, v]) => {
    cssVars += `    --color-${k}: ${v};\n`;
  });
  Object.entries(fonts).forEach(([k, v]) => {
    cssVars += `    --font-${k}: ${v}, sans-serif;\n`;
  });
  cssVars += `  }\n`;

  // 3. Generate react pages
  Object.entries(pages).forEach(([pageId, rootNode]) => {
    const pageBindings = collectDataBindings(rootNode);
    const readBindings = pageBindings.filter(b => b.bindType === 'read');
    const writeBindings = pageBindings.filter(b => b.bindType === 'write');

    const readTableIds = Array.from(new Set(readBindings.map(b => b.tableId)));
    const writeTableIds = Array.from(new Set(writeBindings.map(b => b.tableId)));

    let stateDecls = '';
    let fetchEffects = '';
    let submitHandlers = '';
    let dbImports = '';

    const hasDb = dbConfig !== null;
    const provider = dbConfig?.provider;

    if (hasDb && (readTableIds.length > 0 || writeTableIds.length > 0)) {
      if (provider === 'supabase') {
        dbImports += `import { supabase } from '../lib/supabaseClient';\n`;
      } else if (provider === 'firebase') {
        dbImports += `import { db } from '../lib/firebase';\n`;
        dbImports += `import { collection, getDocs, addDoc } from 'firebase/firestore';\n`;
      }

      // Generate State Hooks and Fetch Effects
      readTableIds.forEach(tableId => {
        const tbl = dbTables.find(t => t.id === tableId);
        const tableName = tbl ? tbl.name : 'data';
        const stateName = `${tableName.toLowerCase()}Data`;
        const setStateName = `set${tableName.charAt(0).toUpperCase()}${tableName.slice(1).toLowerCase()}Data`;

        stateDecls += `  const [${stateName}, ${setStateName}] = React.useState<any>(null);\n`;

        if (provider === 'supabase') {
          fetchEffects += `  React.useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('${tableName}')
          .select('*')
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          ${setStateName}(data);
        }
      } catch (err) {
        console.error('Error fetching ${tableName}:', err);
      }
    }
    fetchData();
  }, []);\n\n`;
        } else if (provider === 'firebase') {
          fetchEffects += `  React.useEffect(() => {
    async function fetchData() {
      try {
        const querySnapshot = await getDocs(collection(db, '${tableName}'));
        if (!querySnapshot.empty) {
          ${setStateName}(querySnapshot.docs[0].data());
        }
      } catch (err) {
        console.error('Error fetching ${tableName}:', err);
      }
    }
    fetchData();
  }, []);\n\n`;
        } else if (provider === 'mongodb') {
          fetchEffects += `  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data/${tableName}');
        if (res.ok) {
          const data = await res.json();
          ${setStateName}(data);
        }
      } catch (err) {
        console.error('Error fetching ${tableName}:', err);
      }
    }
    fetchData();
  }, []);\n\n`;
        }
      });

      // Generate Submit Handlers
      writeBindings.forEach(binding => {
        const tbl = dbTables.find(t => t.id === binding.tableId);
        const tableName = tbl ? tbl.name : 'data';
        const handlerName = `handle${tableName.charAt(0).toUpperCase()}${tableName.slice(1).toLowerCase()}Submit`;

        const columns = tbl ? tbl.columns : [];
        const payloadFields = columns
          .filter(c => c.name.toLowerCase() !== 'id')
          .map(c => {
            let val = '""';
            if (c.type === 'number') val = '0';
            if (c.type === 'boolean') val = 'false';
            if (c.type === 'date') val = 'new Date().toISOString()';
            return `    ${c.name}: ${val}`;
          })
          .join(',\n');

        const payloadObj = `{\n${payloadFields}\n  }`;

        if (provider === 'supabase') {
          submitHandlers += `  const ${handlerName} = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = ${payloadObj};
    try {
      const { data, error } = await supabase
        .from('${tableName}')
        .insert([payload])
        .select();
      if (error) throw error;
      alert('Data submitted to Supabase successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Supabase submit error: ' + err.message);
    }
  };\n\n`;
        } else if (provider === 'firebase') {
          submitHandlers += `  const ${handlerName} = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = ${payloadObj};
    try {
      await addDoc(collection(db, '${tableName}'), payload);
      alert('Data submitted to Firestore successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Firestore submit error: ' + err.message);
    }
  };\n\n`;
        } else if (provider === 'mongodb') {
          submitHandlers += `  const ${handlerName} = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = ${payloadObj};
    try {
      const res = await fetch('/api/data/${tableName}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('API request failed');
      alert('Data submitted to MongoDB successfully!');
    } catch (err: any) {
      console.error(err);
      alert('MongoDB submit error: ' + err.message);
    }
  };\n\n`;
        }
      });
    }

    const pageNodes = collectAllNodes(rootNode);

    // Filter flows relevant to this page
    const pageFlows = (logicFlows || []).filter(f =>
      pageNodes.some(n => n.id === f.triggerNodeId || n.id === f.targetNodeId)
    );

    // Identify target elements of set-text and set-image to declare states
    const setTextTargets = Array.from(new Set(pageFlows.filter(f => f.actionType === 'set-text' && f.targetNodeId).map(f => f.targetNodeId!)));
    const setImageTargets = Array.from(new Set(pageFlows.filter(f => f.actionType === 'set-image' && f.targetNodeId).map(f => f.targetNodeId!)));

    setTextTargets.forEach(targetId => {
      const targetNode = pageNodes.find(n => n.id === targetId);
      const defaultText = targetNode ? (targetNode.props.text || '') : '';
      stateDecls += `  const [text_${targetId.replace(/-/g, '_')}, setText_${targetId.replace(/-/g, '_')}] = React.useState(${JSON.stringify(defaultText)});\n`;
    });

    setImageTargets.forEach(targetId => {
      const targetNode = pageNodes.find(n => n.id === targetId);
      const defaultUrl = targetNode ? (targetNode.props.imageUrl || '') : '';
      stateDecls += `  const [image_${targetId.replace(/-/g, '_')}, setImage_${targetId.replace(/-/g, '_')}] = React.useState(${JSON.stringify(defaultUrl)});\n`;
    });

    // Generate event handlers for logicFlows & customScripts
    let hasNavigateAction = false;

    pageNodes.forEach(n => {
      const nodeClickFlows = pageFlows.filter(f => f.triggerNodeId === n.id && f.triggerEvent === 'click');
      const nodeHoverFlows = pageFlows.filter(f => f.triggerNodeId === n.id && f.triggerEvent === 'hover');
      const hasScript = customScripts && customScripts[n.id];

      if (nodeClickFlows.length > 0 || hasScript) {
        let statements = '';
        nodeClickFlows.forEach(flow => {
          if (flow.actionType === 'set-text' && flow.targetNodeId) {
            statements += `    setText_${flow.targetNodeId.replace(/-/g, '_')}(${JSON.stringify(flow.dataMapping || '')});\n`;
          } else if (flow.actionType === 'set-image' && flow.targetNodeId) {
            statements += `    setImage_${flow.targetNodeId.replace(/-/g, '_')}(${JSON.stringify(flow.dataMapping || '')});\n`;
          } else if (flow.actionType === 'toast') {
            statements += `    alert(${JSON.stringify(flow.dataMapping || '')});\n`;
          } else if (flow.actionType === 'navigate') {
            hasNavigateAction = true;
            statements += `    router.push("/${flow.dataMapping === 'index' ? '' : flow.dataMapping}");\n`;
          } else if (flow.actionType === 'custom-code' && flow.customCode) {
            statements += `    try {\n      ${flow.customCode}\n    } catch (e) { console.error(e); }\n`;
          } else if (flow.actionType === 'db-select' || flow.actionType === 'db-insert') {
            statements += `    alert("Simulated database query/insert successfully!");\n`;
          }
        });
        if (hasScript) {
          statements += `    try {\n      ${customScripts[n.id]}\n    } catch (e) { console.error(e); }\n`;
        }

        submitHandlers += `  const handle_click_${n.id.replace(/-/g, '_')} = (e?: React.MouseEvent) => {\n    if (e) e.preventDefault();\n${statements}  };\n\n`;
      }

      if (nodeHoverFlows.length > 0) {
        let statements = '';
        nodeHoverFlows.forEach(flow => {
          if (flow.actionType === 'set-text' && flow.targetNodeId) {
            statements += `    setText_${flow.targetNodeId.replace(/-/g, '_')}(${JSON.stringify(flow.dataMapping || '')});\n`;
          } else if (flow.actionType === 'set-image' && flow.targetNodeId) {
            statements += `    setImage_${flow.targetNodeId.replace(/-/g, '_')}(${JSON.stringify(flow.dataMapping || '')});\n`;
          } else if (flow.actionType === 'toast') {
            statements += `    alert(${JSON.stringify(flow.dataMapping || '')});\n`;
          } else if (flow.actionType === 'navigate') {
            hasNavigateAction = true;
            statements += `    router.push("/${flow.dataMapping === 'index' ? '' : flow.dataMapping}");\n`;
          } else if (flow.actionType === 'custom-code' && flow.customCode) {
            statements += `    try {\n      ${flow.customCode}\n    } catch (e) { console.error(e); }\n`;
          }
        });

        submitHandlers += `  const handle_hover_${n.id.replace(/-/g, '_')} = () => {\n${statements}  };\n\n`;
      }
    });

    const compileNode = (n: CanvasNode, depth: number = 0): string => {
      const indent = '  '.repeat(depth);
      const mappedStyles = mapStyleProps(n.props.style || {});
      
      const styleEntries = Object.entries(mappedStyles)
        .map(([key, val]) => `${key}: "${val}"`)
        .join(', ');
      const styleAttr = styleEntries ? ` style={{ ${styleEntries} }}` : '';
      
      const classes = [];
      if (n.props.className) classes.push(n.props.className);
      if (n.props.animation && n.props.animation !== 'none') {
        classes.push(`animate-entrance-${n.props.animation}`);
      }
      if (n.props.hoverEffect && n.props.hoverEffect !== 'none') {
        classes.push(`hover-effect-${n.props.hoverEffect}`);
      }
      const classAttr = classes.length > 0 ? ` className="${classes.join(' ')}"` : '';

      const isReadBound = hasDb && n.props.dataBinding && n.props.dataBinding.bindType === 'read';
      let readValueExpression = '';
      if (isReadBound && n.props.dataBinding) {
        const tbl = dbTables.find(t => t.id === n.props.dataBinding?.tableId);
        const tableName = tbl ? tbl.name.toLowerCase() : 'data';
        readValueExpression = `{${tableName}Data?.${n.props.dataBinding.columnName} || "${n.props.text || ''}"}`;
      }

      // Check for attached events
      let clickAttr = '';
      const nodeClickFlows = pageFlows.filter(f => f.triggerNodeId === n.id && f.triggerEvent === 'click');
      const hasScript = customScripts && customScripts[n.id];
      if (nodeClickFlows.length > 0 || hasScript) {
        clickAttr = ` onClick={handle_click_${n.id.replace(/-/g, '_')}}`;
      }

      let hoverAttr = '';
      const nodeHoverFlows = pageFlows.filter(f => f.triggerNodeId === n.id && f.triggerEvent === 'hover');
      if (nodeHoverFlows.length > 0) {
        hoverAttr = ` onMouseEnter={handle_hover_${n.id.replace(/-/g, '_')}}`;
      }

      if (n.type === 'Container') {
        if (n.children.length === 0) {
          return `${indent}<div id="${n.id}"${classAttr}${styleAttr}${clickAttr}${hoverAttr} />`;
        }
        const childrenCode = n.children.map(c => compileNode(c, depth + 1)).join('\n');
        return `${indent}<div id="${n.id}"${classAttr}${styleAttr}${clickAttr}${hoverAttr}>\n${childrenCode}\n${indent}</div>`;
      }

      if (n.type === 'TextBlock') {
        const Tag = n.props.tag || 'p';
        const val = setTextTargets.includes(n.id) 
          ? `{text_${n.id.replace(/-/g, '_')}}` 
          : (isReadBound ? readValueExpression : (n.props.text || ''));
        return `${indent}<${Tag} id="${n.id}"${classAttr}${styleAttr}${clickAttr}${hoverAttr}>${val}</${Tag}>`;
      }

      if (n.type === 'Button') {
        const isWriteBound = hasDb && n.props.dataBinding && n.props.dataBinding.bindType === 'write';
        if (nodeClickFlows.length === 0 && !hasScript && isWriteBound && n.props.dataBinding) {
          const tbl = dbTables.find(t => t.id === n.props.dataBinding?.tableId);
          const tableName = tbl ? tbl.name : 'data';
          const handlerName = `handle${tableName.charAt(0).toUpperCase()}${tableName.slice(1).toLowerCase()}Submit`;
          clickAttr = ` onClick={${handlerName}}`;
        }

        const buttonText = setTextTargets.includes(n.id) 
          ? `{text_${n.id.replace(/-/g, '_')}}` 
          : (isReadBound ? readValueExpression : (n.props.text || ''));
        const btnJsx = `<button id="${n.id}"${classAttr}${styleAttr}${clickAttr}${hoverAttr}>${buttonText}</button>`;
        if (n.props.linkTo && n.props.linkTo !== '#') {
          let href = n.props.linkTo;
          if (pages[href]) {
            href = `/${href === 'index' ? '' : href}`;
          }
          return `${indent}<Link href="${href}" passHref legacyBehavior>\n${indent}  ${btnJsx}\n${indent}</Link>`;
        }
        return `${indent}${btnJsx}`;
      }

      if (n.type === 'ImageBlock') {
        let srcAttr = setImageTargets.includes(n.id)
          ? `src={image_${n.id.replace(/-/g, '_')}}`
          : (isReadBound && n.props.dataBinding
              ? (()=>{
                  const tbl = dbTables.find(t => t.id === n.props.dataBinding?.tableId);
                  const tableName = tbl ? tbl.name.toLowerCase() : 'data';
                  return `src={${tableName}Data?.${n.props.dataBinding.columnName} || "${n.props.imageUrl || ''}"}`;
                })()
              : `src="${n.props.imageUrl || ''}"`
            );
        return `${indent}<img id="${n.id}" ${srcAttr} alt="${n.props.imageAlt || ''}"${classAttr}${styleAttr}${clickAttr}${hoverAttr} />`;
      }

      if (n.type === 'Divider') {
        return `${indent}<hr id="${n.id}"${classAttr}${styleAttr}${clickAttr}${hoverAttr} />`;
      }

      if (n.type === 'Icon') {
        const IconComponent = n.props.iconName || 'Star';
        return `${indent}<${IconComponent} id="${n.id}"${classAttr}${styleAttr}${clickAttr}${hoverAttr} />`;
      }

      return '';
    };

    const body = compileNode(rootNode, 2);
    const usedIcons = collectUsedIcons(rootNode);
    const importIcons = usedIcons.length > 0 
      ? `import { ${usedIcons.join(', ')} } from 'lucide-react';\n`
      : "";

    const nodeString = JSON.stringify(rootNode);
    const hasLink = nodeString.includes('"linkTo"') && !nodeString.includes('"linkTo":"#"');
    const importLink = hasLink ? "import Link from 'next/link';\n" : "";
    const importRouter = hasNavigateAction ? "import { useRouter } from 'next/router';\n" : "";

    result[`/pages/${pageId}.tsx`] = `import React from 'react';
${importLink}${importIcons}${importRouter}${dbImports}
export default function ${pageId.charAt(0).toUpperCase() + pageId.slice(1)}Page() {
${hasNavigateAction ? '  const router = useRouter();\n' : ''}${stateDecls}
${fetchEffects}${submitHandlers}  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-slate-900 overflow-x-hidden">
      {/* Global CSS styles for Canva animations and hover effects */}
      <style dangerouslySetInnerHTML={{ __html: \`${cssVars}${CUSTOM_STYLE_BLOCK}\` }} />
${body}
    </div>
  );
}
`;
  });

  return result;
}

const collectUsedIcons = (root: CanvasNode): string[] => {
  const list: string[] = [];
  const traverse = (n: CanvasNode) => {
    if (n.type === 'Icon' && n.props.iconName) {
      list.push(n.props.iconName);
    }
    n.children.forEach(traverse);
  };
  traverse(root);
  return Array.from(new Set(list));
};

const collectAllNodes = (root: CanvasNode): CanvasNode[] => {
  const nodes: CanvasNode[] = [];
  const traverse = (n: CanvasNode) => {
    nodes.push(n);
    n.children.forEach(traverse);
  };
  traverse(root);
  return nodes;
};

/**
 * Traverses the Visual Node JSON Tree and compiles it into static HTML with inline CSS.
 */
export function generateHtmlCode(
  pages: Record<string, CanvasNode>,
  dbConfig: DatabaseConfig | null = null,
  dbTables: DatabaseTable[] = [],
  customScripts: Record<string, string> = {},
  backendServices: any[] = [],
  themeTokens?: ThemeTokens,
  logicFlows: LogicFlow[] = []
): Record<string, string> {
  const result: Record<string, string> = {};

  const hasDb = dbConfig !== null;
  const provider = dbConfig?.provider;

  // 1. Generate CSS Variables block
  const colors = themeTokens?.colors || {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#8b5cf6',
    background: '#0f172a',
    text: '#f8fafc'
  };
  const fonts = themeTokens?.fonts || {
    heading: 'Geist',
    body: 'Geist'
  };

  let cssVars = `\n  :root {\n`;
  Object.entries(colors).forEach(([k, v]) => {
    cssVars += `    --color-${k}: ${v};\n`;
  });
  Object.entries(fonts).forEach(([k, v]) => {
    cssVars += `    --font-${k}: ${v}, sans-serif;\n`;
  });
  cssVars += `  }\n`;

  Object.entries(pages).forEach(([pageId, rootNode]) => {
    const pageBindings = collectDataBindings(rootNode);
    const readBindings = pageBindings.filter(b => b.bindType === 'read');
    const writeBindings = pageBindings.filter(b => b.bindType === 'write');

    const compileNode = (n: CanvasNode, depth: number = 0): string => {
      const indent = '  '.repeat(depth);
      const mappedStyles = mapStyleProps(n.props.style || {});
      
      const styleEntries = Object.entries(mappedStyles)
        .map(([key, val]) => `${kebabCase(key)}: ${val};`)
        .join(' ');
      const styleAttr = styleEntries ? ` style="${styleEntries}"` : '';
      
      const classes = [];
      if (n.props.className) classes.push(n.props.className);
      if (n.props.animation && n.props.animation !== 'none') {
        classes.push(`animate-entrance-${n.props.animation}`);
      }
      if (n.props.hoverEffect && n.props.hoverEffect !== 'none') {
        classes.push(`hover-effect-${n.props.hoverEffect}`);
      }
      const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';

      if (n.type === 'Container') {
        if (n.children.length === 0) {
          return `${indent}<div id="${n.id}"${classAttr}${styleAttr}></div>`;
        }
        const childrenCode = n.children.map(c => compileNode(c, depth + 1)).join('\n');
        return `${indent}<div id="${n.id}"${classAttr}${styleAttr}>\n${childrenCode}\n${indent}</div>`;
      }

      if (n.type === 'TextBlock') {
        const Tag = n.props.tag || 'p';
        return `${indent}<${Tag} id="${n.id}"${classAttr}${styleAttr}>${n.props.text || ''}</${Tag}>`;
      }

      if (n.type === 'Button') {
        const btnTag = `<button id="${n.id}"${classAttr}${styleAttr}>${n.props.text || ''}</button>`;
        if (n.props.linkTo && n.props.linkTo !== '#') {
          let href = n.props.linkTo;
          if (pages[href]) {
            href = `${href}.html`;
          }
          return `${indent}<a href="${href}" style="text-decoration: none;">\n${indent}  ${btnTag}\n${indent}</a>`;
        }
        return `${indent}${btnTag}`;
      }

      if (n.type === 'ImageBlock') {
        return `${indent}<img id="${n.id}" src="${n.props.imageUrl || ''}" alt="${n.props.imageAlt || ''}"${classAttr}${styleAttr} />`;
      }

      if (n.type === 'Divider') {
        return `${indent}<hr id="${n.id}"${classAttr}${styleAttr} />`;
      }

      if (n.type === 'Icon') {
        const iconName = n.props.iconName || 'Star';
        return `${indent}<i id="${n.id}" data-lucide="${kebabCase(iconName)}"${classAttr}${styleAttr}></i>`;
      }

      return '';
    };

    const body = compileNode(rootNode, 2);
    const nodeString = JSON.stringify(rootNode);
    const hasIcons = nodeString.includes('"type":"Icon"');
    
    const lucideScriptImport = hasIcons 
      ? '  <script src="https://unpkg.com/lucide@latest"></script>\n' 
      : '';

    const lucideScriptInit = hasIcons 
      ? '  <script>\n    lucide.createIcons();\n  </script>\n' 
      : '';

    // Generate Client-Side Integration Scripts for HTML
    let dbScriptTag = '';
    if (hasDb && (readBindings.length > 0 || writeBindings.length > 0)) {
      if (provider === 'supabase') {
        const readTables = Array.from(new Set(readBindings.map(b => b.tableId)))
          .map(tId => dbTables.find(t => t.id === tId))
          .filter(Boolean);

        const readBindingsCode = readTables.map(tbl => {
          const tName = tbl!.name;
          const boundNodes = readBindings.filter(b => b.tableId === tbl!.id);
          const updateStatements = boundNodes.map(b => {
            const isImg = b.type === 'ImageBlock';
            const setter = isImg ? 'src' : 'innerText';
            return `            const el_${b.nodeId} = document.getElementById('${b.nodeId}');
            if (el_${b.nodeId}) el_${b.nodeId}.${setter} = data.${b.columnName} || "${isImg ? b.imageUrl : b.text}";`;
          }).join('\n');

          return `        // Fetch single row from ${tName}
        const { data, error } = await supabaseClient.from('${tName}').select('*').limit(1).maybeSingle();
        if (!error && data) {
${updateStatements}
        }`;
        }).join('\n');

        const writeBindingsCode = writeBindings.map(binding => {
          const tbl = dbTables.find(t => t.id === binding.tableId);
          const tableName = tbl ? tbl.name : 'data';
          const columns = tbl ? tbl.columns : [];
          const payloadFields = columns
            .filter(c => c.name.toLowerCase() !== 'id')
            .map(c => {
              let val = '""';
              if (c.type === 'number') val = '0';
              if (c.type === 'boolean') val = 'false';
              if (c.type === 'date') val = 'new Date().toISOString()';
              return `          ${c.name}: ${val}`;
            })
            .join(',\n');

          return `      const btn_${binding.nodeId} = document.getElementById('${binding.nodeId}');
      if (btn_${binding.nodeId}) {
        btn_${binding.nodeId}.addEventListener('click', async (e) => {
          e.preventDefault();
          const payload = {
${payloadFields}
          };
          try {
            const { data, error } = await supabaseClient.from('${tableName}').insert([payload]);
            if (error) throw error;
            alert('Submitted to Supabase successfully!');
          } catch(err) {
            alert('Error: ' + err.message);
          }
        });
      }`;
        }).join('\n');

        dbScriptTag = `
  <!-- Supabase JS Client SDK -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    const supabaseUrl = "${dbConfig.supabaseUrl || ''}";
    const supabaseAnonKey = "${dbConfig.supabaseAnonKey || ''}";
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Process Reads
      try {
${readBindingsCode}
      } catch(e) {
        console.error('Supabase load error:', e);
      }

      // 2. Process Writes
${writeBindingsCode}
    });
  </script>
`;
      } else if (provider === 'firebase') {
        const fb = dbConfig.firebaseConfig || {};
        const readTables = Array.from(new Set(readBindings.map(b => b.tableId)))
          .map(tId => dbTables.find(t => t.id === tId))
          .filter(Boolean);

        const readBindingsCode = readTables.map(tbl => {
          const tName = tbl!.name;
          const boundNodes = readBindings.filter(b => b.tableId === tbl!.id);
          const updateStatements = boundNodes.map(b => {
            const isImg = b.type === 'ImageBlock';
            const setter = isImg ? 'src' : 'innerText';
            return `            const el_${b.nodeId} = document.getElementById('${b.nodeId}');
            if (el_${b.nodeId}) el_${b.nodeId}.${setter} = data.${b.columnName} || "${isImg ? b.imageUrl : b.text}";`;
          }).join('\n');

          return `        const querySnapshot = await getDocs(collection(db, '${tName}'));
        if (!querySnapshot.empty) {
          const data = querySnapshot.docs[0].data();
${updateStatements}
        }`;
        }).join('\n');

        const writeBindingsCode = writeBindings.map(binding => {
          const tbl = dbTables.find(t => t.id === binding.tableId);
          const tableName = tbl ? tbl.name : 'data';
          const columns = tbl ? tbl.columns : [];
          const payloadFields = columns
            .filter(c => c.name.toLowerCase() !== 'id')
            .map(c => {
              let val = '""';
              if (c.type === 'number') val = '0';
              if (c.type === 'boolean') val = 'false';
              if (c.type === 'date') val = 'new Date().toISOString()';
              return `            ${c.name}: ${val}`;
            })
            .join(',\n');

          return `      const btn_${binding.nodeId} = document.getElementById('${binding.nodeId}');
      if (btn_${binding.nodeId}) {
        btn_${binding.nodeId}.addEventListener('click', async (e) => {
          e.preventDefault();
          const payload = {
${payloadFields}
          };
          try {
            await addDoc(collection(db, '${tableName}'), payload);
            alert('Submitted to Firestore successfully!');
          } catch(err) {
            alert('Firestore error: ' + err.message);
          }
        });
      }`;
        }).join('\n');

        dbScriptTag = `
  <script type="module">
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
    import { getFirestore, collection, getDocs, addDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

    const firebaseConfig = {
      apiKey: "${fb.apiKey || ''}",
      authDomain: "${fb.authDomain || ''}",
      projectId: "${fb.projectId || ''}"
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Process Reads
      try {
${readBindingsCode}
      } catch(e) {
        console.error('Firestore load error:', e);
      }

      // 2. Process Writes
${writeBindingsCode}
    });
  </script>
`;
      } else if (provider === 'mongodb') {
        const readTables = Array.from(new Set(readBindings.map(b => b.tableId)))
          .map(tId => dbTables.find(t => t.id === tId))
          .filter(Boolean);

        const readBindingsCode = readTables.map(tbl => {
          const tName = tbl!.name;
          const boundNodes = readBindings.filter(b => b.tableId === tbl!.id);
          const updateStatements = boundNodes.map(b => {
            const isImg = b.type === 'ImageBlock';
            const setter = isImg ? 'src' : 'innerText';
            return `            const el_${b.nodeId} = document.getElementById('${b.nodeId}');
            if (el_${b.nodeId}) el_${b.nodeId}.${setter} = data.${b.columnName} || "${isImg ? b.imageUrl : b.text}";`;
          }).join('\n');

          return `        const res = await fetch('/api/data/${tName}');
        if (res.ok) {
          const data = await res.json();
${updateStatements}
        }`;
        }).join('\n');

        const writeBindingsCode = writeBindings.map(binding => {
          const tbl = dbTables.find(t => t.id === binding.tableId);
          const tableName = tbl ? tbl.name : 'data';
          const columns = tbl ? tbl.columns : [];
          const payloadFields = columns
            .filter(c => c.name.toLowerCase() !== 'id')
            .map(c => {
              let val = '""';
              if (c.type === 'number') val = '0';
              if (c.type === 'boolean') val = 'false';
              if (c.type === 'date') val = 'new Date().toISOString()';
              return `          ${c.name}: ${val}`;
            })
            .join(',\n');

          return `      const btn_${binding.nodeId} = document.getElementById('${binding.nodeId}');
      if (btn_${binding.nodeId}) {
        btn_${binding.nodeId}.addEventListener('click', async (e) => {
          e.preventDefault();
          const payload = {
${payloadFields}
          };
          try {
            const res = await fetch('/api/data/${tableName}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('API failed');
            alert('Submitted to MongoDB API successfully!');
          } catch(err) {
            alert('Error: ' + err.message);
          }
        });
      }`;
        }).join('\n');

        dbScriptTag = `
  <script>
    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Process Reads
      try {
${readBindingsCode}
      } catch(e) {
        console.error('MongoDB load error:', e);
      }

      // 2. Process Writes
${writeBindingsCode}
    });
  </script>
`;
      }
    }

    // Generate Custom Script Event Listeners for HTML
    let customScriptTag = '';
    const pageNodes = collectAllNodes(rootNode);
    const pageScripts = pageNodes.filter(n => customScripts && customScripts[n.id]);
    
    if (pageScripts.length > 0) {
      let scriptBindingsCode = '';
      pageScripts.forEach(n => {
        const code = customScripts[n.id];
        scriptBindingsCode += `      const el_custom_${n.id.replace(/-/g, '_')} = document.getElementById('${n.id}');
      if (el_custom_${n.id.replace(/-/g, '_')}) {
        el_custom_${n.id.replace(/-/g, '_')}.addEventListener('click', (e) => {
          try {
            ${code}
          } catch(err) {
            console.error('Custom script error for ${n.id}:', err.message);
          }
        });
      }\n`;
      });

      customScriptTag = `
  <!-- Visual Custom Scripts -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
${scriptBindingsCode}    });
  </script>
`;
    }

    // Generate Visual Logic Flows Event Listeners for HTML
    let logicScriptCode = '';
    const pageFlows = (logicFlows || []).filter(f =>
      pageNodes.some(n => n.id === f.triggerNodeId || n.id === f.targetNodeId)
    );

    const flowsByEvent: Record<string, { triggerNodeId: string; triggerEvent: string; flows: LogicFlow[] }> = {};
    pageFlows.forEach(flow => {
      const key = `${flow.triggerNodeId}_${flow.triggerEvent}`;
      if (!flowsByEvent[key]) {
        flowsByEvent[key] = { triggerNodeId: flow.triggerNodeId, triggerEvent: flow.triggerEvent, flows: [] };
      }
      flowsByEvent[key].flows.push(flow);
    });

    Object.values(flowsByEvent).forEach(({ triggerNodeId, triggerEvent, flows }) => {
      const domEvent = triggerEvent === 'hover' ? 'mouseenter' : triggerEvent;
      let statements = '';
      flows.forEach(flow => {
        if (flow.actionType === 'set-text' && flow.targetNodeId) {
          statements += `          const target_${flow.targetNodeId.replace(/-/g, '_')} = document.getElementById('${flow.targetNodeId}');\n`;
          statements += `          if (target_${flow.targetNodeId.replace(/-/g, '_')}) target_${flow.targetNodeId.replace(/-/g, '_')}.innerText = ${JSON.stringify(flow.dataMapping || '')};\n`;
        } else if (flow.actionType === 'set-image' && flow.targetNodeId) {
          statements += `          const target_${flow.targetNodeId.replace(/-/g, '_')} = document.getElementById('${flow.targetNodeId}');\n`;
          statements += `          if (target_${flow.targetNodeId.replace(/-/g, '_')}) target_${flow.targetNodeId.replace(/-/g, '_')}.src = ${JSON.stringify(flow.dataMapping || '')};\n`;
        } else if (flow.actionType === 'toast') {
          statements += `          alert(${JSON.stringify(flow.dataMapping || '')});\n`;
        } else if (flow.actionType === 'navigate') {
          statements += `          window.location.href = "${flow.dataMapping}.html";\n`;
        } else if (flow.actionType === 'custom-code' && flow.customCode) {
          statements += `          try {\n            ${flow.customCode}\n          } catch (e) { console.error(e); }\n`;
        } else if (flow.actionType === 'db-select' || flow.actionType === 'db-insert') {
          statements += `          alert("Simulated database query/insert successfully!");\n`;
        }
      });

      logicScriptCode += `      const el_${triggerNodeId.replace(/-/g, '_')} = document.getElementById('${triggerNodeId}');\n`;
      logicScriptCode += `      if (el_${triggerNodeId.replace(/-/g, '_')}) {\n`;
      logicScriptCode += `        el_${triggerNodeId.replace(/-/g, '_')}.addEventListener('${domEvent}', (e) => {\n`;
      if (domEvent === 'click') {
        logicScriptCode += `          e.preventDefault();\n`;
      }
      logicScriptCode += `${statements}        });\n`;
      logicScriptCode += `      }\n`;
    });

    let logicScriptTag = '';
    if (logicScriptCode) {
      logicScriptTag = `
  <!-- Visual Logic Flows -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
${logicScriptCode}    });
  </script>
`;
    }

    result[`/${pageId}.html`] = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageId.charAt(0).toUpperCase() + pageId.slice(1)}</title>
  <!-- Load Tailwind CSS Play CDN for instant local rendering -->
  <script src="https://cdn.tailwindcss.com"></script>
${lucideScriptImport}  <style>
${cssVars}${CUSTOM_STYLE_BLOCK}  </style>
</head>
<body class="bg-slate-900 text-white min-h-screen flex flex-col items-center justify-center m-0 overflow-x-hidden">
${body}
${lucideScriptInit}${dbScriptTag}${customScriptTag}${logicScriptTag}</body>
</html>
`;
  });

  return result;
}

