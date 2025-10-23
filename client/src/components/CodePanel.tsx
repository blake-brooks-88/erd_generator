import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';

interface CodePanelProps {
  code: string;
}

export default function CodePanel({ code }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-text">Mermaid Code</h3>
        <Button
          onClick={handleCopy}
          className="bg-accent hover:bg-accent/80 text-white"
          size="sm"
          data-testid="button-copy-code"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
      <Textarea
        value={code}
        readOnly
        className="flex-1 font-mono text-sm border-neutral resize-none"
        data-testid="textarea-mermaid-code"
      />
    </div>
  );
}
