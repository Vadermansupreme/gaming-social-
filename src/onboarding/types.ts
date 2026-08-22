export type Intensity = "IM" | "MT" | "PB" | "HP" | "EA";
export type Environment = "IS" | "CO" | "NP" | "HE" | "CE";
export type Social = "FS" | "PP" | "SP" | "GE" | "CD";
export type Personality = "DO" | "BS" | "CC" | "ES" | "SE";
export type Commitment = "RV" | "CA" | "RB" | "DT" | "LI";

export type CategoryKey =
  | Intensity
  | Environment
  | Social
  | Personality
  | Commitment;

export type ScoreState = Record<CategoryKey, number>;

export type FinalProfile = {
  intensity: Intensity;
  environment: Environment;
  social: Social;
  personality: Personality;
  commitment: Commitment;
};

export type AnswerOption = {
  id: string;
  text: string;
  scores: Partial<ScoreState>;
};

export type Question = {
  id: number;
  question: string;
  options: AnswerOption[];
};