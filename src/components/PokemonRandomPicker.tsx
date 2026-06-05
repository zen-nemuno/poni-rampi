"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { pokemonList as basePokemonList } from "@/data/pokemon";
import type {
  LatestPickResult,
  PickMode,
  Pokemon,
  RandomPickFilters,
  RandomPickHistoryItem,
  RoleComposition
} from "@/types/pokemon";
import {
  attackRangeLabels,
  difficultyLabels,
  roleLabels
} from "@/types/pokemon";
import { FilterPanel } from "@/components/FilterPanel";
import { HistoryList } from "@/components/HistoryList";
import { PokemonSettingsList } from "@/components/PokemonSettingsList";
import { ResultDisplay } from "@/components/ResultDisplay";
import { TeamResultDisplay } from "@/components/TeamResultDisplay";
import {
  defaultFilters,
  defaultRoleComposition,
  filterPokemon,
  getRoleCompositionTotal,
  pickOnePokemon,
  pickPokemonByRoleComposition,
  pickTeamPokemon
} from "@/utils/randomPick";
import {
  applyPokemonSettings,
  createHistoryItem,
  createPokemonSettings,
  loadLatestPickResult,
  loadPoniRampiStorage,
  POKEMON_DATA_VERSION,
  saveLatestPickResult,
  savePoniRampiStorage
} from "@/utils/storage";
import styles from "./PokemonRandomPicker.module.css";

const noCandidatesMessage =
  "条件に合うポケモンがいません。フィルターや除外設定を見直してください。";
const notEnoughCustomMessage =
  "5vs5を抽選するには、条件に合うポケモンが10体以上必要です。";
const invalidRoleCompositionMessage =
  "構成指定を使う場合は、必要な人数ぴったりになるようにしてください。";
const notEnoughRoleCompositionMessage =
  "指定した構成で抽選できません。対象ポケモンや所持・除外設定を見直してください。";

const roleCompositionOptions: Array<keyof RoleComposition> = [
  "attacker",
  "allRounder",
  "defender",
  "supporter",
  "speedster"
];

