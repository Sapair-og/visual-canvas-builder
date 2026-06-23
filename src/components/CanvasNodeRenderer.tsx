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
  const { 
    selectedNodeId, 
    selectNode, 
    addNode, 
    moveNode, 
    updateNodeProps, 
    snapToGrid, 
    guides, 
    isPreview,
    activeDragNodeId,
    setActiveDragNodeId,
    activeDragType,
    setActiveDragType,
    activeDragGrabOffset,
    setActiveDragGrabOffset
  } = useEditor();
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localText, setLocalText] = useState(node.props.text || '');
  const [activeSmartGuides, setActiveSmartGuides] = useState<{ type: 'v' | 'h', value: number }[]>([]);

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

    // Update global drag states for smart guidelines snapping
    setActiveDragNodeId(node.id);
    setActiveDragGrabOffset({ x: offsetX, y: offsetY });

    e.stopPropagation();
  };

  const handleDragEnd = () => {
    setActiveDragNodeId(null);
    setActiveDragType(null);
    setActiveDragGrabOffset(null);
    setActiveSmartGuides([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);

    if (node.type !== 'Container') return;

    const dragNodeId = activeDragNodeId;
    const dragType = activeDragType;
    const grabOffset = activeDragGrabOffset || { x: 0, y: 0 };

    if (!dragNodeId && !dragType) return;

    // Calculate dimensions of the dragging element
    let dragWidth = 180;
    let dragHeight = 40;

    if (dragType) {
      if (dragType === 'Container') { dragWidth = 240; dragHeight = 180; }
      else if (dragType === 'TextBlock') { dragWidth = 180; dragHeight = 40; }
      else if (dragType === 'Button') { dragWidth = 120; dragHeight = 36; }
      else if (dragType === 'ImageBlock') { dragWidth = 240; dragHeight = 160; }
      else if (dragType === 'Divider') { dragWidth = e.currentTarget.clientWidth; dragHeight = 2; }
      else if (dragType === 'Icon') { dragWidth = 32; dragHeight = 32; }
    } else if (dragNodeId) {
      const draggedElement = document.getElementById(dragNodeId);
      if (draggedElement) {
        dragWidth = draggedElement.offsetWidth;
        dragHeight = draggedElement.offsetHeight;
      }
    }

    const containerRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    const candidateX = mouseX - grabOffset.x;
    const candidateY = mouseY - grabOffset.y;

    const left = candidateX;
    const centerX = candidateX + dragWidth / 2;
    const right = candidateX + dragWidth;

    const top = candidateY;
    const centerY = candidateY + dragHeight / 2;
    const bottom = candidateY + dragHeight;

    // Gather potential alignment coordinates (borders + center of parent container)
    const xLines: number[] = [0, containerRect.width / 2, containerRect.width];
    const yLines: number[] = [0, containerRect.height / 2, containerRect.height];

    // Gather alignment coordinates from sibling elements
    node.children.forEach(child => {
      if (child.id === dragNodeId) return;
      const childStyle = child.props.style || {};
      if (childStyle.position !== 'relative') {
        const sibLeft = parsePixelVal(childStyle.left);
        const sibTop = parsePixelVal(childStyle.top);
        const sibWidth = parsePixelVal(childStyle.width, 180);
        const sibHeight = parsePixelVal(childStyle.height, 40);

        xLines.push(sibLeft, sibLeft + sibWidth / 2, sibLeft + sibWidth);
        yLines.push(sibTop, sibTop + sibHeight / 2, sibTop + sibHeight);
      }
    });

    const THRESHOLD = 8;
    let snappedX = candidateX;
    let snappedY = candidateY;
    const guidesFound: { type: 'v' | 'h'; value: number }[] = [];

    let bestSnapX: { val: number; guide: number; diff: number } | null = null;
    let bestSnapY: { val: number; guide: number; diff: number } | null = null;

    for (const targetX of xLines) {
      const diffLeft = Math.abs(left - targetX);
      if (diffLeft < THRESHOLD && (!bestSnapX || diffLeft < bestSnapX.diff)) {
        bestSnapX = { val: targetX, guide: targetX, diff: diffLeft };
      }
      const diffCenter = Math.abs(centerX - targetX);
      if (diffCenter < THRESHOLD && (!bestSnapX || diffCenter < bestSnapX.diff)) {
        bestSnapX = { val: targetX - dragWidth / 2, guide: targetX, diff: diffCenter };
      }
      const diffRight = Math.abs(right - targetX);
      if (diffRight < THRESHOLD && (!bestSnapX || diffRight < bestSnapX.diff)) {
        bestSnapX = { val: targetX - dragWidth, guide: targetX, diff: diffRight };
      }
    }

    for (const targetY of yLines) {
      const diffTop = Math.abs(top - targetY);
      if (diffTop < THRESHOLD && (!bestSnapY || diffTop < bestSnapY.diff)) {
        bestSnapY = { val: targetY, guide: targetY, diff: diffTop };
      }
      const diffCenter = Math.abs(centerY - targetY);
      if (diffCenter < THRESHOLD && (!bestSnapY || diffCenter < bestSnapY.diff)) {
        bestSnapY = { val: targetY - dragHeight / 2, guide: targetY, diff: diffCenter };
      }
      const diffBottom = Math.abs(bottom - targetY);
      if (diffBottom < THRESHOLD && (!bestSnapY || diffBottom < bestSnapY.diff)) {
        bestSnapY = { val: targetY - dragHeight, guide: targetY, diff: diffBottom };
      }
    }

    if (bestSnapX) {
      snappedX = bestSnapX.val;
      guidesFound.push({ type: 'v', value: bestSnapX.guide });
    }
    if (bestSnapY) {
      snappedY = bestSnapY.val;
      guidesFound.push({ type: 'h', value: bestSnapY.guide });
    }

    setActiveSmartGuides(guidesFound);

    (e.currentTarget as any)._snappedX = snappedX;
    (e.currentTarget as any)._snappedY = snappedY;
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setActiveSmartGuides([]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setActiveSmartGuides([]);

    const droppedType = e.dataTransfer.getData('application/react-craft-type') as NodeType;
    const draggedNodeId = e.dataTransfer.getData('application/react-craft-node-id');

    const rect = e.currentTarget.getBoundingClientRect();
    const grabOffsetX = parseFloat(e.dataTransfer.getData('application/react-craft-offset-x') || '0');
    const grabOffsetY = parseFloat(e.dataTransfer.getData('application/react-craft-offset-y') || '0');
    
    const hasSnappedX = (e.currentTarget as any)._snappedX !== undefined;
    const hasSnappedY = (e.currentTarget as any)._snappedY !== undefined;

    let x = hasSnappedX ? (e.currentTarget as any)._snappedX : (e.clientX - rect.left - (droppedType ? 0 : grabOffsetX));
    let y = hasSnappedY ? (e.currentTarget as any)._snappedY : (e.clientY - rect.top - (droppedType ? 0 : grabOffsetY));

    if (snapToGrid && !hasSnappedX && !hasSnappedY) {
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

    // Clean up temporary snapping values
    delete (e.currentTarget as any)._snappedX;
    delete (e.currentTarget as any)._snappedY;

    // Reset global dragging states
    setActiveDragNodeId(null);
    setActiveDragType(null);
    setActiveDragGrabOffset(null);

    if (droppedType) {
      addNode(node.id, droppedType, undefined, { x, y });
    } else if (draggedNodeId && draggedNodeId !== node.id) {
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

      if (snapToGrid) {
        newWidthVal = Math.round(newWidthVal / 16) * 16;
        newHeightVal = Math.round(newHeightVal / 16) * 16;
      }

      newWidthVal = Math.max(20, newWidthVal);
      newHeightVal = Math.max(20, newHeightVal);

      // Clamp resize coordinates inside container parent boundaries
      if (parent) {
        const parentElement = targetElement.parentElement;
        if (parentElement) {
          const maxW = parentElement.offsetWidth - targetElement.offsetLeft;
          const maxH = parentElement.offsetHeight - targetElement.offsetTop;
          newWidthVal = Math.min(newWidthVal, maxW);
          newHeightVal = Math.min(newHeightVal, maxH);
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
    if (isPreview || !isSelected || node.props.locked) return null;

    return (
      <>
        {/* Right side width resize handle */}
        <div
          onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
          className="absolute right-[-5px] top-1/2 translate-y-[-50%] w-2.5 h-2.5 bg-blue-500 border border-white rounded-full cursor-ew-resize hover:scale-125 z-40 shadow transition-transform"
          title="Drag to resize width"
        />
        {/* Bottom side height resize handle */}
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

    return {
      position: node.id === 'root' ? 'relative' : (s.position || 'absolute'),
      left: s.left,
      top: s.top,
      zIndex: layerNo,

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
            id={node.id}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            draggable={node.id !== 'root'}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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

            {/* Canva-style smart alignment guide lines */}
            {!isPreview && activeSmartGuides.map((guide, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: guide.type === 'v' ? `${guide.value}px` : 0,
                  right: guide.type === 'v' ? undefined : 0,
                  top: guide.type === 'h' ? `${guide.value}px` : 0,
                  bottom: guide.type === 'h' ? undefined : 0,
                  width: guide.type === 'v' ? '1px' : '100%',
                  height: guide.type === 'h' ? '1px' : '100%',
                  borderLeft: guide.type === 'v' ? '1px dashed #d946ef' : undefined,
                  borderTop: guide.type === 'h' ? '1px dashed #d946ef' : undefined,
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              />
            ))}
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
            id={node.id}
            onClick={handleClick}
            onDoubleClick={() => setIsEditing(true)}
            draggable={!isPreview && !isSelected}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
            id={node.id}
            onClick={handleClick}
            onDoubleClick={() => setIsEditing(true)}
            draggable={!isPreview && !isSelected}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
            id={node.id}
            onClick={handleClick}
            draggable={!isPreview && !isSelected}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
            id={node.id}
            onClick={handleClick}
            draggable={!isPreview && !isSelected}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
            id={node.id}
            onClick={handleClick}
            draggable={!isPreview && !isSelected}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
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
