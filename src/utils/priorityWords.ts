import type { ChineseVocabEntry } from "../types/chinese-vocab";

export type PriorityReason = "unknown-pos" | "advanced-step" | "long-pinyin" | "chengyu";

export type PriorityWord = {
  entry: ChineseVocabEntry;
  reasons: PriorityReason[];
  score: number;
};

export function getPriorityWords(entries: ChineseVocabEntry[], limit = 20): PriorityWord[] {
  return entries
    .map((entry) => {
      const reasons: PriorityReason[] = [];

      if (entry.pos === "unknown") reasons.push("unknown-pos");
      if (entry.step >= 8) reasons.push("advanced-step");
      if (entry.pinyin.split(/\s+/).length >= 4) reasons.push("long-pinyin");
      if (entry.word.length === 4) reasons.push("chengyu");

      return {
        entry,
        reasons,
        score: reasons.length,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      const scoreDelta = b.score - a.score;
      if (scoreDelta !== 0) return scoreDelta;
      return a.entry.id.localeCompare(b.entry.id);
    })
    .slice(0, limit);
}
