'use client';

import { useEffect } from 'react';
import { ChevronDown, Zap, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSkills, useLayout } from '@/stores/workspaceStore';
import type { Skill } from '@/types/workspace';
import { cn } from '@/lib/utils';

export function SkillsPanel() {
  const { skills, loading, setSkills, setLoading } = useSkills();
  const { taskPanelHeight, setTaskPanelHeight } = useLayout();

  // Fetch skills on mount
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/skills');
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error('[skills] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const collapsePanel = () => {
    setTaskPanelHeight('collapsed');
  };

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  return (
    <div className="flex h-full flex-col">
      <SkillsPanelHeader
        onCollapse={collapsePanel}
        onRefresh={fetchSkills}
        loading={loading}
        count={skills.length}
      />
      <ScrollArea className="flex-1">
        <div className="p-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
              <Zap className="mb-2 h-8 w-8" />
              <p>No skills found</p>
              <p className="text-xs">Skills are loaded from /workspace/skills/</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <SkillCategory key={category} category={category} skills={categorySkills} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface SkillsPanelHeaderProps {
  onCollapse: () => void;
  onRefresh: () => void;
  loading: boolean;
  count: number;
}

function SkillsPanelHeader({ onCollapse, onRefresh, loading, count }: SkillsPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Skills</span>
        {count > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {count}
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCollapse}>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SkillCategoryProps {
  category: string;
  skills: Skill[];
}

function SkillCategory({ category, skills }: SkillCategoryProps) {
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {categoryLabel}
      </h4>
      <div className="grid gap-2">
        <AnimatePresence>
          {skills.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface SkillCardProps {
  skill: Skill;
}

function SkillCard({ skill }: SkillCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-2 transition-colors hover:bg-accent',
              skill.enabled ? 'border-border' : 'border-border/50 opacity-50'
            )}
          >
            <span className="text-lg">{skill.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{skill.name}</p>
              <p className="truncate text-xs text-muted-foreground">{skill.description}</p>
            </div>
            {skill.enabled && (
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-500" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-medium">{skill.name}</p>
          <p className="text-sm text-muted-foreground">{skill.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">Path: {skill.path}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
