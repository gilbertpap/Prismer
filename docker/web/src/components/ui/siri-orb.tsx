'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SiriOrbProps {
  size?: number | string;
  status?: 'idle' | 'active' | 'thinking' | 'error';
  className?: string;
}

export function SiriOrb({ size = 36, status = 'idle', className }: SiriOrbProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  const gradientColors = {
    idle: 'from-violet-500 via-purple-500 to-fuchsia-500',
    active: 'from-violet-500 via-purple-500 to-fuchsia-500',
    thinking: 'from-amber-400 via-orange-500 to-yellow-500',
    error: 'from-red-500 via-rose-500 to-red-600',
  };

  const getAnimation = () => {
    switch (status) {
      case 'active':
        return {
          rotate: 360,
          transition: {
            rotate: {
              duration: 12,
              repeat: Infinity,
              ease: 'linear' as const,
            },
          },
        };
      case 'thinking':
        return {
          scale: [1, 1.1, 1],
          transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      case 'error':
        return {
          scale: [1, 1.05, 1],
          transition: {
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };
      default:
        return { scale: 1, rotate: 0 };
    }
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-full bg-gradient-to-br',
        gradientColors[status],
        className
      )}
      style={{ width: sizeValue, height: sizeValue }}
      animate={getAnimation()}
    >
      {/* Inner glow */}
      <div
        className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"
        style={{ filter: 'blur(2px)' }}
      />

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-1/4 w-1/4 rounded-full bg-white/80" />
      </div>

      {/* Outer ring for thinking state */}
      {status === 'thinking' && (
        <motion.div
          className="absolute -inset-1 rounded-full border-2 border-amber-400/50"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.div>
  );
}
