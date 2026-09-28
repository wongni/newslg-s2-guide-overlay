"use client";

import { useEffect, useRef, useState } from "react";
import { ScoutGate } from "@/components/scout/ScoutGate";
import { MyDeckSettingsPanel } from "@/components/scout/MyDeckSettingsPanel";
import { ScoutSearch } from "@/components/scout/ScoutSearch";
import { GeneralFilter } from "@/components/scout/GeneralFilter";
import { ThreatRanking } from "@/components/scout/ThreatRanking";
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
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generalFilter, setGeneralFilter] = useState<Set<string>>(new Set());

  // 편집기가 열리면 화면 안으로 스크롤한다.
  // (목록이 길면 편집기가 상단에 열려 화면 밖에 있어 "아무 일도 안 일어난 것"처럼 보이는 문제 방지)
  useEffect(() => {
    if (editor.mode !== "closed") {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editor]);

  function toggleGeneral(g: string) {
    setGeneralFilter((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }

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
    <main className="max-w-6xl mx-auto px-4 py-6 text-zinc-900 dark:text-zinc-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">🕵️ 적 정찰</h1>
        {scout.loading && <span className="text-xs text-zinc-400">동기화 중...</span>}
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6 lg:items-start">
        {/* 메인 컬럼 */}
        <div className="space-y-4">
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

          {/* 장수 필터: 선택한 장수가 덱에 포함된 적만 표시 */}
          <GeneralFilter
            selected={generalFilter}
            onToggle={toggleGeneral}
            onClear={() => setGeneralFilter(new Set())}
          />

          {/* 요주의 랭킹 (모바일 전용: 필터 아래). 데스크톱은 우측 사이드바에 표시. */}
          <div className="lg:hidden">
            <ThreatRanking
              players={scout.data.players}
              onSelect={(name) => setSearchQuery(name)}
            />
          </div>

          {/* 편집기 (검색으로 열림) */}
          {editor.mode !== "closed" && (
            <div ref={editorRef} className="scroll-mt-20">
              <EnemyEditor
                name={editor.mode === "new" ? editor.name : editor.player.name}
                initial={editor.mode === "edit" ? editor.player : null}
                decks={scout.data.decks}
                onFindOrCreateDeck={scout.findOrCreateDeck}
                onSave={handleSave}
                onCancel={() => setEditor({ mode: "closed" })}
              />
            </div>
          )}

          {scout.error && (
            <p className="text-xs text-red-600 dark:text-red-400">{scout.error}</p>
          )}

          <EnemyList
            players={scout.data.players}
            decks={scout.data.decks}
            myDecks={settings.decks}
            filter={searchQuery}
            generalFilter={generalFilter}
            onEdit={(p) => setEditor({ mode: "edit", player: p })}
            onDeletePlayer={scout.deletePlayer}
          />

          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            판정: 내 부대(공격) vs 적 덱(방어). 카운터=유리, 비등=호각, 미러=동일,
            회피=불리. 병종/강화 단계는 표시·추측용이며 덱 상성 판정에는 반영되지
            않습니다. 병종 순환상성: 방패▶궁▶창▶기▶방패.
          </p>
        </div>

        {/* 우측 사이드바 (데스크톱 전용): 요주의 랭킹 — 스크롤 시 상단 고정 */}
        <aside className="hidden lg:block lg:sticky lg:top-20">
          <ThreatRanking
            players={scout.data.players}
            onSelect={(name) => setSearchQuery(name)}
          />
        </aside>
      </div>
    </main>
  );
}
