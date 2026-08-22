import { getGymVibe, type GymVibeType } from "@/lib/gymVibe";
import { cn } from "@/lib/utils";

interface GymVibeBadgeProps {
  vibe: string | null | undefined;
  showLabel?: boolean;
  showArchetype?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GymVibeBadge = ({
  vibe,
  showLabel = true,
  showArchetype = true,
  size = 'md',
  className,
}: GymVibeBadgeProps) => {
  const vibeInfo = getGymVibe(vibe);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border',
        vibeInfo.bgClass,
        vibeInfo.borderClass,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('rounded-full', vibeInfo.dotClass, dotSizes[size])} />
      {showLabel && (
        <span className={cn('font-medium', vibeInfo.colorClass)}>
          {vibeInfo.label}
          {showArchetype && ` - ${vibeInfo.archetype}`}
        </span>
      )}
    </div>
  );
};

export default GymVibeBadge;
