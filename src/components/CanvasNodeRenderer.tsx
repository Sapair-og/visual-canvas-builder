'use client';

import React, { useState, useEffect } from 'react';
import { CanvasNode, NodeType } from '../types/canvas';
import { useEditor } from '../context/EditorContext';
import * as LucideIcons from 'lucide-react';

const parsePixelVal = (val?: string, defaultVal = 0): number => {
  if (!val) return defaultVal;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

interface CanvasNodeRendererProps {
  node: CanvasNode;
  parent?: CanvasNode;
}

export default function CanvasNodeRenderer({ node, parent }: CanvasNodeRendererProps) {
  const { selectedNodeId, selectNode, addNode, moveNode, updateNodeProps, snapToGrid, guides, isPreview } = useEditor();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(node.props.text || '');

  useEffect(() => {
    setLocalText(node.props.text || '');
  }, [node.props.text]);

  useEffect(() => {
    if (selectedNodeId !== node.id) {
      setIsEditing(false);
    }
  }, [selectedNodeId, node.id]);

  const isSelected = selectedNodeId === node.id;
  const isVisible = node.props.visible !== false;

  if (!isVisible && isPreview) {
    return null;
  }

  // Click handler to select this node in the editor properties sidebar
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectNode(node.id);
  };

  // Drag-and-drop event handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (node.id === 'root') return; // Cannot drag root container
    e.dataTransfer.setData('application/react-craft-node-id', node.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Save mouse cursor offset relative to target bounding box
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    e.dataTransfer.setData('application/react-craft-offset-x', offsetX.toString());
    e.dataTransfer.setData('application/react-craft-offset-y', offsetY.toString());

    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedType = e.dataTransfer.getData('application/react-craft-type') as NodeType;
    const draggedNodeId = e.dataTransfer.getData('application/react-craft-node-id');

    // Calculate mouse coordinate delta inside drop zone container
    const rect = e.currentTarget.getBoundingClientRect();
    const grabOffsetX = parseFloat(e.dataTransfer.getData('application/react-craft-offset-x') || '0');
    const grabOffsetY = parseFloat(e.dataTransfer.getData('application/react-craft-offset-y') || '0');
    
    let x = e.clientX - rect.left - (droppedType ? 0 : grabOffsetX);
    let y = e.clientY - rect.top - (droppedType ? 0 : grabOffsetY);

    if (snapToGrid) {
      const vGuides = guides.filter(g => g.type === 'vertical');
      const snapX = vGuides.find(g => Math.abs(g.value - x) <= 8);
      
      const hGuides = guides.filter(g => g.type === 'horizontal');
      const snapY = hGuides.find(g => Math.abs(g.value - y) <= 8);
      
      x = snapX ? snapX.value : Math.round(x / 16) * 16;
      y = snapY ? snapY.value : Math.round(y / 16) * 16;
    }

    // Clamping coordinates relative to parent container width and height
    let dragWidth = 180;
    let dragHeight = 40;
    
    if (droppedType) {
      if (droppedType === 'Container') { dragWidth = 240; dragHeight = 180; }
      else if (droppedType === 'TextBlock') { dragWidth = 180; dragHeight = 40; }
      else if (droppedType === 'Button') { dragWidth = 120; dragHeight = 36; }
      else if (droppedType === 'ImageBlock') { dragWidth = 240; dragHeight = 160; }
      else if (droppedType === 'Divider') { dragWidth = rect.width; dragHeight = 2; }
      else if (droppedType === 'Icon') { dragWidth = 32; dragHeight = 32; }
    } else if (draggedNodeId) {
      const draggedElement = document.getElementById(draggedNodeId);
      if (draggedElement) {
        dragWidth = draggedElement.offsetWidth;
        dragHeight = draggedElement.offsetHeight;
      }
    }
    
    const maxX = Math.max(0, rect.width - dragWidth);
    const maxY = Math.max(0, rect.height - dragHeight);
    
    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY));

    if (droppedType) {
      // Adding new element from library
      addNode(node.id, droppedType, undefined, { x, y });
    } else if (draggedNodeId && draggedNodeId !== node.id) {
      // Moving existing element in hierarchy
      moveNode(draggedNodeId, node.id, { x, y });
    }
  };

  // Mouse event resize math
  const handleResizeStart = (e: React.MouseEvent, direction: 'horizontal' | 'vertical' | 'both') => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const targetElement = e.currentTarget.parentElement!;
    const startWidth = targetElement.offsetWidth;
    const startHeight = targetElement.offsetHeight;

    let finalWidthVal = startWidth;
    let finalHeightVal = startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidthVal = startWidth + deltaX;
      let newHeightVal = startHeight + deltaY;

      const parentElement = targetElement.parentElement;
      const elementLeft = parsePixelVal(node.props.style?.left, 0);
      const elementTop = parsePixelVal(node.props.style?.top, 0);

      if (parentElement) {
        const parentW = parentElement.offsetWidth;
        const parentH = parentElement.offsetHeight;
        newWidthVal = Math.max(16, Math.min(newWidthVal, parentW - elementLeft));
        newHeightVal = Math.max(16, Math.min(newHeightVal, parentH - elementTop));
      }

      if (snapToGrid) {
        const vGuides = guides.filter(g => g.type === 'vertical');
        const hGuides = guides.filter(g => g.type === 'horizontal');
        
        const edgeX = elementLeft + newWidthVal;
        const edgeY = elementTop + newHeightVal;
        
        const snapX = vGuides.find(g => Math.abs(g.value - edgeX) <= 8);
        const snapY = hGuides.find(g => Math.abs(g.value - edgeY) <= 8);
        
        newWidthVal = snapX ? (snapX.value - elementLeft) : Math.round(newWidthVal / 16) * 16;
        newHeightVal = snapY ? (snapY.value - elementTop) : Math.round(newHeightVal / 16) * 16;

        if (parentElement) {
          const parentW = parentElement.offsetWidth;
          const parentH = parentElement.offsetHeight;
          newWidthVal = Math.max(16, Math.min(newWidthVal, parentW - elementLeft));
          newHeightVal = Math.max(16, Math.min(newHeightVal, parentH - elementTop));
        }
      }

      if (direction !== 'vertical') {
        targetElement.style.width = `${newWidthVal}px`;
        finalWidthVal = newWidthVal;
      }
      if (direction !== 'horizontal') {
        targetElement.style.height = `${newHeightVal}px`;
        finalHeightVal = newHeightVal;
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      const styleUpdates: any = {};
      if (direction !== 'vertical') {
        styleUpdates.width = `${finalWidthVal}px`;
      }
      if (direction !== 'horizontal') {
        styleUpdates.height = `${finalHeightVal}px`;
      }

      updateNodeProps(node.id, {
        style: {
          ...node.props.style,
          ...styleUpdates
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderResizeHandles = () => {
    if (!isSelected || node.props.locked) return null;
    return (
      <>
        {/* Right border resize handle */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
          className="absolute top-1/2 right-[-5px] translate-y-[-50%] w-2.5 h-2.5 bg-blue-500 border border-white rounded-full cursor-ew-resize hover:scale-125 z-40 shadow transition-transform"
          title="Drag to resize width"
        />
        {/* Bottom border resize handle */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'vertical')}
          className="absolute bottom-[-5px] left-1/2 translate-x-[-50%] w-2.5 h-2.5 bg-blue-500 border border-white rounded-full cursor-ns-resize hover:scale-125 z-40 shadow transition-transform"
          title="Drag to resize height"
        />
        {/* Bottom-right corner resize handle */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'both')}
          className="absolute bottom-[-5px] right-[-5px] w-2.5 h-2.5 bg-blue-500 border border-white rounded-full cursor-nwse-resize hover:scale-125 z-40 shadow transition-transform"
          title="Drag to resize width and height"
        />
      </>
    );
  };

  // Convert schema styling fields to valid inline CSS values
  const getInlineStyles = (): React.CSSProperties => {
    const s = node.props.style || {};
    let bgImg = s.backgroundImage;
    if (bgImg) {
      if (!bgImg.startsWith('linear-gradient') && !bgImg.startsWith('url(')) {
        bgImg = `url("${bgImg}")`;
      }
    }

    const layerNo = node.props.layerNo !== undefined ? Number(node.props.layerNo) : 1;

    // Check siblings to enforce flow vs absolute stacking
    let hasSiblingWithSameLayer = false;
    if (parent && parent.children) {
      const siblings = parent.children.filter(c => c.id !== node.id);
      hasSiblingWithSameLayer = siblings.some(sibling => {
        const sibLayerNo = sibling.props.layerNo !== undefined ? Number(sibling.props.layerNo) : 1;
        return sibLayerNo === layerNo;
      });
    }

    const forceRelative = node.id !== 'root' && hasSiblingWithSameLayer;

    return {
      position: node.id === 'root' ? 'relative' : (forceRelative ? 'relative' : (s.position || 'absolute')),
      left: forceRelative ? undefined : s.left,
      top: forceRelative ? undefined : s.top,
      zIndex: forceRelative ? undefined : layerNo,

      width: s.width,
      height: s.height,
      minHeight: s.minHeight,
      
      padding: s.padding,
      paddingTop: s.paddingTop,
      paddingRight: s.paddingRight,
      paddingBottom: s.paddingBottom,
      paddingLeft: s.paddingLeft,
      
      margin: s.margin,
      marginTop: s.marginTop,
      marginRight: s.marginRight,
      marginBottom: s.marginBottom,
      marginLeft: s.marginLeft,

      backgroundColor: s.backgroundColor,
      backgroundImage: bgImg,
      backgroundSize: s.backgroundImage ? 'cover' : undefined,
      backgroundPosition: s.backgroundImage ? 'center' : undefined,
      color: s.textColor,
      borderRadius: s.borderRadius,
      borderColor: s.borderColor,
      borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
      borderStyle: s.borderStyle || (s.borderWidth ? 'solid' : undefined),

      // Flex properties for Container
      display: node.type === 'Container' ? (s.display || 'flex') : undefined,
      flexDirection: s.flexDirection || 'column',
      justifyContent: s.justifyContent || 'flex-start',
      alignItems: s.alignItems || 'stretch',
      gap: s.gap,

      textAlign: s.textAlign,
      fontSize: s.fontSize,
      fontWeight: s.fontWeight,
      fontStyle: s.fontStyle,
    } as React.CSSProperties;
  };

  const renderComponent = () => {
    const inlineStyles = getInlineStyles();
    const childElements = node.children.map((child) => (
      <CanvasNodeRenderer key={child.id} node={child} parent={node} />
    ));

    const animationClass = node.props.animation && node.props.animation !== 'none'
      ? `animate-entrance-${node.props.animation}`
      : '';
    const hoverEffectClass = node.props.hoverEffect && node.props.hoverEffect !== 'none'
      ? `hover-effect-${node.props.hoverEffect}`
      : '';

    // Editor classes for outline highlights
    const editorOutlineClass = isPreview
      ? `${animationClass} ${hoverEffectClass}`
      : `relative group/node transition-all duration-150 ${
          isSelected 
            ? 'neon-border-selected border-blue-500' 
            : 'outline outline-1 outline-transparent hover:outline-blue-500/30 hover:neon-border-glow'
        } ${
          isDragOver 
            ? node.type === 'Container'
              ? 'bg-blue-900/15 border-2 border-dashed border-blue-500/50' 
              : 'border-t-2 border-t-blue-500'
            : ''
        } ${node.props.locked ? 'pointer-events-none' : ''} ${!isVisible ? 'opacity-30 border border-dashed border-red-500/30' : ''} ${animationClass} ${hoverEffectClass}`;

    switch (node.type) {
      case 'Container':
        return (
          <div
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            draggable={node.id !== 'root'}
            onDragStart={handleDragStart}
            style={inlineStyles}
            className={`${editorOutlineClass} ${node.props.className || ''}`}
          >
            {/* Visual element tag badge overlay */}
            {!isPreview && (
              <div className="absolute top-1 left-2 bg-blue-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/node:opacity-100 transition-opacity z-10 select-none pointer-events-none">
                Container
              </div>
            )}
            {isSelected && !isPreview && (
              <div className="absolute top-[-18px] left-[-2px] bg-blue-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-t-md z-40 pointer-events-none select-none shadow">
                {node.props.layerName || 'Container'}
              </div>
            )}
            
            {node.children.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-8 text-[11px] text-slate-500 border border-dashed border-slate-700/60 rounded-md pointer-events-none select-none">
                Empty Box (Drop components here)
              </div>
            )}
            {childElements}
            {renderResizeHandles()}
          </div>
        );

      case 'TextBlock':
        const Tag = node.props.tag || 'p';
        if (!isPreview && isEditing) {
          return (
            <textarea
              autoFocus
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                if (localText !== node.props.text) {
                  updateNodeProps(node.id, { text: localText });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  setIsEditing(false);
                  if (localText !== node.props.text) {
                    updateNodeProps(node.id, { text: localText });
                  }
                }
              }}
              style={{
                ...inlineStyles,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                color: inlineStyles.color || '#ffffff',
                fontFamily: 'inherit',
              }}
              className={`${editorOutlineClass} ${node.props.className || ''}`}
            />
          );
        }
        if (isPreview) {
          return (
            <Tag
              style={inlineStyles}
              className={`${editorOutlineClass} ${node.props.className || ''}`}
            >
              {node.props.text}
            </Tag>
          );
        }
        return (
          <div
            onClick={handleClick}
            onDoubleClick={() => setIsEditing(true)}
            draggable={!isPreview && !isSelected}
            onDragStart={handleDragStart}
            style={inlineStyles}
            className={`${editorOutlineClass} ${node.props.className || ''}`}
          >
            {/* Visual element tag badge overlay */}
            <div className="absolute top-1 left-2 bg-indigo-650 text-[8px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/node:opacity-100 transition-opacity z-10 select-none pointer-events-none">
              Text ({Tag})
            </div>
            {isSelected && (
              <div className="absolute top-[-18px] left-[-2px] bg-indigo-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-t-md z-40 pointer-events-none select-none shadow">
                {node.props.layerName || `Text (${Tag})`}
              </div>
            )}
            <Tag style={{ margin: 0, padding: 0, fontSize: 'inherit', fontWeight: 'inherit', fontStyle: 'inherit', color: 'inherit', textAlign: 'inherit' }}>
              {node.props.text}
            </Tag>
            {renderResizeHandles()}
          </div>
        );

      case 'Button':
        if (!isPreview && isEditing) {
          return (
            <input
              type="text"
              autoFocus
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                if (localText !== node.props.text) {
                  updateNodeProps(node.id, { text: localText });
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === 'Escape') {
                  setIsEditing(false);
                  if (localText !== node.props.text) {
                    updateNodeProps(node.id, { text: localText });
                  }
                }
              }}
              style={{
                ...inlineStyles,
                backgroundColor: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                height: '100%',
                padding: 0,
                margin: 0,
                color: inlineStyles.color || '#ffffff',
                textAlign: inlineStyles.textAlign || 'center',
                fontFamily: 'inherit',
              }}
              className={`${editorOutlineClass} ${node.props.className || ''}`}
            />
          );
        }
        if (isPreview) {
          return (
            <button
              onClick={handleClick}
              style={inlineStyles}
              className={`${editorOutlineClass} ${node.props.className || ''}`}
            >
              {node.props.text}
            </button>
          );
        }
        return (
          <div
            onClick={handleClick}
            onDoubleClick={() => setIsEditing(true)}
            draggable={!isPreview && !isSelected}
            onDragStart={handleDragStart}
            style={inlineStyles}
            className={`${editorOutlineClass} ${node.props.className || ''}`}
          >
            {/* Visual element tag badge overlay */}
            <div className="absolute top-1 left-2 bg-purple-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/node:opacity-100 transition-opacity z-10 select-none pointer-events-none">
              Button
            </div>
            {isSelected && (
              <div className="absolute top-[-18px] left-[-2px] bg-purple-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-t-md z-40 pointer-events-none select-none shadow font-sans">
                {node.props.layerName || 'Button'}
              </div>
            )}
            <button
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                font: 'inherit',
                padding: 0,
                margin: 0,
                width: '100%',
                height: '100%',
                textAlign: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              {node.props.text}
            </button>
            {renderResizeHandles()}
          </div>
        );

      case 'ImageBlock':
        return (
          <div
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            style={inlineStyles}
            className={`${editorOutlineClass} ${node.props.className || ''}`}
          >
            {/* Visual element tag badge overlay */}
            {!isPreview && (
              <div className="absolute top-1 left-2 bg-emerald-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/node:opacity-100 transition-opacity z-10 select-none pointer-events-none font-sans">
                Image
              </div>
            )}
            {isSelected && !isPreview && (
              <div className="absolute top-[-18px] left-[-2px] bg-emerald-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-t-md z-40 pointer-events-none select-none shadow font-sans">
                {node.props.layerName || 'Image'}
              </div>
            )}
            <img
              src={node.props.imageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
              alt={node.props.imageAlt || 'Visual image'}
              className="w-full h-full object-cover pointer-events-none"
            />
            {renderResizeHandles()}
          </div>
        );

      case 'Divider':
        return (
          <div
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            style={inlineStyles}
            className={`${editorOutlineClass} ${node.props.className || ''}`}
          >
            {/* Visual element tag badge overlay */}
            {!isPreview && (
              <div className="absolute top-1 left-2 bg-slate-650 text-[8px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/node:opacity-100 transition-opacity z-10 select-none pointer-events-none font-sans">
                Divider
              </div>
            )}
            {isSelected && !isPreview && (
              <div className="absolute top-[-18px] left-[-2px] bg-slate-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-t-md z-40 pointer-events-none select-none shadow font-sans">
                {node.props.layerName || 'Divider'}
              </div>
            )}
            {renderResizeHandles()}
          </div>
        );

      case 'Icon':
        const IconComponent = (LucideIcons as any)[node.props.iconName || 'Star'] || LucideIcons.Star;
        return (
          <div
            onClick={handleClick}
            draggable
            onDragStart={handleDragStart}
            style={{
              ...inlineStyles,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: inlineStyles.color // Apply color dynamically
            }}
            className={`${editorOutlineClass} ${node.props.className || ''}`}
          >
            {/* Visual element tag badge overlay */}
            {!isPreview && (
              <div className="absolute top-1 left-2 bg-amber-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded opacity-0 group-hover/node:opacity-100 transition-opacity z-10 select-none pointer-events-none font-sans">
                Icon ({node.props.iconName || 'Star'})
              </div>
            )}
            {isSelected && !isPreview && (
              <div className="absolute top-[-18px] left-[-2px] bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-t-md z-40 pointer-events-none select-none shadow font-sans">
                {node.props.layerName || `Icon (${node.props.iconName || 'Star'})`}
              </div>
            )}
            <IconComponent className="w-full h-full pointer-events-none" />
            {renderResizeHandles()}
          </div>
        );

      default:
        return null;
    }
  };

  return renderComponent();
}
