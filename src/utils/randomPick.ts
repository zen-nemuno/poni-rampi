import type {
  Pokemon,
  RandomPickFilters,
  RandomPickHistoryItem
} from "@/types/pokemon";

export const defaultFilters: RandomPickFilters = {
  roles: [],
  attackRanges: [],
  difficulties: [],
  ownedOnly: false,
  excludeHistory: false
};

export function filterPokemon(
  pokemonList: Pokemon[],
  filters: RandomPickFilters,
  history: RandomPickHistoryItem[]
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

    if (filters.roles.length > 0 && !filters.roles.includes(pokemon.role)) {
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
