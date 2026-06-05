"use client";

import { useEffect, useMemo, useState } from "react";
import { PenSquare, RotateCcw, Save, Search } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import type { ChineseVocabEntry, SupportedLocale } from "@/types/chinese-vocab";
import { DEFAULT_LOCALE } from "@/types/chinese-vocab";
import { normalizeVocabWordKey } from "@/utils/vocab";
import { t, tpl } from "@/utils/ui";

type EditDraft = {
  word: string;
  pinyin: string;
  meaning: string;
  translationKo: string;
  translationJa: string;
  translationEn: string;
  pos: string;
  lessonId: string;
  exampleText: string;
};

function createDraft(entry: ChineseVocabEntry): EditDraft {
  return {
    word: entry.word,
    pinyin: entry.pinyin,
    meaning: entry.meaning,
    translationKo: entry.translations.ko ?? "",
    translationJa: entry.translations.ja ?? "",
    translationEn: entry.translations.en ?? "",
    pos: entry.pos,
    lessonId: String(entry.lessonId),
    exampleText: (entry.example ?? []).join("\n"),
  };
}

function parseExamples(value: string) {
  return Array.from(
    new Set(
      value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function matchesSearch(entry: ChineseVocabEntry, value: string) {
  if (!value) return true;
  return [
    entry.id,
    entry.word,
    entry.pinyin,
    entry.meaning,
    entry.translations.ko,
    entry.translations.ja,
    entry.translations.en,
    entry.pos,
    `lesson ${entry.lessonId}`,
    `step ${entry.step}`,
  ].some((item) => item?.toLowerCase().includes(value));
}

interface AdminEditTabProps {
  locale?: SupportedLocale;
}

export default function AdminEditTab({ locale = DEFAULT_LOCALE }: AdminEditTabProps) {
  const { clearVocabOverride, deleteWordsGlobally, globalDeletedWordKeys, saveVocabOverride, vocabEntries } =
    useGamification();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const searchValue = search.trim().toLowerCase();
  const deletedSet = useMemo(() => new Set(globalDeletedWordKeys), [globalDeletedWordKeys]);
  const visibleEntries = useMemo(
    () => vocabEntries.filter((entry) => !deletedSet.has(normalizeVocabWordKey(entry.word)) && matchesSearch(entry, searchValue)),
    [deletedSet, searchValue, vocabEntries],
  );
  const editingEntry = useMemo(
    () => visibleEntries.find((entry) => entry.id === editingId) ?? visibleEntries[0] ?? null,
    [editingId, visibleEntries],
  );

  useEffect(() => {
    if (!editingEntry || editingEntry.id === editingId) return undefined;
    const timer = setTimeout(() => setEditingId(editingEntry.id), 0);
    return () => clearTimeout(timer);
  }, [editingEntry, editingId]);

  useEffect(() => {
    const timer = setTimeout(() => setDraft(editingEntry ? createDraft(editingEntry) : null), 0);
    return () => clearTimeout(timer);
  }, [editingEntry]);

  const toggleSelected = (entryId: string) => {
    setSelectedIds((current) =>
      current.includes(entryId) ? current.filter((id) => id !== entryId) : [...current, entryId],
    );
  };

  const handleSave = async () => {
    if (!editingEntry || !draft || isSaving) return;
    setIsSaving(true);
    setStatus(null);

    try {
      await saveVocabOverride(editingEntry.id, {
        word: draft.word,
        pinyin: draft.pinyin,
        meaning: draft.meaning,
        translations: {
          ko: draft.translationKo,
          ja: draft.translationJa,
          en: draft.translationEn,
        },
        pos: draft.pos,
        lessonId: Number.parseInt(draft.lessonId, 10) || editingEntry.lessonId,
        example: parseExamples(draft.exampleText),
      });
      setStatus(t("adminSaveSuccess", locale));
    } catch (error) {
      console.error("[AdminEditTab] save failed", error);
      setStatus(t("adminSaveError", locale));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!editingEntry || isSaving) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await clearVocabOverride(editingEntry.id);
      setStatus(t("adminResetSuccess", locale));
    } catch (error) {
      console.error("[AdminEditTab] reset failed", error);
      setStatus(t("adminResetError", locale));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0 || isSaving) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await deleteWordsGlobally(selectedIds);
      setStatus(tpl(t("adminDeleteSuccess", locale), { count: selectedIds.length }));
      setSelectedIds([]);
    } catch (error) {
      console.error("[AdminEditTab] delete failed", error);
      setStatus(t("adminDeleteError", locale));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="admin-edit-tab">
      <div className="review-header">
        <div className="review-header-icon">
          <PenSquare size={26} />
        </div>
        <div>
          <h2 className="text-title m-0">{t("adminEdit", locale)}</h2>
          <p className="text-small mt-4">{tpl(t("adminEditSubtitle", locale), { count: vocabEntries.length.toLocaleString() })}</p>
        </div>
      </div>

      <label className="admin-delete-search mt-16">
        <Search size={16} />
        <input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder={t("adminSearchPlaceholder", locale)} />
      </label>

      <div className="admin-edit-grid mt-16">
        <div className="admin-word-list">
          {visibleEntries.slice(0, 80).map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`admin-word-row ${editingEntry?.id === entry.id ? "active" : ""}`}
              onClick={() => setEditingId(entry.id)}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(entry.id)}
                onChange={() => toggleSelected(entry.id)}
                onClick={(event) => event.stopPropagation()}
              />
              <span className="font-900">{entry.word}</span>
              <span>{entry.pinyin}</span>
              <span>{t("lesson", locale)} {entry.lessonId}</span>
            </button>
          ))}
        </div>

        {draft && editingEntry && (
          <div className="admin-edit-panel">
            <div className="grid-2 gap-10">
              <label>
                {t("word", locale)}
                <input value={draft.word} onChange={(event) => setDraft({ ...draft, word: event.currentTarget.value })} />
              </label>
              <label>
                {t("pinyin", locale)}
                <input value={draft.pinyin} onChange={(event) => setDraft({ ...draft, pinyin: event.currentTarget.value })} />
              </label>
              <label>
                {t("adminFieldMainMeaning", locale)}
                <input value={draft.meaning} onChange={(event) => setDraft({ ...draft, meaning: event.currentTarget.value })} />
              </label>
              <label>
                {t("partOfSpeech", locale)}
                <input value={draft.pos} onChange={(event) => setDraft({ ...draft, pos: event.currentTarget.value })} />
              </label>
              <label>
                {t("lesson", locale)}
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={draft.lessonId}
                  onChange={(event) => setDraft({ ...draft, lessonId: event.currentTarget.value })}
                />
              </label>
              <label>
                한국어
                <input
                  value={draft.translationKo}
                  onChange={(event) => setDraft({ ...draft, translationKo: event.currentTarget.value })}
                />
              </label>
              <label>
                日本語
                <input
                  value={draft.translationJa}
                  onChange={(event) => setDraft({ ...draft, translationJa: event.currentTarget.value })}
                />
              </label>
              <label>
                English
                <input
                  value={draft.translationEn}
                  onChange={(event) => setDraft({ ...draft, translationEn: event.currentTarget.value })}
                />
              </label>
            </div>

            <label className="mt-12 block">
              {t("adminFieldExample", locale)}
              <textarea
                value={draft.exampleText}
                onChange={(event) => setDraft({ ...draft, exampleText: event.currentTarget.value })}
                rows={4}
              />
            </label>

            <div className="flex gap-10 mt-16 flex-wrap">
              <button className="duo-button duo-button-primary w-auto px-24" type="button" onClick={handleSave} disabled={isSaving}>
                <Save size={16} /> {t("adminSave", locale)}
              </button>
              <button className="duo-button duo-button-secondary w-auto px-24" type="button" onClick={handleReset} disabled={isSaving}>
                <RotateCcw size={16} /> {t("adminReset", locale)}
              </button>
              <button className="duo-button duo-button-outline w-auto px-24" type="button" onClick={handleDelete} disabled={isSaving}>
                {t("adminDeleteSelected", locale)} {selectedIds.length}
              </button>
            </div>
            {status && <p className="text-subtitle mt-12">{status}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
