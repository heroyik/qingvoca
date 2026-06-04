import type { ChineseVocabEntry } from "../types/chinese-vocab";
import { CHINESE_DATASET_LEVEL } from "../types/chinese-vocab";
import { getBandForStep, getDisplayMeaning, getStepForLesson } from "./vocab";

export type AdminEditableField =
  | "word"
  | "pinyin"
  | "meaning"
  | "translations.ko"
  | "translations.ja"
  | "translations.en"
  | "pos"
  | "lessonId"
  | "step"
  | "level"
  | "example";

export type AdminReadonlyField = "id" | "hsk" | "jlpt" | "reading" | "furigana" | "band" | "opic";

export const ADMIN_EDITABLE_FIELDS: AdminEditableField[] = [
  "word",
  "pinyin",
  "meaning",
  "translations.ko",
  "translations.ja",
  "translations.en",
  "pos",
  "lessonId",
  "step",
  "level",
  "example",
];

export const ADMIN_READONLY_FIELDS: AdminReadonlyField[] = ["id", "hsk", "jlpt", "reading", "furigana", "band", "opic"];

export type AdminEditPatch = {
  id: string;
  word?: string;
  pinyin?: string;
  meaning?: string;
  translations?: {
    ko?: string;
    ja?: string;
    en?: string;
  };
  pos?: string;
  partOfSpeech?: string;
  lessonId?: number;
  step?: number;
  level?: number;
  example?: string[];
};

export function applyAdminEdit(entry: ChineseVocabEntry, patch: AdminEditPatch): ChineseVocabEntry {
  if (entry.id !== patch.id) {
    throw new Error(`Patch id ${patch.id} does not match entry id ${entry.id}.`);
  }

  const lessonId = patch.lessonId ?? entry.lessonId;
  const step = patch.step ?? patch.level ?? getStepForLesson(lessonId);
  const pinyin = patch.pinyin ?? entry.pinyin;
  const translations = {
    ...entry.translations,
    ...patch.translations,
  };
  const updated: ChineseVocabEntry = {
    ...entry,
    word: patch.word ?? entry.word,
    pinyin,
    reading: pinyin,
    furigana: pinyin,
    translations,
    lessonId,
    step,
    level: step,
    pos: patch.pos ?? patch.partOfSpeech ?? entry.pos,
    hsk: CHINESE_DATASET_LEVEL,
    jlpt: CHINESE_DATASET_LEVEL,
    band: getBandForStep(step),
    opic: getBandForStep(step),
    example: patch.example ?? entry.example,
  };

  updated.meaning = patch.meaning ?? getDisplayMeaning(updated, "ko");
  return updated;
}

export function applyAdminEdits(entries: ChineseVocabEntry[], patches: AdminEditPatch[]): ChineseVocabEntry[] {
  const patchById = new Map(patches.map((patch) => [patch.id, patch]));

  return entries.map((entry) => {
    const patch = patchById.get(entry.id);
    return patch ? applyAdminEdit(entry, patch) : entry;
  });
}

export function validateAdminPatch(patch: AdminEditPatch): string[] {
  const errors: string[] = [];

  if (!patch.id) errors.push("Patch id is required.");
  if (patch.lessonId != null && (patch.lessonId < 1 || patch.lessonId > 20)) {
    errors.push("lessonId must be between 1 and 20.");
  }
  if (patch.step != null && (patch.step < 1 || patch.step > 10)) {
    errors.push("step must be between 1 and 10.");
  }
  if (patch.level != null && (patch.level < 1 || patch.level > 10)) {
    errors.push("level must be between 1 and 10.");
  }

  return errors;
}
