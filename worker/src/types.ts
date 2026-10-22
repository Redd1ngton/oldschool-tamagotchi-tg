export type Race = 'pig' | 'cat' | 'chicken' | 'dino' | 'bunny' | 'dog' | 'bear' | 'frog';

export type Trait = 'toxic' | 'loving' | 'tsundere' | 'lazy' | 'chaotic' | 'nostalgic';

export type Stage = 'egg' | 'baby' | 'child' | 'teen' | 'adult' | 'dead';

export type Mood = 'happy' | 'neutral' | 'angry' | 'sad' | 'sick' | 'loving' | 'hungry';

export interface Pet {
  id: string;                    // telegram user id
  name: string;
  race: Race;
  traits: Trait[];
  stage: Stage;
  hunger: number;                // 0-100 (0 = full, 100 = starving)
  mood: number;                  // 0-100
  health: number;                // 0-100
  affection: number;             // 0-100
  ageHours: number;
  lastActionAt: number;          // unix timestamp
  bornAt: number;
  deaths: number;
  lastMessage: string;
  history: string[];             // last 10 events
}

export interface ActionResult {
  pet: Pet;
  message: string;
  animation: string;
}