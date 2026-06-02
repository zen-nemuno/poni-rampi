"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { pokemonList as basePokemonList } from "@/data/pokemon";
import type {
  LatestPickResult,
  PickMode,
  Pokemon,
  RandomPickHistoryItem
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
  filterPokemon,
  pickOnePokemon,
  pickTeamPokemon
} from "@/utils/randomPick";
import {
  applyPokemonSettings,
  createHistoryItem,
  createPokemonSettings,
  loadPoniRampiStorage,
  POKEMON_DATA_VERSION,
  saveLatestPickResult,
  savePoniRampiStorage
} from "@/utils/storage";
import styles from "./PokemonRandomPicker.module.css";

const noCandidatesMessage =
  "条件に合うポケモンがいません。フィルターや除外設定を見直してください。";
const notEnoughTeamMessage =
  "5人分を抽選するには、条件に合うポケモンが5体以上必要です。";
const notEnoughCustomMessage =
  "5vs5を抽選するには、条件に合うポケモンが10体以上必要です。";

export function PokemonRandomPicker() {
  const [mode, setMode] = useState<PickMode>("single");
  const [pokemonList, setPokemonList] = useState<Pokemon[]>(basePokemonList);
  const [filters, setFilters] = useState(defaultFilters);
  const [history, setHistory] = useState<RandomPickHistoryItem[]>([]);
  const [latestResult, setLatestResult] = useState<LatestPickResult | null>(null);
  const [rouletteName, setRouletteName] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const timeoutIds = useRef<number[]>([]);

  const candidates = useMemo(
    () => filterPokemon(pokemonList, filters, history),
    [filters, history, pokemonList]
  );

  useEffect(() => {
    const storedValue = loadPoniRampiStorage();
    setPokemonList(
      applyPokemonSettings(basePokemonList, storedValue.pokemonSettings)
    );
    setFilters(storedValue.filters);
    setHistory(storedValue.history);
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
      history
    });
  }, [filters, hasLoadedStorage, history, pokemonList]);

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

  function handlePick() {
    setErrorMessage("");
    setCopyMessage("");

    const pickCount = getPickCount(mode);
    const notEnoughMessage =
      mode === "custom" ? notEnoughCustomMessage : notEnoughTeamMessage;

    if (mode !== "single" && candidates.length < pickCount) {
      setErrorMessage(notEnoughMessage);
      return;
    }

    if (candidates.length === 0) {
      setErrorMessage(noCandidatesMessage);
      return;
    }

    const pickedPokemon =
      mode === "single"
        ? [pickOnePokemon(pokemonList, filters, history)].filter(
            (pokemon): pokemon is Pokemon => pokemon !== null
          )
        : pickTeamPokemon(pokemonList, filters, history, pickCount);

    if (pickedPokemon.length === 0) {
      setErrorMessage(mode === "single" ? noCandidatesMessage : notEnoughMessage);
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
              眠ノポニの夜ふかしランダムピック配信ツール
            </p>
          </div>
          <Link className={styles.overlayLink} href="/overlay" target="_blank">
            OBSの夢窓を開く
          </Link>
        </header>

        <section className={styles.mainColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>抽選モード</h2>
              <span className={styles.candidateCount}>
                夢候補 {candidates.length}体
              </span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.modeGrid}>
                <button
                  className={`${styles.modeButton} ${
                    mode === "single" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => setMode("single")}
                >
                  1体ランダム
                </button>
                <button
                  className={`${styles.modeButton} ${
                    mode === "team" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => setMode("team")}
                >
                  5人チームランダム
                </button>
                <button
                  className={`${styles.modeButton} ${
                    mode === "custom" ? styles.modeButtonActive : ""
                  }`}
                  type="button"
                  onClick={() => setMode("custom")}
                >
                  10人カスタム 5vs5
                </button>
              </div>
              <div className={styles.actionRow}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={isRolling}
                  onClick={handlePick}
                >
                  {isRolling ? "夢をまぜまぜ中..." : "ねむねむ抽選する"}
                </button>
                <button
                  className={styles.copyButton}
                  type="button"
                  disabled={!latestResult}
                  onClick={handleCopy}
                >
                  結果コピー
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

          <div className={styles.roulette} aria-live="polite">
            <div>
              <p className={styles.rouletteLead}>今夜の眠ノポニは……</p>
              <p className={styles.rouletteName}>
                {rouletteName || "すやすや待機中"}
              </p>
              {latestResult && !isRolling ? (
                <p className={styles.catchphrase}>この夢に決めたポニ！</p>
              ) : null}
            </div>
          </div>

          {latestResult ? (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>今夜の夢結果</h2>
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
              <h2 className={styles.cardTitle}>夢の履歴</h2>
              <button
                className={styles.ghostButton}
                type="button"
                onClick={handleResetHistory}
              >
                履歴をおやすみ
              </button>
            </div>
            <div className={styles.cardBody}>
              <HistoryList history={history} />
            </div>
          </div>
        </section>

        <aside className={styles.sideColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>夢フィルター</h2>
            </div>
            <div className={styles.cardBody}>
              <FilterPanel filters={filters} onChange={setFilters} />
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>手持ち・夢除外</h2>
            </div>
            <div className={styles.cardBody}>
              <PokemonSettingsList
                pokemonList={pokemonList}
                onChange={handlePokemonSettingChange}
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function createCopyText(result: LatestPickResult) {
  if (result.mode === "single") {
    const pokemon = result.pokemon[0];

    return [
      "今夜のPoni Rampi結果！",
      `眠ノポニが選んだ夢ピックは「${pokemon.nameJa}」！`,
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
      "今夜のPoni Rampi結果！",
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

  return [
    "今夜のPoni Rampi結果！",
    "",
    ...result.pokemon.map((pokemon, index) => `${index + 1}P：${pokemon.nameJa}`),
    "",
    "#PoniRampi",
    "#ポケモンユナイト"
  ].join("\n");
}

function getPickCount(mode: PickMode) {
  if (mode === "custom") {
    return 10;
  }

  if (mode === "team") {
    return 5;
  }

  return 1;
}

function formatRouletteResultName(mode: PickMode, pokemon: Pokemon[]) {
  if (mode === "single") {
    return pokemon[0]?.nameJa ?? "";
  }

  if (mode === "custom") {
    return "5vs5カスタム決定！";
  }

  return "5人チーム決定！";
}
