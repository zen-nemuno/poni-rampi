import type { Pokemon } from "@/types/pokemon";
import { roleLabels } from "@/types/pokemon";
import styles from "./PokemonRandomPicker.module.css";

type PokemonSettingsListProps = {
  pokemonList: Pokemon[];
  onChange: (pokemon: Pokemon) => void;
};

export function PokemonSettingsList({
  pokemonList,
  onChange
}: PokemonSettingsListProps) {
  return (
    <div className={styles.settingsList}>
      {pokemonList.map((pokemon) => (
        <div key={pokemon.id} className={styles.settingsItem}>
          <div className={styles.settingsTop}>
            <div>
              <div className={styles.pokemonName}>{pokemon.nameJa}</div>
              <div className={styles.pokemonMeta}>
                {pokemon.nameEn} / {roleLabels[pokemon.role]}
              </div>
            </div>
          </div>
          <div className={styles.settingsControls}>
            <label className={styles.toggleLine}>
              <input
                type="checkbox"
                checked={pokemon.isOwned}
                onChange={(event) =>
                  onChange({ ...pokemon, isOwned: event.target.checked })
                }
              />
              所持済み
            </label>
            <label className={styles.toggleLine}>
              <input
                type="checkbox"
                checked={pokemon.isEnabled}
                onChange={(event) =>
                  onChange({ ...pokemon, isEnabled: event.target.checked })
                }
              />
              抽選対象
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
