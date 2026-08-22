export type Tier = "CASUAL" | "ROUTINE" | "DRIVEN" | "COMPETITOR" | "APEX";

export const tierMap = {
  A: "CASUAL",
  B: "ROUTINE",
  C: "DRIVEN",
  D: "COMPETITOR",
  E: "APEX",
} as const;

export const tierColors = {
  CASUAL: "#9CA3AF",      // Cool Gray
  ROUTINE: "#3B82F6",     // Clean Blue
  DRIVEN: "#10B981",      // Emerald
  COMPETITOR: "#F97316",  // Orange
  APEX: "#EF4444",        // Red
};

export function resolveTier(answers: string[]): Tier {
  const counts: Record<Tier, number> = {
    CASUAL: 0,
    ROUTINE: 0,
    DRIVEN: 0,
    COMPETITOR: 0,
    APEX: 0,
  };

  answers.forEach((a) => {
    const tier = tierMap[a as keyof typeof tierMap];
    if (tier) counts[tier]++;
  });

  // Find highest frequency
  let topTier: Tier = "CASUAL";
  let max = 0;

  for (const tier in counts) {
    if (counts[tier as Tier] > max) {
      max = counts[tier as Tier];
      topTier = tier as Tier;
    }
  }

  return topTier;
}