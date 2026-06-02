export type PokemonRole =
  | "attacker"
  | "defender"
  | "speedster"
  | "allRounder"
  | "supporter";

export type AttackRange = "melee" | "ranged";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Pokemon = {
  id: number;
  nameJa: string;
  nameEn: string;
  role: PokemonRole;
  attackRange: AttackRange;
  difficulty: Difficulty;
  imageUrl?: string;
  isOwned: boolean;
  isEnabled: boolean;
  releaseDate?: string;
  memo?: string;
};

export type PickMode = "single" | "team";

export type RandomPickFilters = {
  roles: PokemonRole[];
  attackRanges: AttackRange[];
  difficulties: Difficulty[];
  ownedOnly: boolean;
  excludeHistory: boolean;
};

export type RandomPickHistoryItem = {
  id: string;
  pickedAt: string;
  mode: PickMode;
  pokemon: Pokemon[];
};

export type LatestPickResult = {
  pickedAt: string;
  mode: PickMode;
  pokemon: Pokemon[];
};

export type PoniRampiStorage = {
  pokemonDataVersion?: string;
  pokemonSettings: {
    id: number;
    isOwned: boolean;
    isEnabled: boolean;
  }[];
  filters: RandomPickFilters;
  history: RandomPickHistoryItem[];
};

export const roleLabels = {
  attacker: "アタック型",
  defender: "ディフェンス型",
  speedster: "スピード型",
  allRounder: "バランス型",
  supporter: "サポート型"
} as const satisfies Record<PokemonRole, string>;

export const attackRangeLabels = {
  melee: "近接",
  ranged: "遠隔"
} as const satisfies Record<AttackRange, string>;

export const difficultyLabels = {
  beginner: "初心者向け",
  intermediate: "中級者向け",
  advanced: "上級者向け"
} as const satisfies Record<Difficulty, string>;
