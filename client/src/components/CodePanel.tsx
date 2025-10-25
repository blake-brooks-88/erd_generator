import React, { useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { Entity } from '@/lib/storageService';

interface CodePanelProps {
  initialCode: string;
  currentEntities: Entity[];
}

export default function CodePanel({ initialCode, currentEntities }: CodePanelProps) {
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);

  const codeToDisplay = initialCode;

  const handleCopyToClipboard = useCallback(() => {
    if (contentRef.current) {
      // Create a temporary textarea to hold the text for copying
      const tempTextArea = document.createElement('textarea');
      tempTextArea.value = codeToDisplay;
      document.body.appendChild(tempTextArea);
      tempTextArea.select();

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(codeToDisplay).then(() => {
            toast({ title: 'Mermaid code copied to clipboard!' });
          });
        } else {
          // Fallback for older browsers
          document.execCommand('copy');
          toast({ title: 'Mermaid code copied (fallback)!' });
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
        toast({ title: 'Failed to copy code', variant: 'destructive' });
      } finally {
        document.body.removeChild(tempTextArea);
      }
    }
  }, [codeToDisplay, toast]);

  return (
    // 1. Panel Container is pure white
    <div className="h-full flex flex-col bg-white p-4">

      {/* Header with Copy Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-text">Mermaid Code</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyToClipboard}
          className="text-primary hover:bg-primary/10 transition-colors"
          aria-label="Copy Mermaid Code"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Code
        </Button>
      </div>

      {/* 2. Code Display Area - Clean, High-Contrast Block */}
      <div
        className="flex-1 overflow-y-auto rounded-lg border-2 border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-4 text-sm font-mono leading-relaxed shadow-inner"
        data-testid="code-display-area"
      >
        <div ref={contentRef} className="whitespace-pre-wrap text-text">
          {codeToDisplay || 'erDiagram\n  // Start adding entities in the Entity List to generate code.'}
        </div>
      </div>
    </div>
  );
}