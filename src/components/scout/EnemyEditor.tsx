"use client";

import { useState } from "react";
import { ArmySlotEditor } from "./ArmySlotEditor";
import { ARMY_COUNT } from "@/data/enemy-decks";
import type { EnemyDeck, EnemyArmy, EnemyPlayer } from "@/lib/repositories/types";
import type { NewDeckInput, NewPlayerInput } from "@/hooks/useScoutData";

interface EnemyEditorProps {
  name: string; // 자동 입력된 적 이름 (편집 가능)
  initial?: EnemyPlayer | null; // 기존 편집 시
  decks: EnemyDeck[];
  onFindOrCreateDeck: (input: NewDeckInput) => Promise<EnemyDeck | null>;
  onSave: (input: NewPlayerInput, id?: string) => Promise<unknown>;
  onCancel: () => void;
}

function emptyArmy(): EnemyArmy {
  return { deckId: null, troops: [null, null, null], reinforcement: "명함" };
}

// 기존 데이터가 3군이어도 항상 ARMY_COUNT 길이로 맞춘다.
function padArmies(armies?: EnemyArmy[]): EnemyArmy[] {
  return Array.from({ length: ARMY_COUNT }, (_, i) => armies?.[i] ?? emptyArmy());
}

export function EnemyEditor({
  name,
  initial,
  decks,
  onFindOrCreateDeck,
  onSave,
  onCancel,
}: EnemyEditorProps) {
  const [playerName, setPlayerName] = useState(name);
  const [armies, setArmies] = useState<EnemyArmy[]>(padArmies(initial?.armies));
  const [note, setNote] = useState(initial?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function setArmy(i: number, a: EnemyArmy) {
    setArmies((prev) => {
      const next = [...prev];
      next[i] = a;
      return next;
    });
  }

  async function save() {
    if (!playerName.trim()) {
      setMsg("적 이름을 입력해주세요.");
      return;
    }
    setSaving(true);
    setMsg(null);
    const ok = await onSave(
      { name: playerName.trim(), armies, note: note.trim() || undefined },
      initial?.id
    );
    setSaving(false);
    if (!ok) setMsg("저장에 실패했습니다.");
  }

  return (
    <div className="rounded-xl border-2 border-blue-300 dark:border-blue-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-1.5">
          <span>{initial ? "✏️" : "➕"}</span>
          {initial ? "적 정보 수정" : "새 적 추가"}
        </h2>
        <button
          onClick={onCancel}
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          ✕ 닫기
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
          적 이름
        </label>
        <input
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="게임상 이름"
          className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          확인된 부대만 입력하세요. 모르는 군은 &quot;미확인&quot;으로 두면 됩니다.
        </p>
        {Array.from({ length: ARMY_COUNT }, (_, i) => (
          <ArmySlotEditor
            key={i}
            index={i}
            army={armies[i]}
            decks={decks}
            onChange={(a) => setArmy(i, a)}
            onFindOrCreateDeck={onFindOrCreateDeck}
          />
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="메모 (선택)"
        className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {msg && <p className="text-xs text-red-600 dark:text-red-400">{msg}</p>}

      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {saving ? "저장 중..." : initial ? "수정 저장" : "적 저장"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm bg-zinc-200 dark:bg-zinc-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
