// Gym Vibe color and archetype mapping for SpotMe

export type GymVibeType = 'red' | 'black' | 'green' | 'blue' | 'purple' | 'neutral';

export interface GymVibeInfo {
  id: GymVibeType;
  label: string;
  archetype: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  dotClass: string;
}

export const GYM_VIBES: Record<GymVibeType, GymVibeInfo> = {
  red: {
    id: 'red',
    label: 'Red',
    archetype: 'The Alpha / Athlete',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
    borderClass: 'border-red-500/30',
    dotClass: 'bg-red-500',
  },
  black: {
    id: 'black',
    label: 'Black',
    archetype: 'The Iron Tribe / Bodybuilder',
    colorClass: 'text-foreground',
    bgClass: 'bg-foreground/10',
    borderClass: 'border-foreground/30',
    dotClass: 'bg-foreground',
  },
  green: {
    id: 'green',
    label: 'Green',
    archetype: 'The Flow State / Mind-Body',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
    borderClass: 'border-green-500/30',
    dotClass: 'bg-green-500',
  },
  blue: {
    id: 'blue',
    label: 'Blue',
    archetype: 'The Endurance Crew / Performance Seekers',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    dotClass: 'bg-blue-500',
  },
  purple: {
    id: 'purple',
    label: 'Purple',
    archetype: 'The Aesthetic / Lifestyle Shapers',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/30',
    dotClass: 'bg-purple-500',
  },
  neutral: {
    id: 'neutral',
    label: 'Grey',
    archetype: 'The Everyday / Balanced Fitness',
    colorClass: 'text-gray-400',
    bgClass: 'bg-gray-500/10',
    borderClass: 'border-gray-500/30',
    dotClass: 'bg-gray-400',
  },
};

export const getGymVibe = (vibe: string | null | undefined): GymVibeInfo => {
  if (!vibe) return GYM_VIBES.neutral;
  
  const vibeKey = vibe.toLowerCase() as GymVibeType;
  return GYM_VIBES[vibeKey] || GYM_VIBES.neutral;
};

export const ALL_VIBES = Object.values(GYM_VIBES);
