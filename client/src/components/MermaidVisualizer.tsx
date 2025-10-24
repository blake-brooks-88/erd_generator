import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Move, Maximize } from 'lucide-react';

interface MermaidVisualizerProps {
  code: string;
}

export default function MermaidVisualizer({ code }: MermaidVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!contentRef.current || !code) return;

      try {
        setError(null);
        contentRef.current.innerHTML = '';
        
        const { svg } = await mermaid.render('mermaid-diagram', code);
        contentRef.current.innerHTML = svg;

        // Get the SVG element
        const svgElement = contentRef.current.querySelector('svg');
        if (svgElement) {
          // Get the viewBox to determine the diagram's natural dimensions
          const viewBox = svgElement.getAttribute('viewBox');
          let naturalWidth = 800; // Default fallback
          let naturalHeight = 600;
          
          if (viewBox) {
            const [, , width, height] = viewBox.split(' ').map(Number);
            naturalWidth = width;
            naturalHeight = height;
          }
          
          // CRITICAL: Set the SVG to render at its full natural size
          // Remove any width/height attributes that might constrain it
          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');
          
          // Set inline styles to force natural dimensions
          svgElement.style.width = `${naturalWidth}px`;
          svgElement.style.height = `${naturalHeight}px`;
          svgElement.style.maxWidth = 'none';
          svgElement.style.maxHeight = 'none';
          svgElement.style.display = 'block';
          
          setContentSize({ width: naturalWidth, height: naturalHeight });
          
          // Auto-fit if diagram is larger than container
          if (containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            const padding = 100; // Padding around the diagram
            
            const scaleX = (container.width - padding) / naturalWidth;
            const scaleY = (container.height - padding) / naturalHeight;
            const autoScale = Math.min(scaleX, scaleY);
            
            // Only auto-scale if the diagram is too large
            if (autoScale < 1) {
              setScale(autoScale);
            } else {
              setScale(1);
            }
            setPosition({ x: 0, y: 0 });
          }
        }
      } catch (err) {
        setError('Failed to render diagram. Please check your schema.');
        console.error('Mermaid render error:', err);
      }
    };

    renderDiagram();
  }, [code]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.2, 5)); // Max 500%
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.2, 0.1)); // Min 10%
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !contentSize.width || !contentSize.height) return;

    const container = containerRef.current.getBoundingClientRect();
    const padding = 100;
    
    const scaleX = (container.width - padding) / contentSize.width;
    const scaleY = (container.height - padding) / contentSize.height;
    const newScale = Math.min(scaleX, scaleY);

    setScale(newScale);
    setPosition({ x: 0, y: 0 });
  }, [contentSize]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
    }
  }, []);

  // Pan/drag functions
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleResetZoom, handleFitToScreen]);

  return (
    <div className="h-full w-full flex flex-col bg-white relative">
      {/* Zoom Controls */}
      <div className="absolute top-4 align-center right-4 z-10 flex flex-col gap-2 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-lg border border-neutral">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomIn}
          className="h-8 w-8 p-0 hover:bg-primary/10"
          title="Zoom In (Ctrl/Cmd + +)"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomOut}
          className="h-8 w-8 p-0 hover:bg-primary/10"
          title="Zoom Out (Ctrl/Cmd + -)"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleResetZoom}
          className="h-8 w-8 p-0 hover:bg-primary/10"
          title="Reset to 100% (Ctrl/Cmd + 0)"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleFitToScreen}
          className="h-8 w-8 p-0 hover:bg-primary/10"
          title="Fit to Screen (F)"
        >
          <Maximize className="h-4 w-4" />
        </Button>
        <div className="h-px bg-neutral/20 my-1"></div>
        <div className="text-xs text-center text-neutral font-medium px-1">
          {Math.round(scale * 100)}%
        </div>
        {contentSize.width > 0 && (
          <div className="text-[10px] text-center text-neutral/60 px-1 leading-tight">
            {Math.round(contentSize.width)} × {Math.round(contentSize.height)}
          </div>
        )}
      </div>

      {/* Pan Hint */}
      {!isDragging && (scale !== 1 || position.x !== 0 || position.y !== 0) && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-neutral flex items-center gap-2 text-xs text-neutral animate-in fade-in slide-in-from-top-2 duration-200">
          <Move className="h-3 w-3" />
          <span>Click and drag to pan</span>
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {error ? (
          <div className="text-error text-center">
            <p className="font-medium">{error}</p>
          </div>
        ) : (
          <div
            ref={contentRef}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="select-none"
          />
        )}
      </div>

      {/* Instructions */}
      <div className="absolute w-max bottom-4 min-w-fit left-1/2 -translate-x-1/2 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-neutral">
        <div className="flex items-center gap-4 text-xs text-neutral">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-neutral/10 rounded border border-neutral/20 font-mono text-[10px]">Ctrl</kbd>
            +
            <kbd className="px-1.5 py-0.5 bg-neutral/10 rounded border border-neutral/20 font-mono text-[10px]">Scroll</kbd>
            to zoom
          </span>
          <span className="text-neutral/50">•</span>
          <span>Drag to pan</span>
          <span className="text-neutral/50">•</span>
        </div>
      </div>
    </div>
  );
}