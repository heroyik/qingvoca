"use client";

import { useEffect, useMemo, useState } from "react";
import { PenSquare, RotateCcw, Save, Search } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import type { ChineseVocabEntry } from "@/types/chinese-vocab";
import { normalizeVocabWordKey } from "@/utils/vocab";

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

export default function AdminEditTab() {
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
      setStatus("수정 내용을 저장했습니다.");
    } catch (error) {
      console.error("[AdminEditTab] save failed", error);
      setStatus("저장 중 오류가 발생했습니다.");
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
      setStatus("선택 단어의 override를 초기화했습니다.");
    } catch (error) {
      console.error("[AdminEditTab] reset failed", error);
      setStatus("초기화 중 오류가 발생했습니다.");
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
      setStatus(`${selectedIds.length}개 단어를 전역 삭제 목록에 추가했습니다.`);
      setSelectedIds([]);
    } catch (error) {
      console.error("[AdminEditTab] delete failed", error);
      setStatus("삭제 반영 중 오류가 발생했습니다.");
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
          <h2 className="text-title m-0">관리자 편집</h2>
          <p className="text-small mt-4">중국어 HSK4 단어 {vocabEntries.length.toLocaleString()}개를 검색하고 수정합니다.</p>
        </div>
      </div>

      <label className="admin-delete-search mt-16">
        <Search size={16} />
        <input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="단어, 병음, 뜻 검색" />
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
              <span>Lesson {entry.lessonId}</span>
            </button>
          ))}
        </div>

        {draft && editingEntry && (
          <div className="admin-edit-panel">
            <div className="grid-2 gap-10">
              <label>
                중국어
                <input value={draft.word} onChange={(event) => setDraft({ ...draft, word: event.currentTarget.value })} />
              </label>
              <label>
                병음
                <input value={draft.pinyin} onChange={(event) => setDraft({ ...draft, pinyin: event.currentTarget.value })} />
              </label>
              <label>
                대표 뜻
                <input value={draft.meaning} onChange={(event) => setDraft({ ...draft, meaning: event.currentTarget.value })} />
              </label>
              <label>
                품사
                <input value={draft.pos} onChange={(event) => setDraft({ ...draft, pos: event.currentTarget.value })} />
              </label>
              <label>
                Lesson
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
              예문
              <textarea
                value={draft.exampleText}
                onChange={(event) => setDraft({ ...draft, exampleText: event.currentTarget.value })}
                rows={4}
              />
            </label>

            <div className="flex gap-10 mt-16 flex-wrap">
              <button className="duo-button duo-button-primary w-auto px-24" type="button" onClick={handleSave} disabled={isSaving}>
                <Save size={16} /> 저장
              </button>
              <button className="duo-button duo-button-secondary w-auto px-24" type="button" onClick={handleReset} disabled={isSaving}>
                <RotateCcw size={16} /> 초기화
              </button>
              <button className="duo-button duo-button-outline w-auto px-24" type="button" onClick={handleDelete} disabled={isSaving}>
                선택 삭제 {selectedIds.length}
              </button>
            </div>
            {status && <p className="text-subtitle mt-12">{status}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
