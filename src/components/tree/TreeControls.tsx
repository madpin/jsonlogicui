'use client';

import { ZoomIn, ZoomOut, Maximize2, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TreeControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitToScreen: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  zoom: number;
}

export function TreeControls({
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onExpandAll,
  onCollapseAll,
  zoom,
}: TreeControlsProps) {
  return (
    <TooltipProvider>
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border shadow-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom In</TooltipContent>
        </Tooltip>

        <div className="text-xs text-center text-muted-foreground py-1">
          {Math.round(zoom * 100)}%
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Zoom Out</TooltipContent>
        </Tooltip>

        <div className="h-px bg-border my-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onFitToScreen}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Fit to Screen</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onExpandAll}>
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Expand All</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onCollapseAll}>
              <ChevronsDownUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Collapse All</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
