import type { Pokemon } from "@/types/pokemon";
import { roleLabels } from "@/types/pokemon";
import styles from "./PokemonRandomPicker.module.css";

type TeamResultDisplayProps = {
  pokemon: Pokemon[];
};

export function TeamResultDisplay({ pokemon }: TeamResultDisplayProps) {
  return (
    <div className={styles.teamGrid}>
      {pokemon.map((pickedPokemon, index) => (
        <div
          key={pickedPokemon.id}
          className={`${styles.teamSlot} ${styles[pickedPokemon.role]}`}
        >
          <div className={styles.slotLabel}>{index + 1}P</div>
          <div className={styles.slotDreamImage}>
            <span>{roleSymbols[pickedPokemon.role]}</span>
          </div>
          <div className={styles.slotName}>{pickedPokemon.nameJa}</div>
          <div className={styles.slotSub}>
            {pickedPokemon.nameEn} / {roleLabels[pickedPokemon.role]}
          </div>
        </div>
      ))}
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
