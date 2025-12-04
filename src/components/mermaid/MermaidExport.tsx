'use client';

import { useState } from 'react';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MermaidExportProps {
  code: string;
  className?: string;
}

export function MermaidExport({ code, className }: MermaidExportProps) {
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

  const handleDownloadSvg = async () => {
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
      });
      
      const { svg } = await mermaid.render(`export-${Date.now()}`, code);
      
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jsonlogic-diagram.svg';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export SVG:', err);
    }
  };

  const handleDownloadPng = async () => {
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
      });
      
      const { svg } = await mermaid.render(`export-png-${Date.now()}`, code);
      
      // Create canvas and convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx?.scale(2, 2);
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jsonlogic-diagram.png';
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    } catch (err) {
      console.error('Failed to export PNG:', err);
    }
  };

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-1 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy Mermaid Code</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={handleDownloadSvg}>
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download SVG</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
