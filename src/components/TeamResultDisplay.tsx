import type { Pokemon } from "@/types/pokemon";
import type { PickMode } from "@/types/pokemon";
import { roleLabels } from "@/types/pokemon";
import styles from "./PokemonRandomPicker.module.css";

type TeamResultDisplayProps = {
  pokemon: Pokemon[];
  mode: Exclude<PickMode, "single">;
};

export function TeamResultDisplay({ pokemon, mode }: TeamResultDisplayProps) {
  if (mode === "custom") {
    return (
      <div className={styles.versusGrid}>
        <PokemonTeamColumn label="チームA" pokemon={pokemon.slice(0, 5)} start={1} />
        <div className={styles.versusBadge}>5vs5</div>
        <PokemonTeamColumn label="チームB" pokemon={pokemon.slice(5, 10)} start={6} />
      </div>
    );
  }

  return (
    <div
      className={styles.teamGrid}
      style={{
        gridTemplateColumns: `repeat(${Math.min(pokemon.length, 5)}, minmax(0, 1fr))`
      }}
    >
      {pokemon.map((pickedPokemon, index) => (
        <PokemonSlot
          key={pickedPokemon.id}
          pokemon={pickedPokemon}
          label={`${index + 1}P`}
        />
      ))}
    </div>
  );
}

function PokemonTeamColumn({
  label,
  pokemon,
  start
}: {
  label: string;
  pokemon: Pokemon[];
  start: number;
}) {
  return (
    <div className={styles.versusColumn}>
      <div className={styles.versusTeamLabel}>{label}</div>
      <div className={styles.versusTeamList}>
        {pokemon.map((pickedPokemon, index) => (
          <PokemonSlot
            key={pickedPokemon.id}
            pokemon={pickedPokemon}
            label={`${start + index}P`}
          />
        ))}
      </div>
    </div>
  );
}

function PokemonSlot({ pokemon, label }: { pokemon: Pokemon; label: string }) {
  return (
    <div className={`${styles.teamSlot} ${styles[pokemon.role]}`}>
      <div className={styles.slotLabel}>{label}</div>
      <div className={styles.slotDreamImage}>
        {pokemon.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pokemon.imageUrl} alt={pokemon.nameJa} />
        ) : (
          <span>{roleSymbols[pokemon.role]}</span>
        )}
      </div>
      <div className={styles.slotName}>{pokemon.nameJa}</div>
      <div className={styles.slotSub}>
        {pokemon.nameEn} / {roleLabels[pokemon.role]}
      </div>
    </div>
  );
}

const roleSymbols = {
  attacker: "ATK",
  defender: "DEF",
  speedster: "SPD",
  allRounder: "BAL",
  supporter: "SUP"
} as const;