export function PokemonRandomPicker() {
  const [mode, setMode] = useState<PickMode>("single");
  const [pokemonList, setPokemonList] = useState<Pokemon[]>(basePokemonList);
  const [filters, setFilters] = useState(defaultFilters);
  const [roleComposition, setRoleComposition] = useState<RoleComposition>(
    defaultRoleComposition
  );
  const [roleFlexCount, setRoleFlexCount] = useState(0);
  const [history, setHistory] = useState<RandomPickHistoryItem[]>([]);
  const [latestResult, setLatestResult] = useState<LatestPickResult | null>(null);
  const [rouletteName, setRouletteName] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const timeoutIds = useRef<number[]>([]);

  const candidates = useMemo(
    () => filterPokemon(pokemonList, filters, history),
    [filters, history, pokemonList]
  );
  const roleCompositionTarget = getRoleCompositionTarget(mode);

  useEffect(() => {
    const storedValue = loadPoniRampiStorage();
    setPokemonList(
      applyPokemonSettings(basePokemonList, storedValue.pokemonSettings)
    );
    setFilters(storedValue.filters);
    setMode(storedValue.selectedMode ?? "single");
    setRoleComposition(storedValue.roleComposition ?? defaultRoleComposition);
    setRoleFlexCount(storedValue.roleFlexCount ?? 0);
    setHistory(storedValue.history);

    const storedLatestResult = loadLatestPickResult();

    if (storedLatestResult) {
      setLatestResult(storedLatestResult);
      setRouletteName(
        formatRouletteResultName(
          storedLatestResult.mode,
          storedLatestResult.pokemon
        )
      );
    }

    setHasLoadedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    savePoniRampiStorage({
      pokemonDataVersion: POKEMON_DATA_VERSION,
      pokemonSettings: createPokemonSettings(pokemonList),
      filters,
      selectedMode: mode,
      roleComposition,
      roleFlexCount,
      history
    });
  }, [
    filters,
    hasLoadedStorage,
    history,
    mode,
    pokemonList,
    roleComposition,
    roleFlexCount
  ]);

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  function handlePokemonSettingChange(updatedPokemon: Pokemon) {
    setPokemonList((currentPokemonList) =>
      currentPokemonList.map((pokemon) =>
        pokemon.id === updatedPokemon.id ? updatedPokemon : pokemon
      )
    );
  }

  function handleBulkEnabledChange(pokemonIds: number[], isEnabled: boolean) {
    const pokemonIdSet = new Set(pokemonIds);

    setPokemonList((currentPokemonList) =>
      currentPokemonList.map((pokemon) =>
        pokemonIdSet.has(pokemon.id) ? { ...pokemon, isEnabled } : pokemon
      )
    );
  }

  function handleModeChange(nextMode: PickMode) {
    const nextTarget = getRoleCompositionTarget(nextMode);
    const trimmedComposition = trimRoleCompositionToTarget(
      roleComposition,
      roleFlexCount,
      nextTarget
    );

    setMode(nextMode);
    setRoleComposition(trimmedComposition.roleComposition);
    setRoleFlexCount(trimmedComposition.roleFlexCount);
    setErrorMessage("");
  }

  function handleRoleCompositionChange(role: keyof RoleComposition, count: number) {
    setRoleComposition((currentRoleComposition) => ({
      ...currentRoleComposition,
      [role]: Math.min(roleCompositionTarget, Math.max(0, count))
    }));
  }

  function handleRoleFlexCountChange(count: number) {
    setRoleFlexCount(Math.min(roleCompositionTarget, Math.max(0, count)));
  }

  function handlePick() {
    setErrorMessage("");
    setCopyMessage("");

    const pickCount = getPickCount(mode);
    const roleCompositionTotal = getRoleCompositionTotal(
      roleComposition,
      roleFlexCount
    );
    const usesRoleComposition = mode !== "single" && roleCompositionTotal > 0;
    const availableCandidateCount = usesRoleComposition
      ? filterPokemon(pokemonList, filters, history, {
          ignoreRoleFilter: true
        }).length
      : candidates.length;
    const notEnoughMessage = getNotEnoughMessage(mode);

    if (usesRoleComposition && roleCompositionTotal !== roleCompositionTarget) {
      setErrorMessage(invalidRoleCompositionMessage);
      return;
    }

    if (mode !== "single" && availableCandidateCount < pickCount) {
      setErrorMessage(notEnoughMessage);
      return;
    }

    if (candidates.length === 0) {
      setErrorMessage(noCandidatesMessage);
      return;
    }

    const pickedPokemon = getPickedPokemon({
      mode,
      pokemonList,
      filters,
      history,
      pickCount,
      roleComposition,
      roleFlexCount,
      usesRoleComposition
    });

    if (pickedPokemon.length === 0) {
      setErrorMessage(
        usesRoleComposition
          ? notEnoughRoleCompositionMessage
          : mode === "single"
            ? noCandidatesMessage
            : notEnoughMessage
      );
      return;
    }

    runRoulette(pickedPokemon);
  }

  function runRoulette(pickedPokemon: Pokemon[]) {
    timeoutIds.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIds.current = [];
    setIsRolling(true);
    setRouletteName(candidates[0]?.nameJa ?? "");

    const delays = [70, 95, 120, 150, 190, 240, 300, 380, 470, 580];
    let elapsed = 0;

    delays.forEach((delay, index) => {
      elapsed += delay;
      const timeoutId = window.setTimeout(() => {
        const nextCandidate = candidates[index % candidates.length];
        setRouletteName(nextCandidate.nameJa);
      }, elapsed);
      timeoutIds.current.push(timeoutId);
    });

    const finalTimeoutId = window.setTimeout(() => {
      const result: LatestPickResult = {
        pickedAt: new Date().toISOString(),
        mode,
        pokemon: pickedPokemon
      };
      const nextHistoryItem = createHistoryItem(mode, pickedPokemon);

      setLatestResult(result);
      setHistory((currentHistory) => [nextHistoryItem, ...currentHistory]);
      saveLatestPickResult(result);
      setRouletteName(formatRouletteResultName(mode, pickedPokemon));
      setIsRolling(false);
    }, elapsed + 420);

    timeoutIds.current.push(finalTimeoutId);
  }

  async function handleCopy() {
    if (!latestResult) {
      return;
    }

    const text = createCopyText(latestResult);

    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("抽選結果をコピーしました。");
    } catch {
      setCopyMessage("コピーに失敗しました。手動で結果を選択してください。");
    }
  }

  function handleResetHistory() {
    setHistory([]);
    setCopyMessage("");
    setErrorMessage("");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Nemuno Poni Night Pick Room</p>
            <h1 className={styles.title}>Poni Rampi</h1>
            <p className={styles.subtitle}>
              ポケモンユナイトのランダムピック・カスタム振り分けツール
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.settingsMenuButton}
              type="button"
              onClick={() => setIsSettingsOpen(true)}
            >
              詳細設定
            </button>
            <Link className={styles.overlayLink} href="/overlay" target="_blank">
              配信用結果画面を開く
            </Link>
          </div>
        </header>

        <section className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>ピック方法を選ぶ</h2>
              <span className={styles.candidateCount}>
                対象ポケモン {candidates.length}体
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.modeGrid}>
                <button
                  className={`${styles.modeButton} ${
                    mode === "single" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => handleModeChange("single")}
                >
                  <span>1体だけ選ぶ</span>
                  <small>ソロ用のランダムピック</small>
                </button>
                <button
                  className={`${styles.modeButton} ${
                    mode === "duo" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => handleModeChange("duo")}
                >
                  <span>2人デュオを作る</span>
                  <small>デュオ用に2枠を抽選</small>
                </button>
                <button
                  className={`${styles.modeButton} ${
                    mode === "trio" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => handleModeChange("trio")}
                >
                  <span>3人トリオを作る</span>
                  <small>トリオ用に3枠を抽選</small>
                </button>
                <button
                  className={`${styles.modeButton} ${
                    mode === "quick" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => handleModeChange("quick")}
                >
                  <span>4人クイックを作る</span>
                  <small>クイック用に4枠を抽選</small>
                </button>
                <button
                  className={`${styles.modeButton} ${
                    mode === "team" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => handleModeChange("team")}
                >
                  <span>5人チームを作る</span>
                  <small>味方5枠をまとめて抽選</small>
                </button>
                <button
                  className={`${styles.modeButton} ${
                    mode === "custom" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => handleModeChange("custom")}
                >
                  <span>10人を5vs5に分ける</span>
                  <small>カスタム用に上下チーム分け</small>
                </button>
              </div>
              <div className={styles.actionRow}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={isRolling}
                  onClick={handlePick}
                >
                  {isRolling ? "抽選中..." : "抽選する"}
                </button>
                <button
                  className={styles.copyButton}
                  type="button"
                  disabled={!latestResult}
                  onClick={handleCopy}
                >
                  結果をコピー
                </button>
              </div>
              {errorMessage ? (
                <div className={styles.error}>{errorMessage}</div>
              ) : null}
              {copyMessage ? (
                <div className={styles.message}>{copyMessage}</div>
              ) : null}
            </div>
          </div>

          {mode !== "single" ? (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>チーム構成を指定</h2>
                <span className={styles.candidateCount}>
                  必要枠 {getRoleCompositionTotal(
                    roleComposition,
                    roleFlexCount
                  )}
                  /
                  {roleCompositionTarget}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.compositionGrid}>
                  {roleCompositionOptions.map((role) => (
                    <label key={role} className={styles.compositionItem}>
                      <span>{roleLabels[role]}</span>
                      <input
                        type="number"
                        min="0"
                        max={roleCompositionTarget}
                        value={roleComposition[role]}
                        onChange={(event) =>
                          handleRoleCompositionChange(
                            role,
                            Number(event.target.value)
                          )
                        }
                      />
                    </label>
                  ))}
                  <label className={styles.compositionItem}>
                    <span>自由枠</span>
                    <input
                      type="number"
                      min="0"
                      max={roleCompositionTarget}
                      value={roleFlexCount}
                      onChange={(event) =>
                        handleRoleFlexCountChange(Number(event.target.value))
                      }
                    />
                  </label>
                </div>
                <div className={styles.actionRow}>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => {
                      setRoleComposition(getRecommendedRoleComposition(mode));
                      setRoleFlexCount(0);
                    }}
                  >
                    おすすめ構成にする
                  </button>
                  <button
                    className={styles.ghostButton}
                    type="button"
                    onClick={() => {
                      setRoleComposition(defaultRoleComposition);
                      setRoleFlexCount(0);
                    }}
                  >
                    構成指定なし
                  </button>
                </div>
                <p className={styles.helpText}>
                  自由枠はロール指定なしで埋める枠です。0枠のままなら完全ランダム。5vs5ではこの構成をチームA/Bにそれぞれ使います。
                </p>
              </div>
            </div>
          ) : null}

          <div className={styles.roulette} aria-live="polite">
            <div>
              <p className={styles.rouletteLead}>抽選結果</p>
              <p className={styles.rouletteName}>
                {rouletteName || "まだ抽選していません"}
              </p>
              {latestResult && !isRolling ? (
                <p className={styles.catchphrase}>この結果で決定！</p>
              ) : null}
            </div>
          </div>

          {latestResult ? (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>最新の抽選結果</h2>
              </div>
              <div className={styles.cardBody}>
                {latestResult.mode === "single" ? (
                  <ResultDisplay pokemon={latestResult.pokemon[0]} />
                ) : (
                  <TeamResultDisplay
                    pokemon={latestResult.pokemon}
                    mode={latestResult.mode}
                  />
                )}
              </div>
            </div>
          ) : null}

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>抽選履歴</h2>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={handleResetHistory}
              >
                履歴を消す
              </button>
            </div>
            <div className={styles.cardBody}>
              <HistoryList history={history} />
            </div>
          </div>
        </section>

        {isSettingsOpen ? (
          <button
            className={styles.settingsBackdrop}
            type="button"
            aria-label="詳細設定を閉じる"
            onClick={() => setIsSettingsOpen(false)}
          />
        ) : null}

        {isSettingsOpen ? (
          <aside className={`${styles.sideColumn} ${styles.sideColumnOpen}`}>
            <div className={styles.settingsPanelHeader}>
              <div>
                <p className={styles.eyebrow}>Settings Menu</p>
                <h2 className={styles.settingsPanelTitle}>詳細設定</h2>
              </div>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={() => setIsSettingsOpen(false)}
              >
                閉じる
              </button>
            </div>

            <details className={styles.settingsAccordion} open>
              <summary className={styles.settingsAccordionSummary}>
                <span>抽選条件</span>
                <small>ロール・射程・難度など</small>
              </summary>
              <div className={styles.settingsAccordionBody}>
                <FilterPanel filters={filters} onChange={setFilters} />
              </div>
            </details>

            <PokemonSettingsList
              pokemonList={pokemonList}
              onChange={handlePokemonSettingChange}
              onBulkEnabledChange={handleBulkEnabledChange}
            />
          </aside>
        ) : null}
      </div>
    </main>
  );
}

