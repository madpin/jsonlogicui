'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { AlertCircle, Code } from 'lucide-react';

interface MermaidPreviewProps {
  code: string;
  className?: string;
}

export function MermaidPreview({ code, className }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState<string>('');
  const uniqueId = useId().replace(/:/g, '');

  useEffect(() => {
    if (!code) {
      setIsLoading(false);
      setSvgContent('');
      return;
    }

    let isMounted = true;

    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Dynamically import mermaid to avoid SSR issues
        const mermaid = (await import('mermaid')).default;
        
        // Re-initialize mermaid for each render
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis',
          },
        });

        // Generate unique ID for this render
        const id = `mermaid-${uniqueId}-${Date.now()}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, code);
        
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvgContent('');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Debounce rendering to avoid too many re-renders
    const timeoutId = setTimeout(renderDiagram, 300);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [code, uniqueId]);

  if (!code) {
    return (
      <div className={`flex items-center justify-center h-full text-muted-foreground ${className}`}>
        Enter a valid JSONLogic rule to see the Mermaid diagram
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full text-muted-foreground ${className}`}>
        Rendering diagram...
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-full gap-2 text-destructive ${className}`}>
        <AlertCircle className="h-6 w-6" />
        <span className="text-sm">Failed to render diagram</span>
        <span className="text-xs text-muted-foreground">{error}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* SVG Diagram */}
      <div 
        ref={containerRef} 
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      
      {/* Code Preview */}
      <div className="border-t p-2 bg-muted/50">
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground flex items-center gap-1">
            <Code className="h-3 w-3" />
            View Mermaid Code
          </summary>
          <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32">
            {code}
          </pre>
        </details>
      </div>
    </div>
  );
}
