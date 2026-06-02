import { writeFile } from "node:fs/promises";
import { pokemonList as fallbackPokemonList } from "../src/data/pokemon";
import type {
  AttackRange,
  Difficulty,
  Pokemon,
  PokemonRole
} from "../src/types/pokemon";

const fandomListUrl =
  "https://pokemonunite.fandom.com/wiki/List_of_Pok%C3%A9mon";

const japaneseNameByEnglishName: Record<string, string> = Object.fromEntries(
  fallbackPokemonList.map((pokemon) => [pokemon.nameEn.toLowerCase(), pokemon.nameJa])
);

async function main() {
  const response = await fetch(fandomListUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon data: ${response.status}`);
  }

  const html = await response.text();
  const pokemon = parsePokemonRows(html);

  if (pokemon.length < 10) {
    throw new Error("Could not find enough Pokemon rows in the fetched HTML.");
  }

  await writeFile("src/data/pokemon.ts", createPokemonDataSource(pokemon), "utf8");
  console.log(`Generated src/data/pokemon.ts with ${pokemon.length} Pokemon.`);
}

function parsePokemonRows(html: string): Pokemon[] {
  const tableMatches = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  const rows = tableMatches.flatMap((table) => table.match(/<tr[\s\S]*?<\/tr>/gi) ?? []);
  const parsedRows: Pokemon[] = [];

  for (const row of rows) {
    const cells = row.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? [];
    const values = cells.map(cleanHtmlText).filter(Boolean);

    const nameEn = values.find((value) =>
      fallbackPokemonList.some(
        (pokemon) => pokemon.nameEn.toLowerCase() === value.toLowerCase()
      )
    );

    if (!nameEn) {
      continue;
    }

    parsedRows.push({
      id: parsedRows.length + 1,
      nameJa: japaneseNameByEnglishName[nameEn.toLowerCase()] ?? nameEn,
      nameEn,
      role: findRole(values),
      attackRange: findAttackRange(values),
      difficulty: findDifficulty(values),
      imageUrl: "",
      isOwned: true,
      isEnabled: true,
      releaseDate: findReleaseDate(values),
      memo: ""
    });
  }

  return dedupeByName(parsedRows);
}

function cleanHtmlText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function findRole(values: string[]): PokemonRole {
  const text = values.join(" ").toLowerCase();

  if (text.includes("defender")) return "defender";
  if (text.includes("speedster")) return "speedster";
  if (text.includes("all-rounder") || text.includes("all rounder")) {
    return "allRounder";
  }
  if (text.includes("supporter")) return "supporter";
  return "attacker";
}

function findAttackRange(values: string[]): AttackRange {
  const text = values.join(" ").toLowerCase();
  return text.includes("melee") ? "melee" : "ranged";
}

function findDifficulty(values: string[]): Difficulty {
  const text = values.join(" ").toLowerCase();

  if (text.includes("expert") || text.includes("advanced")) return "advanced";
  if (text.includes("intermediate")) return "intermediate";
  return "beginner";
}

function findReleaseDate(values: string[]) {
  const dateCell = values.find((value) =>
    /\b(20\d{2})[-/ ]\d{1,2}[-/ ]\d{1,2}\b/.test(value)
  );

  if (!dateCell) {
    return "";
  }

  const match = dateCell.match(/\b(20\d{2})[-/ ](\d{1,2})[-/ ](\d{1,2})\b/);

  if (!match) {
    return "";
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function dedupeByName(pokemon: Pokemon[]) {
  const seenNames = new Set<string>();

  return pokemon.filter((item) => {
    const key = item.nameEn.toLowerCase();

    if (seenNames.has(key)) {
      return false;
    }

    seenNames.add(key);
    return true;
  });
}

function createPokemonDataSource(pokemon: Pokemon[]) {
  return `import type { Pokemon } from "@/types/pokemon";

export const pokemonList: Pokemon[] = ${JSON.stringify(pokemon, null, 2)};
`;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  console.error("Fallback data in src/data/pokemon.ts was left unchanged.");
  process.exitCode = 1;
});
