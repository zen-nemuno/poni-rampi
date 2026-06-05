import type { Pokemon, PokemonRole } from "@/types/pokemon";
import { roleLabels } from "@/types/pokemon";

export type PokemonTagGroup = {
  id: string;
  label: string;
  description: string;
  match: (pokemon: Pokemon) => boolean;
};

const roleOrder: PokemonRole[] = [
  "attacker",
  "allRounder",
  "defender",
  "supporter",
  "speedster"
];

const namedTagGroups: PokemonTagGroup[] = [
  {
    id: "legendary-birds",
    label: "三鳥",
    description: "サンダー / ファイヤー / フリーザー",
    match: matchByNames(["サンダー", "ファイヤー", "フリーザー"])
  },
  {
    id: "johto-starters",
    label: "ジョウト御三家",
    description: "メガニウム / オーダイル / バクフーン",
    match: matchByNames(["メガニウム", "オーダイル", "バクフーン"])
  },
  {
    id: "hoenn-starters",
    label: "ホウエン御三家",
    description: "バシャーモ（実装分）",
    match: matchByNames(["バシャーモ"])
  },
  {
    id: "kalos-starters",
    label: "カロス御三家",
    description: "ゲッコウガ / マフォクシー（実装分）",
    match: matchByNames(["ゲッコウガ", "マフォクシー"])
  },
  {
    id: "galar-starters",
    label: "ガラル御三家",
    description: "エースバーン / インテレオン（実装分）",
    match: matchByNames(["エースバーン", "インテレオン"])
  },
  {
    id: "paldea-starters",
    label: "パルデア御三家",
    description: "マスカーニャ（実装分）",
    match: matchByNames(["マスカーニャ"])
  },
  {
    id: "kanto-starters",
    label: "カントー御三家",
    description: "フシギバナ / リザードン / カメックス",
    match: matchByNames(["フシギバナ", "リザードン", "カメックス"])
  },
  {
    id: "eeveelutions",
    label: "ブイズ",
    description: "シャワーズ / エーフィ / ブラッキーなど",
    match: matchByNames([
      "シャワーズ",
      "エーフィ",
      "ブラッキー",
      "リーフィア",
      "グレイシア",
      "ニンフィア"
    ])
  },
  {
    id: "legendary-mythical",
    label: "伝説・幻",
    description: "ミュウ / ザシアン / ミライドンなど",
    match: matchByNames([
      "ゼラオラ",
      "フーパ",
      "ミュウ",
      "ウーラオス",
      "ザシアン",
      "ミュウツーX",
      "ミュウツーY",
      "ミライドン",
      "ホウオウ",
      "ダークライ",
      "スイクン",
      "ラティオス",
      "ラティアス",
      "サンダー",
      "ファイヤー",
      "フリーザー"
    ])
  },
  {
    id: "mega",
    label: "メガ進化",
    description: "メガルカリオ / メガリザードンなど",
    match: (pokemon) => pokemon.nameJa.startsWith("メガ")
  },
  {
    id: "mewtwo",
    label: "ミュウツー系",
    description: "ミュウツーX / ミュウツーY",
    match: matchByNames(["ミュウツーX", "ミュウツーY"])
  },
  {
    id: "regional-forms",
    label: "リージョン",
    description: "アローラ / ガラルのすがた",
    match: (pokemon) =>
      pokemon.nameJa.startsWith("アローラ") ||
      pokemon.nameJa.startsWith("ガラル")
  },
  {
    id: "advanced",
    label: "上級者向け",
    description: "操作難度が高めのポケモン",
    match: (pokemon) => pokemon.difficulty === "advanced"
  },
  {
    id: "newer",
    label: "最近の実装",
    description: "2025年以降に実装されたポケモン",
    match: (pokemon) => Boolean(pokemon.releaseDate && pokemon.releaseDate >= "2025-01-01")
  }
];

export const pokemonTagGroups: PokemonTagGroup[] = [
  ...roleOrder.map((role) => ({
    id: `role-${role}`,
    label: roleLabels[role],
    description: `${roleLabels[role]}をまとめて対象切替`,
    match: (pokemon: Pokemon) => pokemon.role === role
  })),
  ...namedTagGroups
];

function matchByNames(names: string[]) {
  const nameSet = new Set(names);

  return (pokemon: Pokemon) => nameSet.has(pokemon.nameJa);
}
