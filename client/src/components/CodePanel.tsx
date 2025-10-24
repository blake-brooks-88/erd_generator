import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProjectContext } from '@/store/projectStore';
import { parseMermaidCode } from '@/lib/mermaidParser';
import { generateMermaidCode } from '@/lib/mermaidGenerator';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, AlertCircle } from 'lucide-react';
import { Entity } from '@/lib/storageService'; 


interface CodePanelProps {
  initialCode: string; 
  currentEntities: Entity[]; 
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function CodePanel({ initialCode, currentEntities }: CodePanelProps) {
  const { setEntities } = useProjectContext(); 
  const [code, setCode] = useState(initialCode);
  const [parseError, setParseError] = useState<string | null>(null);
  const debouncedCode = useDebounce(code, 750); 
  const { toast } = useToast();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isUserTyping = useRef(false);


   useEffect(() => {
     if (!isUserTyping.current && initialCode !== code) {
       console.log("CodePanel: Updating internal code from initialCode prop");
       setCode(initialCode);
       setParseError(null);
     }
      const timer = setTimeout(() => {
        isUserTyping.current = false;
      }, 100); 
      return () => clearTimeout(timer);
   }, [initialCode, code]); 

   useEffect(() => {
     const generatedCodeFromProps = generateMermaidCode(currentEntities || []);
     if (debouncedCode !== generatedCodeFromProps && isUserTyping.current) {
        console.log("CodePanel: Debounced code changed, attempting parse...");
       try {
         const result = parseMermaidCode(debouncedCode);
         if ('error' in result) {
            console.error("CodePanel: Parse error:", result.error);
           setParseError(result.error);
           toast({
               title: "Mermaid Syntax Error",
               description: result.error,
               variant: "destructive"
           });
         } else {
            console.log("CodePanel: Parse successful, dispatching SET_ENTITIES");
           setEntities(result.entities); 
           setParseError(null);
           toast({ title: "Diagram updated from code" });
         }
       } catch (err) {
         console.error("CodePanel: Unexpected parsing error:", err);
         const errorMsg = err instanceof Error ? err.message : "Unknown parsing error";
         setParseError(errorMsg);
         toast({
             title: "Parsing Error",
             description: errorMsg,
             variant: "destructive"
         });
       }
     }
   }, [debouncedCode, setEntities, currentEntities, toast]);


  const handleCodeChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    isUserTyping.current = true;
    setCode(event.target.value);
  };

  const handleCopyToClipboard = useCallback(() => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textAreaRef.current.value).then(() => {
                toast({ title: 'Mermaid code copied to clipboard!' });
            }, (err) => {
                console.error('Async clipboard write failed: ', err);
                legacyCopy();
            });
        } else {
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
        toast({ title: 'Failed to copy code', variant: 'destructive' });
      }
      window.getSelection()?.removeAllRanges();
       if (textAreaRef.current) {
         textAreaRef.current.blur();
       }
    }
  }, [toast]); 

   
   const legacyCopy = () => {
       if (textAreaRef.current) {
           textAreaRef.current.select(); 
           const success = document.execCommand('copy');
           if (success) {
               toast({ title: 'Mermaid code copied (fallback)!' });
           } else {
               throw new Error('document.execCommand("copy") failed');
           }
       }
   };


  return (
    <div className="h-full flex flex-col bg-white p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-text">Mermaid Code</h3>
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
      <Textarea
        ref={textAreaRef}
        value={code}
        onChange={handleCodeChange}
        placeholder={`erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE-ITEM : contains\n\n  CUSTOMER {\n    string name\n    string custId\n    string email\n  }`}
        className={`flex-1 font-mono text-sm border-neutral focus:border-primary resize-none ${parseError ? 'border-error focus:border-error' : ''}`}
        spellCheck="false"
        data-testid="textarea-mermaid-code"
      />
      {parseError && (
          <div className="mt-2 p-2 bg-error/10 border border-error/20 rounded text-error text-xs flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{parseError}</span>
          </div>
      )}
    </div>
  );
}

