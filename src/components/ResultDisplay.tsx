import type { Pokemon } from "@/types/pokemon";
import {
  attackRangeLabels,
  difficultyLabels,
  roleLabels
} from "@/types/pokemon";
import styles from "./PokemonRandomPicker.module.css";

type ResultDisplayProps = {
  pokemon: Pokemon;
};

export function ResultDisplay({ pokemon }: ResultDisplayProps) {
  return (
    <div className={styles.resultCard}>
      <div className={`${styles.portrait} ${styles[pokemon.role]}`}>
        {pokemon.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pokemon.imageUrl} alt={pokemon.nameJa} />
        ) : (
          <div className={styles.dreamPortrait}>
            <span className={styles.dreamSymbol}>{roleSymbols[pokemon.role]}</span>
            <span className={styles.dreamName}>{pokemon.nameJa}</span>
          </div>
        )}
      </div>
      <div>
        <h2 className={styles.resultName}>{pokemon.nameJa}</h2>
        <div className={styles.resultSub}>{pokemon.nameEn}</div>
        <div className={styles.metaGrid}>
          <span className={styles.metaPill}>{roleLabels[pokemon.role]}</span>
          <span className={styles.metaPill}>
            {attackRangeLabels[pokemon.attackRange]}
          </span>
          <span className={styles.metaPill}>
            {difficultyLabels[pokemon.difficulty]}
          </span>
          {pokemon.releaseDate ? (
            <span className={styles.metaPill}>実装日 {pokemon.releaseDate}</span>
          ) : null}
          {pokemon.memo ? (
            <span className={styles.metaPill}>{pokemon.memo}</span>
          ) : null}
        </div>
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
