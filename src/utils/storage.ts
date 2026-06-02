import type {
  LatestPickResult,
  PoniRampiStorage,
  Pokemon,
  RandomPickFilters,
  RandomPickHistoryItem
} from "@/types/pokemon";
import { defaultFilters } from "@/utils/randomPick";

export const SETTINGS_STORAGE_KEY = "poni-rampi-settings";
export const LATEST_RESULT_STORAGE_KEY = "poni-rampi-latest-result";
export const POKEMON_DATA_VERSION = "2026-06-02-roster-92";

export const defaultStorage: PoniRampiStorage = {
  pokemonDataVersion: POKEMON_DATA_VERSION,
  pokemonSettings: [],
  filters: defaultFilters,
  history: []
};

function canUseLocalStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function readJson<T>(key: string): T | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

export function loadPoniRampiStorage(): PoniRampiStorage {
  const storedValue = readJson<Partial<PoniRampiStorage>>(SETTINGS_STORAGE_KEY);
  const canUseStoredPokemonSettings =
    storedValue?.pokemonDataVersion === POKEMON_DATA_VERSION;

  return {
    pokemonDataVersion: POKEMON_DATA_VERSION,
    pokemonSettings:
      canUseStoredPokemonSettings && Array.isArray(storedValue?.pokemonSettings)
      ? storedValue.pokemonSettings
      : defaultStorage.pokemonSettings,
    filters: normalizeFilters(storedValue?.filters),
    history: Array.isArray(storedValue?.history)
      ? storedValue.history
      : defaultStorage.history
  };
}

export function savePoniRampiStorage(storage: PoniRampiStorage) {
  writeJson(SETTINGS_STORAGE_KEY, storage);
}

export function loadLatestPickResult(): LatestPickResult | null {
  return readJson<LatestPickResult>(LATEST_RESULT_STORAGE_KEY);
}

export function saveLatestPickResult(result: LatestPickResult) {
  writeJson(LATEST_RESULT_STORAGE_KEY, result);
}

export function applyPokemonSettings(
  pokemonList: Pokemon[],
  settings: PoniRampiStorage["pokemonSettings"]
) {
  if (settings.length !== pokemonList.length) {
    return pokemonList;
  }

  const settingsById = new Map(settings.map((setting) => [setting.id, setting]));

  return pokemonList.map((pokemon) => {
    const setting = settingsById.get(pokemon.id);

    if (!setting) {
      return pokemon;
    }

    return {
      ...pokemon,
      isOwned: setting.isOwned,
      isEnabled: setting.isEnabled
    };
  });
}

export function createPokemonSettings(pokemonList: Pokemon[]) {
  return pokemonList.map((pokemon) => ({
    id: pokemon.id,
    isOwned: pokemon.isOwned,
    isEnabled: pokemon.isEnabled
  }));
}

export function createHistoryItem(
  mode: RandomPickHistoryItem["mode"],
  pokemon: Pokemon[]
): RandomPickHistoryItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    pickedAt: new Date().toISOString(),
    mode,
    pokemon
  };
}

function normalizeFilters(filters?: Partial<RandomPickFilters>): RandomPickFilters {
  return {
    roles: Array.isArray(filters?.roles) ? filters.roles : [],
    attackRanges: Array.isArray(filters?.attackRanges) ? filters.attackRanges : [],
    difficulties: Array.isArray(filters?.difficulties) ? filters.difficulties : [],
    ownedOnly:
      typeof filters?.ownedOnly === "boolean"
        ? filters.ownedOnly
        : defaultFilters.ownedOnly,
    excludeHistory:
      typeof filters?.excludeHistory === "boolean"
        ? filters.excludeHistory
        : defaultFilters.excludeHistory
  };
}
