"use client";

import { useEffect, useState } from "react";
import { ScoutGate } from "@/components/scout/ScoutGate";
import { MyDeckSettingsPanel } from "@/components/scout/MyDeckSettingsPanel";
import { ScoutSearch } from "@/components/scout/ScoutSearch";
import { EnemyEditor } from "@/components/scout/EnemyEditor";
import { EnemyList } from "@/components/scout/EnemyList";
import { useMyDeck } from "@/hooks/useMyDeck";
import { useAuth } from "@/hooks/useAuth";
import { useScoutData, type NewPlayerInput } from "@/hooks/useScoutData";
import type { EnemyPlayer } from "@/lib/repositories/types";

type EditorState =
  | { mode: "closed" }
  | { mode: "new"; name: string }
  | { mode: "edit"; player: EnemyPlayer };

export default function ScoutPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const { user } = useAuth();
  const { settings, hydrated, setArmy } = useMyDeck(user?.id ?? null);
  const scout = useScoutData(authorized === true);
  const [editor, setEditor] = useState<EditorState>({ mode: "closed" });
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/scout/gate")
      .then((r) => r.json())
      .then((j) => active && setAuthorized(Boolean(j.authorized)))
      .catch(() => active && setAuthorized(false));
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(input: NewPlayerInput, id?: string) {
    let ok: unknown;
    if (id) {
      ok = await scout.updatePlayer(id, input);
    } else {
      ok = await scout.createPlayer(input);
    }
    if (ok) setEditor({ mode: "closed" });
    return ok;
  }

  if (authorized === null) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-sm text-zinc-400">
        불러오는 중...
      </div>
    );
  }

  if (!authorized) {
    return <ScoutGate onSuccess={() => setAuthorized(true)} />;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-4 text-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">🕵️ 적 정찰</h1>
        {scout.loading && <span className="text-xs text-zinc-400">동기화 중...</span>}
      </div>

      {hydrated && (
        <MyDeckSettingsPanel
          settings={settings}
          onSetArmy={setArmy}
          loggedIn={Boolean(user)}
        />
      )}

      {/* 최상단: 적 검색 → 기존 적은 아래 목록 필터, 새 이름은 추가 */}
      <ScoutSearch
        players={scout.data.players}
        onSelectExisting={(p) => setSearchQuery(p.name)}
        onAddNew={(name) => setEditor({ mode: "new", name })}
        onQueryChange={setSearchQuery}
      />

      {/* 편집기 (검색으로 열림) */}
      {editor.mode !== "closed" && (
        <EnemyEditor
          name={editor.mode === "new" ? editor.name : editor.player.name}
          initial={editor.mode === "edit" ? editor.player : null}
          decks={scout.data.decks}
          onFindOrCreateDeck={scout.findOrCreateDeck}
          onSave={handleSave}
          onCancel={() => setEditor({ mode: "closed" })}
        />
      )}

      {scout.error && (
        <p className="text-xs text-red-600 dark:text-red-400">{scout.error}</p>
      )}

      <EnemyList
        players={scout.data.players}
        decks={scout.data.decks}
        myDecks={settings.decks}
        filter={searchQuery}
        onEdit={(p) => setEditor({ mode: "edit", player: p })}
        onDeletePlayer={scout.deletePlayer}
      />

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        판정: 내 부대(공격) vs 적 덱(방어). 카운터=유리, 비등=호각, 미러=동일,
        회피=불리. 병종/강화 단계는 표시·추측용이며 덱 상성 판정에는 반영되지
        않습니다. 병종 순환상성: 방패▶궁▶창▶기▶방패.
      </p>
    </main>
  );
}
