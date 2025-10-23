import { useState } from 'react';
import { Entity } from '@/lib/storageService';
import MermaidVisualizer from './MermaidVisualizer';
import DataDictionary from './DataDictionary';

interface VisualizerProps {
  entities: Entity[];
  mermaidCode: string;
}

export default function Visualizer({ entities, mermaidCode }: VisualizerProps) {
  const [activeTab, setActiveTab] = useState<'erd' | 'dictionary'>('erd');

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex border-b border-neutral">
        <button
          onClick={() => setActiveTab('erd')}
          className={`px-6 py-3 text-base font-medium transition-colors ${
            activeTab === 'erd'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text hover:bg-base'
          }`}
          data-testid="tab-live-erd"
        >
          Live ERD
        </button>
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`px-6 py-3 text-base font-medium transition-colors ${
            activeTab === 'dictionary'
              ? 'border-b-2 border-primary text-primary'
              : 'text-text hover:bg-base'
          }`}
          data-testid="tab-data-dictionary"
        >
          Data Dictionary
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'erd' ? (
          <MermaidVisualizer code={mermaidCode} />
        ) : (
          <DataDictionary entities={entities} />
        )}
      </div>
    </div>
  );
}
