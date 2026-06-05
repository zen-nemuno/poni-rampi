import { useMemo, useState } from "react";
import { pokemonTagGroups } from "@/data/pokemonTags";
import type { Pokemon } from "@/types/pokemon";
import { roleLabels } from "@/types/pokemon";
import styles from "./PokemonRandomPicker.module.css";

type PokemonSettingsListProps = {
  pokemonList: Pokemon[];
  onChange: (pokemon: Pokemon) => void;
  onBulkEnabledChange: (pokemonIds: number[], isEnabled: boolean) => void;
};

export function PokemonSettingsList({
  pokemonList,
  onChange,
  onBulkEnabledChange
}: PokemonSettingsListProps) {
  const [searchText, setSearchText] = useState("");
  const normalizedSearchText = normalizeSearchText(searchText);
  const sortedPokemonList = useMemo(
    () => [...pokemonList].sort(comparePokemonByReleaseDateDesc),
    [pokemonList]
  );
  const tagSummaries = useMemo(
    () =>
      pokemonTagGroups
        .map((tagGroup) => {
          const matchedPokemon = pokemonList.filter(tagGroup.match);
          const enabledCount = matchedPokemon.filter(
            (pokemon) => pokemon.isEnabled
          ).length;

          return {
            ...tagGroup,
            matchedPokemon,
            enabledCount
          };
        })
        .filter((tagGroup) => tagGroup.matchedPokemon.length > 0),
    [pokemonList]
  );
  const filteredPokemonList = normalizedSearchText
    ? sortedPokemonList.filter((pokemon) =>
        createSearchTarget(pokemon).includes(normalizedSearchText)
      )
    : sortedPokemonList;

  return (
    <div className={styles.settingsSearchSection}>
      <details className={styles.settingsAccordion}>
        <summary className={styles.settingsAccordionSummary}>
          <span>タグでまとめて対象切替</span>
          <small>ロール・シリーズ単位で除外/復帰</small>
        </summary>
        <div className={styles.settingsAccordionBody}>
          <section className={styles.tagControlPanel}>
            <div className={styles.tagControlHeader}>
              <p>ロールやシリーズ単位で、抽選に入れる/外すを一括変更できます。</p>
            </div>
            <div className={styles.tagControlGrid}>
              {tagSummaries.map((tagGroup) => {
                const pokemonIds = tagGroup.matchedPokemon.map(
                  (pokemon) => pokemon.id
                );
                const disabledCount =
                  tagGroup.matchedPokemon.length - tagGroup.enabledCount;

                return (
                  <div key={tagGroup.id} className={styles.tagControlCard}>
                    <div>
                      <strong>{tagGroup.label}</strong>
                      <span>{tagGroup.description}</span>
                      <small>
                        対象 {tagGroup.matchedPokemon.length}匹 / 抽選中{" "}
                        {tagGroup.enabledCount}匹
                      </small>
                    </div>
                    <div className={styles.tagControlActions}>
                      <button
                        className={styles.tinyDangerButton}
                        type="button"
                        disabled={tagGroup.enabledCount === 0}
                        onClick={() => onBulkEnabledChange(pokemonIds, false)}
                      >
                        除外
                      </button>
                      <button
                        className={styles.tinyGhostButton}
                        type="button"
                        disabled={disabledCount === 0}
                        onClick={() => onBulkEnabledChange(pokemonIds, true)}
                      >
                        入れる
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </details>

      <details className={styles.settingsAccordion}>
        <summary className={styles.settingsAccordionSummary}>
          <span>ポケモン別の対象設定</span>
          <small>検索・所持・個別ON/OFF</small>
        </summary>
        <div className={styles.settingsAccordionBody}>
          <label className={styles.searchLabel}>
            <span>ポケモンを検索</span>
            <input
              type="search"
              value={searchText}
              placeholder="例：ピカチュウ / Pikachu / アタック"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>
          <div className={styles.searchCount}>
            {filteredPokemonList.length} / {pokemonList.length}匹を表示
          </div>
          {filteredPokemonList.length > 0 ? (
            <div className={styles.settingsList}>
              {filteredPokemonList.map((pokemon) => (
                <div key={pokemon.id} className={styles.settingsItem}>
                  <div className={styles.settingsTop}>
                    <div className={styles.settingsPokemonImage}>
                      {pokemon.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pokemon.imageUrl} alt={pokemon.nameJa} />
                      ) : (
                        <span>{roleLabels[pokemon.role].slice(0, 2)}</span>
                      )}
                    </div>
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
                      所持している
                    </label>
                    <label className={styles.toggleLine}>
                      <input
                        type="checkbox"
                        checked={pokemon.isEnabled}
                        onChange={(event) =>
                          onChange({ ...pokemon, isEnabled: event.target.checked })
                        }
                      />
                      抽選に入れる
                    </label>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>検索に合うポケモンがいません。</div>
          )}
        </div>
      </details>
    </div>
  );
}

function comparePokemonByReleaseDateDesc(firstPokemon: Pokemon, secondPokemon: Pokemon) {
  const firstTime = firstPokemon.releaseDate
    ? new Date(firstPokemon.releaseDate).getTime()
    : 0;
  const secondTime = secondPokemon.releaseDate
    ? new Date(secondPokemon.releaseDate).getTime()
    : 0;

  if (firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  return secondPokemon.id - firstPokemon.id;
}

function createSearchTarget(pokemon: Pokemon) {
  return normalizeSearchText(
    [
      pokemon.nameJa,
      pokemon.nameEn,
      roleLabels[pokemon.role],
      pokemon.releaseDate
    ].join(" ")
  );
}

function normalizeSearchText(value: string) {
  return value.trim().toLocaleLowerCase("ja-JP");
}
