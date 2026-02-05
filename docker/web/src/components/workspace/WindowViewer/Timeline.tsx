'use client';

import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';

export function Timeline() {
  const timeline = useWorkspaceStore((s) => s.timeline);
  const timelinePosition = useWorkspaceStore((s) => s.timelinePosition);
  const seekTimeline = useWorkspaceStore((s) => s.seekTimeline);

  if (timeline.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center border-t border-border bg-muted/30 px-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Timeline will show your activity history
        </div>
      </div>
    );
  }

  return (
    <div className="h-20 border-t border-border bg-muted/30">
      <div className="flex h-full items-center gap-2 px-2">
        {/* Previous button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          disabled={timelinePosition <= 0}
          onClick={() => seekTimeline(Math.max(0, timelinePosition - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Timeline events */}
        <ScrollArea className="flex-1">
          <div className="flex gap-2 py-2">
            {timeline.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'flex-shrink-0 cursor-pointer rounded-lg border bg-card p-2 transition-all hover:shadow-md',
                  index === timelinePosition && 'ring-2 ring-primary'
                )}
                onClick={() => seekTimeline(index)}
              >
                <div className="text-xs font-medium">{event.action}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {event.description}
                </div>
                <div className="mt-1 text-xs text-muted-foreground/60">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          disabled={timelinePosition >= timeline.length - 1}
          onClick={() => seekTimeline(Math.min(timeline.length - 1, timelinePosition + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
