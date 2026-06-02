import type { RandomPickHistoryItem } from "@/types/pokemon";
import styles from "./PokemonRandomPicker.module.css";

type HistoryListProps = {
  history: RandomPickHistoryItem[];
};

export function HistoryList({ history }: HistoryListProps) {
  if (history.length === 0) {
    return <div className={styles.emptyState}>まだ抽選履歴はありません。</div>;
  }

  return (
    <div className={styles.historyList}>
      {history.slice(0, 8).map((historyItem) => (
        <div key={historyItem.id} className={styles.historyItem}>
          <div className={styles.historyTop}>
            <div className={styles.pokemonName}>
              {historyItem.pokemon.map((pokemon) => pokemon.nameJa).join(" / ")}
            </div>
            <div className={styles.historyMeta}>
              {historyItem.mode === "single" ? "1体" : "5人チーム"}
            </div>
          </div>
          <div className={styles.historyMeta}>
            {new Date(historyItem.pickedAt).toLocaleString("ja-JP")}
          </div>
        </div>
      ))}
    </div>
  );
}
