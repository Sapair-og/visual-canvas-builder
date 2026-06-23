import { DatabaseConfig, DatabaseTable, DataBinding } from './database';

export type NodeType = 'Container' | 'TextBlock' | 'Button' | 'ImageBlock' | 'Divider' | 'Icon';

export interface ComponentStyles {
  // Freeform positioning
  position?: 'absolute' | 'relative' | 'static';
  left?: string;
  top?: string;

  // Dimensions
  width?: string;
  height?: string;
  minHeight?: string;
  
  // Spacing
  padding?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  
  margin?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Typography
  textAlign?: 'left' | 'center' | 'right' | 'justify';


  // Visuals
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;

  // Flexbox Layout (for Container)
  display?: 'flex' | 'block';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'stretch' | 'flex-start' | 'center' | 'flex-end';
  gap?: string;

  // Stacking order
  zIndex?: string;

  // Canva styles
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  backgroundImage?: string;
}

export interface ComponentProps {
  text?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  linkTo?: string;
  style?: ComponentStyles;
  className?: string; // Additional custom classes
  locked?: boolean; // Toggles crop-style resizing handles
  imageUrl?: string; // Used by ImageBlock
  imageAlt?: string; // Used by ImageBlock
  iconName?: 'Sparkles' | 'Mail' | 'Lock' | 'Settings' | 'Eye' | 'Heart' | 'Star' | 'Search' | 'Home' | 'User' | 'Phone' | 'Menu'; // Used by Icon
  layerName?: string; // Custom Photoshop-style layer rename
  visible?: boolean; // Photoshop-style layer eye visibility toggle
  animation?: 'fade' | 'slide-up' | 'zoom-in' | 'bounce' | 'none'; // Canva entrance animations
  hoverEffect?: 'scale' | 'lift' | 'glow' | 'none'; // Canva hover micro-interactions
  layerNo?: number; // Custom Photoshop-style layer number rank for layout flow
  dataBinding?: {
    tableId: string;
    columnName: string;
    bindType: 'read' | 'write';
  }; // Canva no-code database binding configuration
}

export interface CanvasNode {
  id: string;
  type: NodeType;
  props: ComponentProps;
  children: CanvasNode[];
}

export interface ProjectState {
  id: string;
  name: string;
  canvasState: CanvasNode; // Backwards compatibility for single page
  pages?: Record<string, CanvasNode>; // Multi-page routes mapping
  currentPageId?: string; // Current active editing page
  dbConfig?: DatabaseConfig; // Visual database credentials
  dbTables?: DatabaseTable[]; // Visual database schema tables
  dbBindings?: DataBinding[]; // Database binding arrows configuration
  customScripts?: Record<string, string>; // Script name/node ID -> javascript content
  backendServices?: { id: string; name: string; enabled: boolean; config: any }[]; // Backend visual services state
  userId: string;
  createdAt: string;
  updatedAt: string;
}