function createCopyText(result: LatestPickResult) {
  if (result.mode === "single") {
    const pokemon = result.pokemon[0];

    return [
      "Poni Rampi 抽選結果",
      `ランダムピックは「${pokemon.nameJa}」！`,
      "",
      `${roleLabels[pokemon.role]} / ${attackRangeLabels[pokemon.attackRange]} / ${
        difficultyLabels[pokemon.difficulty]
      }`,
      "",
      "#PoniRampi",
      "#ポケモンユナイト"
    ].join("\n");
  }

  if (result.mode === "custom") {
    const teamA = result.pokemon.slice(0, 5);
    const teamB = result.pokemon.slice(5, 10);

    return [
      "Poni Rampi 5vs5カスタム結果",
      "",
      "チームA",
      ...teamA.map((pokemon, index) => `${index + 1}P：${pokemon.nameJa}`),
      "",
      "チームB",
      ...teamB.map((pokemon, index) => `${index + 6}P：${pokemon.nameJa}`),
      "",
      "#PoniRampi",
      "#ポケモンユナイト"
    ].join("\n");
  }

  const modeLabel = getModeResultLabel(result.mode);

  return [
    `Poni Rampi ${modeLabel}`,
    "",
    ...result.pokemon.map((pokemon, index) => `${index + 1}P：${pokemon.nameJa}`),
    "",
    "#PoniRampi",
    "#ポケモンユナイト"
  ].join("\n");
}

