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
  // Ref is now on the content container, not a textarea
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

  // Removed: legacyCopy, handleSaveCode, handleCodeChange, handleTabInput

  return (
    <div className="h-full flex flex-col bg-white p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-text">Mermaid Code (Read-Only)</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyToClipboard}
          className="text-primary hover:bg-primary/10"
          aria-label="Copy Mermaid Code"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy Code
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto rounded-md border border-neutral/50 bg-neutral/5 p-4 text-sm font-mono leading-relaxed" data-testid="code-display-area">
        {/* Use a ref on this container */}
        <div ref={contentRef} className="whitespace-pre-wrap">
          {codeToDisplay || 'erDiagram\n  // Start adding entities in the Entity List to generate code.'}
        </div>
      </div>
    </div>
  );
}