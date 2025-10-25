import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, RefreshCcw, Maximize, Minus } from 'lucide-react';

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
      fontFamily: 'inherit',
    });
  }, []);

  // Core Rendering Logic
  useEffect(() => {
    const renderDiagram = async () => {
      if (!contentRef.current || !code) return;

      try {
        setError(null);
        contentRef.current.innerHTML = '';

        const { svg } = await mermaid.render('mermaid-diagram', code);
        contentRef.current.innerHTML = svg;

        const svgElement = contentRef.current.querySelector('svg');
        if (svgElement) {
          const viewBox = svgElement.getAttribute('viewBox');
          let naturalWidth = 800;
          let naturalHeight = 600;

          if (viewBox) {
            const [, , width, height] = viewBox.split(' ').map(Number);
            naturalWidth = width;
            naturalHeight = height;
          }

          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');

          svgElement.style.width = `${naturalWidth}px`;
          svgElement.style.height = `${naturalHeight}px`;
          svgElement.style.maxWidth = 'none';
          svgElement.style.maxHeight = 'none';
          svgElement.style.display = 'block';

          setContentSize({ width: naturalWidth, height: naturalHeight });

          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const padding = 60;

            const scaleX = (containerRect.width - padding) / naturalWidth;
            const scaleY = (containerRect.height - padding) / naturalHeight;
            const autoScale = Math.min(scaleX, scaleY);

            if (autoScale < 1 || autoScale > 1) {
              setScale(autoScale);
            } else {
              setScale(1);
            }
            // Recalculate position for initial centering
            setPosition({
              x: (containerRect.width - (naturalWidth * autoScale)) / 2,
              y: (containerRect.height - (naturalHeight * autoScale)) / 2,
            });
          }
        }
      } catch (err) {
        setError('Failed to render diagram. Please check your schema.');
        console.error('Mermaid render error:', err);
      }
    };

    renderDiagram();
  }, [code]);

  // Core Zoom Logic
  const zoom = useCallback((newScale: number, focalPoint?: { x: number, y: number }) => {
    if (!containerRef.current || !contentRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const clampedNewScale = Math.max(0.1, Math.min(5, newScale));
    const scaleDelta = clampedNewScale / scale;

    if (focalPoint) {
      // Zoom toward cursor
      setPosition(prev => ({
        x: focalPoint.x - (focalPoint.x - prev.x) * scaleDelta,
        y: focalPoint.y - (focalPoint.y - prev.y) * scaleDelta
      }));
    } else {
      // Zoom toward center of container
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;

      setPosition(prev => ({
        x: centerX - (centerX - prev.x) * scaleDelta,
        y: centerY - (centerY - prev.y) * scaleDelta
      }));
    }

    setScale(clampedNewScale);
  }, [scale]);

  // INCREASED SPEED: Buttons now use 0.3 additive step
  const handleZoomIn = useCallback(() => {
    zoom(scale + 0.3);
  }, [scale, zoom]);

  const handleZoomOut = useCallback(() => {
    zoom(scale - 0.3);
  }, [scale, zoom]);

  const handleResetZoom = useCallback(() => {
    if (!containerRef.current || !contentSize.width || !contentSize.height) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    setScale(1);
    setPosition({
      x: (containerRect.width - contentSize.width) / 2,
      y: (containerRect.height - contentSize.height) / 2,
    });
  }, [contentSize]);

  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current || !contentSize.width || !contentSize.height) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const padding = 60;

    const scaleX = (containerRect.width - padding) / contentSize.width;
    const scaleY = (containerRect.height - padding) / contentSize.height;
    const newScale = Math.min(scaleX, scaleY);

    setScale(newScale);
    setPosition({
      x: (containerRect.width - (contentSize.width * newScale)) / 2,
      y: (containerRect.height - (contentSize.height * newScale)) / 2,
    });
  }, [contentSize]);

  // INCREASED SPEED: Divisor changed from 200 to 150
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;

    e.preventDefault();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Increased zoom speed by lowering the divisor
    const deltaFactor = -e.deltaY / 150;

    const newScale = scale * (1 + deltaFactor);

    zoom(newScale, { x: mouseX, y: mouseY });
  }, [scale, zoom]);

  // Use native event listener for 'wheel'
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e: WheelEvent) => {
      handleWheel(e);
    };

    container.addEventListener('wheel', wheelHandler, { passive: false });
    return () => container.removeEventListener('wheel', wheelHandler);
  }, [handleWheel]);

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
    // INCREASED SPEED: Factor changed from 0.05 to 0.07
    const ZOOM_FACTOR = 0.07;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        zoom(scale * (1 + ZOOM_FACTOR));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        zoom(scale * (1 - ZOOM_FACTOR));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom, scale, handleResetZoom]);

  // Double-click to reset zoom
  const handleDoubleClick = useCallback(() => {
    handleResetZoom();
  }, [handleResetZoom]);

  return (
    <div className="h-full w-full flex flex-col bg-white relative">
      {/* Zoom Controls */}
      <div className="absolute w-12 items-center top-4 right-4 z-10 flex flex-col gap-0 bg-white shadow-lg rounded-xl border border-border overflow-hidden">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomIn}
          className="h-9 w-12 p-0 rounded-none hover:bg-muted/70 transition-colors"
          title="Zoom In (Ctrl/Cmd + +)"
        >
          <ZoomIn className="h-4 w-4 text-primary" />
        </Button>

        {/* FIX: Added w-12 and text-center to fix width jump issue */}
        <div className="flex items-center justify-center h-8 bg-base border-y border-border transition-colors">
          <div className="text-xs font-semibold text-text w-12 text-center">
            {Math.round(scale * 100)}%
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleZoomOut}
          className="h-9 w-12 p-0 rounded-none hover:bg-muted/70 transition-colors"
          title="Zoom Out (Ctrl/Cmd + -)"
        >
          <Minus className="h-4 w-4 text-primary" />
        </Button>

        <div className="h-px bg-border"></div>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleFitToScreen}
          className="h-9 w-12 p-0 rounded-none hover:bg-muted/70 transition-colors"
          title="Fit to Screen"
        >
          <Maximize className="h-4 w-4 text-neutral" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleResetZoom}
          className="h-9 w-12 p-0 rounded-none hover:bg-muted/70 transition-colors"
          title="Reset View (Ctrl/Cmd + 0)"
        >
          <RefreshCcw className="h-4 w-4 text-neutral" />
        </Button>
      </div>

      {/* Pan Hint */}
      {!isDragging && (scale !== 1 || position.x !== 0 || position.y !== 0) && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border flex items-center gap-2 text-xs text-neutral animate-in fade-in slide-in-from-top-2 duration-200">
          <Move className="h-3 w-3" />
          <span>Click and drag to pan</span>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute w-full bottom-4 z-10">
        <div className="w-max mx-auto bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-border">
          <div className="flex items-center gap-4 text-xs text-neutral">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-base rounded border border-border font-mono text-[10px]">Ctrl</kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-base rounded border border-border font-mono text-[10px]">Scroll</kbd>
              or pinch to zoom
            </span>
            <span className="text-neutral/50">•</span>
            <span>Drag to pan</span>
            <span className="text-neutral/50">•</span>
            <span>Double-click to reset</span>
            {contentSize.width > 0 && (
              <>
                <span className="text-neutral/50">•</span>
                <span className="text-[10px] text-neutral/60 leading-none">
                  Size: {Math.round(contentSize.width)} × {Math.round(contentSize.height)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-hidden relative ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
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
              transformOrigin: 'top left',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            className="select-none"
          />
        )}
      </div>
    </div>
  );
}