function getPickedPokemon({
  mode,
  pokemonList,
  filters,
  history,
  pickCount,
  roleComposition,
  roleFlexCount,
  usesRoleComposition
}: {
  mode: PickMode;
  pokemonList: Pokemon[];
  filters: RandomPickFilters;
  history: RandomPickHistoryItem[];
  pickCount: number;
  roleComposition: RoleComposition;
  roleFlexCount: number;
  usesRoleComposition: boolean;
}) {
  if (mode === "single") {
    return [pickOnePokemon(pokemonList, filters, history)].filter(
      (pokemon): pokemon is Pokemon => pokemon !== null
    );
  }

  if (usesRoleComposition) {
    return pickPokemonByRoleComposition(
      pokemonList,
      filters,
      history,
      roleComposition,
      roleFlexCount,
      mode === "custom" ? 2 : 1
    );
  }

  return pickTeamPokemon(pokemonList, filters, history, pickCount);
}

function getPickCount(mode: PickMode) {
  if (mode === "custom") {
    return 10;
  }

  if (mode === "duo") {
    return 2;
  }

  if (mode === "trio") {
    return 3;
  }

  if (mode === "quick") {
    return 4;
  }

  if (mode === "team") {
    return 5;
  }

  return 1;
}

function getRoleCompositionTarget(mode: PickMode) {
  return mode === "custom" ? 5 : getPickCount(mode);
}

