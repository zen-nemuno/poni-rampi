import type {
  AttackRange,
  Difficulty,
  PokemonRole,
  RandomPickFilters
} from "@/types/pokemon";
import {
  attackRangeLabels,
  difficultyLabels,
  roleLabels
} from "@/types/pokemon";
import styles from "./PokemonRandomPicker.module.css";

type FilterPanelProps = {
  filters: RandomPickFilters;
  onChange: (filters: RandomPickFilters) => void;
};

const roleOptions = Object.keys(roleLabels) as PokemonRole[];
const attackRangeOptions = Object.keys(attackRangeLabels) as AttackRange[];
const difficultyOptions = Object.keys(difficultyLabels) as Difficulty[];

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className={styles.filterGroups}>
      <FilterGroup
        title="ロール"
        values={roleOptions}
        selectedValues={filters.roles}
        labels={roleLabels}
        onToggle={(roles) => onChange({ ...filters, roles })}
      />
      <FilterGroup
        title="攻撃距離"
        values={attackRangeOptions}
        selectedValues={filters.attackRanges}
        labels={attackRangeLabels}
        onToggle={(attackRanges) => onChange({ ...filters, attackRanges })}
      />
      <FilterGroup
        title="難易度"
        values={difficultyOptions}
        selectedValues={filters.difficulties}
        labels={difficultyLabels}
        onToggle={(difficulties) => onChange({ ...filters, difficulties })}
      />
      <label className={styles.toggleLine}>
        <input
          type="checkbox"
          checked={filters.ownedOnly}
          onChange={(event) =>
            onChange({ ...filters, ownedOnly: event.target.checked })
          }
        />
        所持済みだけに絞る
      </label>
      <label className={styles.toggleLine}>
        <input
          type="checkbox"
          checked={filters.excludeHistory}
          onChange={(event) =>
            onChange({ ...filters, excludeHistory: event.target.checked })
          }
        />
        直近の履歴に出たポケモンを除外
      </label>
    </div>
  );
}

type FilterGroupProps<T extends string> = {
  title: string;
  values: T[];
  selectedValues: T[];
  labels: Record<T, string>;
  onToggle: (values: T[]) => void;
};

function FilterGroup<T extends string>({
  title,
  values,
  selectedValues,
  labels,
  onToggle
}: FilterGroupProps<T>) {
  return (
    <div className={styles.filterGroup}>
      <div className={styles.filterTitle}>{title}</div>
      <div className={styles.chipGrid}>
        {values.map((value) => (
          <label key={value} className={styles.chip}>
            <input
              type="checkbox"
              checked={selectedValues.includes(value)}
              onChange={() => {
                const nextValues = selectedValues.includes(value)
                  ? selectedValues.filter((selectedValue) => selectedValue !== value)
                  : [...selectedValues, value];
                onToggle(nextValues);
              }}
            />
            {labels[value]}
          </label>
        ))}
      </div>
    </div>
  );
}
