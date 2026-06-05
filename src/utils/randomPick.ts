import type {
  Pokemon,
  PokemonRole,
  RandomPickFilters,
  RandomPickHistoryItem,
  RoleComposition
} from "@/types/pokemon";

const roles: PokemonRole[] = [
  "attacker",
  "allRounder",
  "defender",
  "supporter",
  "speedster"
];

export const defaultFilters: RandomPickFilters = {
  roles: [],
  attackRanges: [],
  difficulties: [],
  ownedOnly: false,
  excludeHistory: false
};

export const defaultRoleComposition: RoleComposition = {
  attacker: 0,
  defender: 0,
  speedster: 0,
  allRounder: 0,
  supporter: 0
};

export function filterPokemon(
  pokemonList: Pokemon[],
  filters: RandomPickFilters,
  history: RandomPickHistoryItem[],
  options: { ignoreRoleFilter?: boolean } = {}
): Pokemon[] {
  const historyPokemonIds = new Set(
    history.flatMap((historyItem) => historyItem.pokemon.map((pokemon) => pokemon.id))
  );

  return pokemonList.filter((pokemon) => {
    if (!pokemon.isEnabled) {
      return false;
    }

    if (filters.ownedOnly && !pokemon.isOwned) {
      return false;
    }

    if (filters.excludeHistory && historyPokemonIds.has(pokemon.id)) {
      return false;
    }

    if (
      !options.ignoreRoleFilter &&
      filters.roles.length > 0 &&
      !filters.roles.includes(pokemon.role)
    ) {
      return false;
    }

    if (
      filters.attackRanges.length > 0 &&
      !filters.attackRanges.includes(pokemon.attackRange)
    ) {
      return false;
    }

    if (
      filters.difficulties.length > 0 &&
      !filters.difficulties.includes(pokemon.difficulty)
    ) {
      return false;
    }

    return true;
  });
}

export function pickOnePokemon(
  pokemonList: Pokemon[],
  filters: RandomPickFilters,
  history: RandomPickHistoryItem[]
): Pokemon | null {
  const candidates = filterPokemon(pokemonList, filters, history);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function pickTeamPokemon(
  pokemonList: Pokemon[],
  filters: RandomPickFilters,
  history: RandomPickHistoryItem[],
  count: number
): Pokemon[] {
  const candidates = [...filterPokemon(pokemonList, filters, history)];

  if (candidates.length < count) {
    return [];
  }

  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [candidates[index], candidates[randomIndex]] = [
      candidates[randomIndex],
      candidates[index]
    ];
  }

  return candidates.slice(0, count);
}

export function pickPokemonByRoleComposition(
  pokemonList: Pokemon[],
  filters: RandomPickFilters,
  history: RandomPickHistoryItem[],
  roleComposition: RoleComposition,
  flexCount: number,
  teamCopies: number
): Pokemon[] {
  const candidates = filterPokemon(pokemonList, filters, history, {
    ignoreRoleFilter: true
  });
  const remainingCandidates = shufflePokemon(candidates);
  const pickedPokemon: Pokemon[] = [];

  for (let copyIndex = 0; copyIndex < teamCopies; copyIndex += 1) {
    const pickedTeamPokemon: Pokemon[] = [];

    for (const role of roles) {
      const count = roleComposition[role];

      for (let countIndex = 0; countIndex < count; countIndex += 1) {
        const candidateIndex = remainingCandidates.findIndex(
          (pokemon) => pokemon.role === role
        );

        if (candidateIndex === -1) {
          return [];
        }

        const [pickedRolePokemon] = remainingCandidates.splice(candidateIndex, 1);
        pickedTeamPokemon.push(pickedRolePokemon);
      }
    }

    for (let flexIndex = 0; flexIndex < flexCount; flexIndex += 1) {
      const pickedFlexPokemon = remainingCandidates.shift();

      if (!pickedFlexPokemon) {
        return [];
      }

      pickedTeamPokemon.push(pickedFlexPokemon);
    }

    pickedPokemon.push(...shufflePokemon(pickedTeamPokemon));
  }

  return pickedPokemon;
}

export function getRoleCompositionTotal(
  roleComposition: RoleComposition,
  flexCount = 0
) {
  return roles.reduce(
    (total, role) => total + roleComposition[role],
    flexCount
  );
}

function shufflePokemon(pokemonList: Pokemon[]) {
  const shuffledPokemon = [...pokemonList];

  for (let index = shuffledPokemon.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledPokemon[index], shuffledPokemon[randomIndex]] = [
      shuffledPokemon[randomIndex],
      shuffledPokemon[index]
    ];
  }

  return shuffledPokemon;
}
