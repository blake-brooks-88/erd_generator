import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidVisualizerProps {
  code: string;
}

export default function MermaidVisualizer({ code }: MermaidVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;

      try {
        setError(null);
        containerRef.current.innerHTML = '';
        
        const { svg } = await mermaid.render('mermaid-diagram', code);
        containerRef.current.innerHTML = svg;
      } catch (err) {
        setError('Failed to render diagram. Please check your schema.');
        console.error('Mermaid render error:', err);
      }
    };

    renderDiagram();
  }, [code]);

  return (
    <div className="h-full w-full flex items-center justify-center bg-white p-8 overflow-auto">
      {error ? (
        <div className="text-error text-center">
          <p className="font-medium">{error}</p>
        </div>
      ) : (
        <div ref={containerRef} className="w-full flex justify-center" />
      )}
    </div>
  );
}
