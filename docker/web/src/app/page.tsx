'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { APIKeyForm } from '@/components/setup/APIKeyForm';
import { WorkspaceView } from '@/components/workspace/WorkspaceView';
import { useConfig } from '@/stores/workspaceStore';

export default function Home() {
  const router = useRouter();
  const { configured } = useConfig();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show setup wizard if not configured
  if (!configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <APIKeyForm />
      </div>
    );
  }

  // Show workspace
  return <WorkspaceView />;
}
