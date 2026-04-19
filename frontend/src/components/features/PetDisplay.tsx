'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { PetStage, PetSpecies } from '@/types';

interface PetDisplayProps {
  stage: PetStage;
  species: PetSpecies;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showInfo?: boolean;
  animate?: boolean;
  className?: string;
}

const ELEMENT_COLORS: Record<string, { bg: string; border: string; glow: string; particle: string }> = {
  fire: {
    bg: 'from-orange-100 to-red-100',
    border: 'border-orange-300',
    glow: 'shadow-orange-300/50',
    particle: 'bg-orange-400',
  },
  water: {
    bg: 'from-blue-100 to-cyan-100',
    border: 'border-blue-300',
    glow: 'shadow-blue-300/50',
    particle: 'bg-blue-400',
  },
  grass: {
    bg: 'from-green-100 to-emerald-100',
    border: 'border-green-300',
    glow: 'shadow-green-300/50',
    particle: 'bg-green-400',
  },
  electric: {
    bg: 'from-yellow-100 to-amber-100',
    border: 'border-yellow-300',
    glow: 'shadow-yellow-300/50',
    particle: 'bg-yellow-400',
  },
  ice: {
    bg: 'from-sky-100 to-indigo-100',
    border: 'border-sky-300',
    glow: 'shadow-sky-300/50',
    particle: 'bg-sky-400',
  },
  dragon: {
    bg: 'from-purple-100 to-violet-100',
    border: 'border-purple-300',
    glow: 'shadow-purple-300/50',
    particle: 'bg-purple-400',
  },
};

const ELEMENT_DARK_COLORS: Record<string, { bg: string }> = {
  fire: { bg: 'from-orange-900/30 to-red-900/30' },
  water: { bg: 'from-blue-900/30 to-cyan-900/30' },
  grass: { bg: 'from-green-900/30 to-emerald-900/30' },
  electric: { bg: 'from-yellow-900/30 to-amber-900/30' },
  ice: { bg: 'from-sky-900/30 to-indigo-900/30' },
  dragon: { bg: 'from-purple-900/30 to-violet-900/30' },
};

const SIZE_MAP = {
  sm: { container: 'w-12 h-12', emoji: 'text-xl', ring: 'w-14 h-14' },
  md: { container: 'w-20 h-20', emoji: 'text-3xl', ring: 'w-22 h-22' },
  lg: { container: 'w-28 h-28', emoji: 'text-5xl', ring: 'w-30 h-30' },
  xl: { container: 'w-36 h-36', emoji: 'text-7xl', ring: 'w-38 h-38' },
};

export function PetDisplay({
  stage,
  species,
  size = 'md',
  showInfo = false,
  animate = true,
  className,
}: PetDisplayProps) {
  const [isHatching, setIsHatching] = useState(false);
  const colors = ELEMENT_COLORS[species.element] || ELEMENT_COLORS.fire;
  const sizeConfig = SIZE_MAP[size];

  const isEgg = stage.level === 0;
  const isMaxLevel = stage.level >= 4;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative">
        {/* Glow ring for evolved pets */}
        {stage.level >= 3 && animate && (
          <div
            className={cn(
              'absolute inset-0 rounded-full opacity-30',
              'pet-glow',
              colors.glow,
            )}
            style={{ filter: 'blur(8px)' }}
          />
        )}

        {/* Particle effects for max level */}
        {isMaxLevel && animate && (
          <div className="absolute inset-0 pet-particles">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'absolute w-1.5 h-1.5 rounded-full',
                  colors.particle,
                  'pet-particle',
                )}
                style={{
                  animationDelay: `${i * 0.5}s`,
                  left: '50%',
                  top: '50%',
                }}
              />
            ))}
          </div>
        )}

        {/* Pet container */}
        <div
          className={cn(
            'relative rounded-full flex items-center justify-center',
            'bg-linear-to-br border-2 transition-all duration-300',
            colors.bg,
            colors.border,
            sizeConfig.container,
            animate && isEgg && 'pet-egg-wobble',
            animate && !isEgg && stage.level < 3 && 'pet-bounce',
            animate && stage.level >= 3 && 'pet-float',
            animate && isMaxLevel && `shadow-lg ${colors.glow}`,
          )}
        >
          <span
            className={cn(
              sizeConfig.emoji,
              'select-none',
              animate && 'transition-transform duration-300',
            )}
          >
            {stage.emoji}
          </span>
        </div>

        {/* Level badge */}
        {!isEgg && (
          <div
            className={cn(
              'absolute -bottom-1 -right-1 rounded-full',
              'flex items-center justify-center text-xs font-bold',
              'bg-white border-2 shadow-sm',
              size === 'sm' ? 'w-5 h-5 text-[10px]' : 'w-6 h-6',
              colors.border,
            )}
          >
            {stage.level}
          </div>
        )}
      </div>

      {/* Pet info */}
      {showInfo && (
        <div className="text-center">
          <div className="text-sm font-semibold">{stage.name}</div>
          <div className="text-xs text-muted-foreground">{stage.description}</div>
        </div>
      )}
    </div>
  );
}

interface PetMiniProps {
  stage: PetStage | null;
  species: PetSpecies | null;
  className?: string;
}

export function PetMini({ stage, species, className }: PetMiniProps) {
  if (!stage || !species) return null;

  return (
    <PetDisplay
      stage={stage}
      species={species}
      size="sm"
      animate
      className={className}
    />
  );
}

interface PetEvolutionPreviewProps {
  species: PetSpecies;
  currentScore: number;
}

export function PetEvolutionPreview({ species, currentScore }: PetEvolutionPreviewProps) {
  let currentLevel = 0;
  for (const stage of species.stages) {
    if (currentScore >= stage.minScore) {
      currentLevel = stage.level;
    }
  }

  return (
    <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto pb-2">
      {species.stages.map((stage, index) => {
        const isReached = currentScore >= stage.minScore;
        const isCurrent = stage.level === currentLevel;
        const isNext = stage.level === currentLevel + 1;

        return (
          <div key={stage.level} className="flex items-center">
            {index > 0 && (
              <div className="flex items-center mx-1 sm:mx-2">
                <div
                  className={cn(
                    'h-0.5 w-4 sm:w-8',
                    isReached ? 'bg-primary' : 'bg-muted-foreground/20',
                  )}
                />
                <div
                  className={cn(
                    'text-xs',
                    isReached ? 'text-primary' : 'text-muted-foreground/40',
                  )}
                >
                  ▶
                </div>
              </div>
            )}
            <div
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                isCurrent && 'bg-primary/10 ring-2 ring-primary/30',
                isNext && 'bg-muted/50 ring-1 ring-dashed ring-muted-foreground/20',
              )}
            >
              <PetDisplay
                stage={stage}
                species={species}
                size="sm"
                animate={isCurrent}
              />
              <div className="text-center">
                <div className={cn('text-xs font-medium', !isReached && 'text-muted-foreground/50')}>
                  {stage.name}
                </div>
                <div className={cn('text-[10px]', isReached ? 'text-primary' : 'text-muted-foreground/40')}>
                  {stage.minScore}分
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