function trimRoleCompositionToTarget(
  roleComposition: RoleComposition,
  roleFlexCount: number,
  target: number
) {
  const nextRoleComposition = { ...roleComposition };
  let nextRoleFlexCount = roleFlexCount;
  let overflow =
    getRoleCompositionTotal(nextRoleComposition, nextRoleFlexCount) - target;

  if (overflow <= 0) {
    return {
      roleComposition: nextRoleComposition,
      roleFlexCount: nextRoleFlexCount
    };
  }

  const removableItems: Array<keyof RoleComposition | "flex"> = [
    "flex",
    "speedster",
    "supporter",
    "defender",
    "allRounder",
    "attacker"
  ];

  for (const item of removableItems) {
    if (overflow <= 0) {
      break;
    }

    const currentCount =
      item === "flex" ? nextRoleFlexCount : nextRoleComposition[item];
    const removableCount = Math.min(currentCount, overflow);

    if (item === "flex") {
      nextRoleFlexCount -= removableCount;
    } else {
      nextRoleComposition[item] -= removableCount;
    }

    overflow -= removableCount;
  }

  return {
    roleComposition: nextRoleComposition,
    roleFlexCount: nextRoleFlexCount
  };
}

function getRecommendedRoleComposition(mode: PickMode): RoleComposition {
  if (mode === "duo") {
    return {
      ...defaultRoleComposition,
      attacker: 1,
      defender: 1
    };
  }

  if (mode === "trio") {
    return {
      ...defaultRoleComposition,
      attacker: 1,
      allRounder: 1,
      supporter: 1
    };
  }

  if (mode === "quick") {
    return {
      ...defaultRoleComposition,
      attacker: 1,
      allRounder: 1,
      defender: 1,
      supporter: 1
    };
  }

  return {
    attacker: 1,
    allRounder: 1,
    defender: 1,
    supporter: 1,
    speedster: 1
  };
}

function formatRouletteResultName(mode: PickMode, pokemon: Pokemon[]) {
  if (mode === "single") {
    return pokemon[0]?.nameJa ?? "";
  }

  if (mode === "custom") {
    return "5vs5カスタム決定！";
  }

  return `${getModeShortLabel(mode)}決定！`;
}

function getNotEnoughMessage(mode: PickMode) {
  if (mode === "custom") {
    return notEnoughCustomMessage;
  }

  const pickCount = getPickCount(mode);

  return `${getModeShortLabel(mode)}を抽選するには、条件に合うポケモンが${pickCount}体以上必要です。`;
}

function getModeShortLabel(mode: PickMode) {
  if (mode === "duo") {
    return "2人デュオ";
  }

  if (mode === "trio") {
    return "3人トリオ";
  }

  if (mode === "quick") {
    return "4人クイック";
  }

  if (mode === "team") {
    return "5人チーム";
  }

  return "1体ピック";
}

function getModeResultLabel(mode: PickMode) {
  return `${getModeShortLabel(mode)}結果`;
}
