"use client";

import { useEffect, useState } from "react";
import type { LatestPickResult } from "@/types/pokemon";
import { roleLabels } from "@/types/pokemon";
import { loadLatestPickResult } from "@/utils/storage";
import styles from "./OverlayDisplay.module.css";

export function OverlayDisplay() {
  const [latestResult, setLatestResult] = useState<LatestPickResult | null>(null);

  useEffect(() => {
    setLatestResult(loadLatestPickResult());

    const intervalId = window.setInterval(() => {
      setLatestResult(loadLatestPickResult());
    }, 1000);

    function handleStorage(event: StorageEvent) {
      if (event.key === "poni-rampi-latest-result") {
        setLatestResult(loadLatestPickResult());
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <main className={styles.overlay}>
      <section className={styles.panel} aria-live="polite">
        <div className={styles.brand}>Nemuno Poni / Poni Rampi</div>
        {latestResult ? (
          latestResult.mode === "single" ? (
            <SingleOverlay result={latestResult} />
          ) : (
            <TeamOverlay result={latestResult} />
          )
        ) : (
          <div className={styles.empty}>夢結果を待機中</div>
        )}
      </section>
    </main>
  );
}

function SingleOverlay({ result }: { result: LatestPickResult }) {
  const pokemon = result.pokemon[0];

  return (
    <div className={styles.single}>
      <div className={styles.label}>この夢に決めたポニ！</div>
      <div className={`${styles.singleDreamImage} ${styles[pokemon.role]}`}>
        <span>{roleSymbols[pokemon.role]}</span>
      </div>
      <h1 className={styles.singleName}>{pokemon.nameJa}</h1>
      <div className={styles.singleMeta}>
        {pokemon.nameEn} / {roleLabels[pokemon.role]}
      </div>
    </div>
  );
}

function TeamOverlay({ result }: { result: LatestPickResult }) {
  if (result.mode === "custom") {
    return (
      <div className={styles.team}>
        <div className={styles.label}>今夜の5vs5夢カスタム</div>
        <div className={styles.overlayVersusGrid}>
          <OverlayTeamColumn label="チームA" pokemon={result.pokemon.slice(0, 5)} start={1} />
          <div className={styles.overlayVersusBadge}>VS</div>
          <OverlayTeamColumn label="チームB" pokemon={result.pokemon.slice(5, 10)} start={6} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.team}>
      <div className={styles.label}>今夜の5人夢チーム</div>
      <div className={styles.teamGrid}>
        {result.pokemon.map((pokemon, index) => (
          <div
            key={pokemon.id}
            className={`${styles.teamSlot} ${styles[pokemon.role]}`}
          >
            <span>{index + 1}P</span>
            <div className={styles.teamDreamImage}>{roleSymbols[pokemon.role]}</div>
            <strong>{pokemon.nameJa}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverlayTeamColumn({
  label,
  pokemon,
  start
}: {
  label: string;
  pokemon: LatestPickResult["pokemon"];
  start: number;
}) {
  return (
    <div className={styles.overlayTeamColumn}>
      <div className={styles.overlayTeamLabel}>{label}</div>
      <div className={styles.overlayTeamList}>
        {pokemon.map((pickedPokemon, index) => (
          <div
            key={pickedPokemon.id}
            className={`${styles.overlayMiniSlot} ${styles[pickedPokemon.role]}`}
          >
            <span>{start + index}P</span>
            <strong>{pickedPokemon.nameJa}</strong>
          </div>
        ))}
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
