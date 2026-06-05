"use client";

import Link from "next/link";
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
      <Link className={styles.homeLink} href="/" aria-label="トップ画面へ戻る">
        操作画面へ
      </Link>
      <section className={styles.panel} aria-live="polite">
        <div className={styles.brand}>Nemuno Poni / Poni Rampi</div>
        {latestResult ? (
          latestResult.mode === "single" ? (
            <SingleOverlay result={latestResult} />
          ) : (
            <TeamOverlay result={latestResult} />
          )
        ) : (
          <div className={styles.empty}>抽選結果を待機中</div>
        )}
      </section>
    </main>
  );
}

function SingleOverlay({ result }: { result: LatestPickResult }) {
  const pokemon = result.pokemon[0];

  return (
    <div className={styles.single}>
      <div className={styles.label}>ランダムピック結果</div>
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
        <div className={styles.label}>5vs5カスタム振り分け</div>
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
      <div className={styles.label}>{getTeamOverlayLabel(result.mode)}</div>
      <div
        className={styles.teamGrid}
        style={{
          gridTemplateColumns: `repeat(${Math.min(
            result.pokemon.length,
            5
          )}, minmax(0, 1fr))`
        }}
      >
        {result.pokemon.map((pokemon, index) => (
          <div
            key={pokemon.id}
            className={`${styles.teamSlot} ${styles[pokemon.role]}`}
          >
            <span>{index + 1}P</span>
            <div className={styles.teamDreamImage}>
              {pokemon.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pokemon.imageUrl} alt={pokemon.nameJa} />
              ) : (
                roleSymbols[pokemon.role]
              )}
            </div>
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
            {pickedPokemon.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pickedPokemon.imageUrl} alt={pickedPokemon.nameJa} />
            ) : null}
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

function getTeamOverlayLabel(mode: LatestPickResult["mode"]) {
  if (mode === "duo") {
    return "2人デュオ結果";
  }

  if (mode === "trio") {
    return "3人トリオ結果";
  }

  if (mode === "quick") {
    return "4人クイック結果";
  }

  return "5人チーム結果";
}
