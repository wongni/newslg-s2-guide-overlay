#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
자원 투자 분석 계산기 (연구 vs 병영 업그레이드)

파라미터만 바꾸면 아래 비교가 자동 재계산된다:
  1) 단위/실효 기여 (공격 %, 방어 받는피해 %, 생존 eHP %)
  2) 병영 예산과 '동일 예산'으로 연구를 살 때의 누적 효과 비교

모델 요약 (kb/자원투자분석.md 와 동일):
  - 1부대 = 무장 3명, 딜은 딜러 1명에 집중 → 공격 버프 실효 범위 ×1
  - 통솔/방어는 전 부대(모든 무장)에 적용 → 방어 실효 범위 ×(부대 수)
  - 받는 피해 감소는 additive 로 누적 (게임 로그로 확인)
  - eHP(유효 체력) = 1/(1-받는피해감소) - 1
  - 병력 상한 증가는 병력을 항상 상한까지 채운다는 가정하에 그대로 eHP로 실현
"""

import csv
import sys

# Windows 콘솔에서 한글 출력이 깨지지 않도록 UTF-8 로 강제
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# ======================= 입력 파라미터 =======================
BASE = 360                 # 데미지 공식 기본수치

# 공격(내 딜러가 적을 때릴 때)
DEALER_MURYEOK   = 400     # 딜러 무력
ENEMY_TONGSOL    = 200     # 적 통솔 (내 공격 시 차감)

# 방어(적이 내 무장을 때릴 때)
ENEMY_MURYEOK    = 400     # 적 무력
MY_TONGSOL       = 200     # 내 통솔 (내가 맞을 때 차감)

# 부대 구성
TROOPS_PER_UNIT   = 8700   # 부대당 병력 (레벨 46 기준)
GENERALS_PER_UNIT = 3      # 부대당 무장 수
MY_UNITS          = 3      # 아군 부대 수 (방어 실효 범위 배수)
ALL_SPEARS        = True   # 3부대 모두 창병인가 (신의 창 방어 적용 여부)

# 연구 (레벨당 효과)
STAT_PER_LEVEL       = 2       # 무용/통솔: 레벨당 능력치 +2
SPEAR_PCT_PER_LEVEL  = 0.005   # 신의 창: 레벨당 주는/받는 피해 +0.5%
STAT_CUR_LEVEL       = 3       # 무용/통솔 현재 레벨
SPEAR_CUR_LEVEL      = 1       # 신의 창 현재 레벨
MAX_LEVEL            = 10      # 연구 최대 레벨

# 연구 비용 곡선 (총 자원, 만 단위)
FIRST_UPGRADE_COST = 12    # 현재 레벨 -> 다음 레벨 비용
COST_STEP          = 6     # 한 레벨 오를 때마다 증가 (+2만 x 3자원)

# 병영 업그레이드
BARRACKS_COST              = 187.2   # 만
BARRACKS_TROOP_PER_GENERAL = 300     # 병력 상한 증가 / 무장
BARRACKS_OFFENSE_PCT       = 0.015   # 딜러 공격 기여 (병력 계수 +1.5%)
# ============================================================


def off_base_term():
    return BASE + DEALER_MURYEOK - ENEMY_TONGSOL


def inc_base_term():
    return BASE + ENEMY_MURYEOK - MY_TONGSOL


def ehp_from_reduction(r):
    """받는 피해 감소율 r(0~1) -> 유효 HP 증가율."""
    if r >= 1:
        return float("inf")
    return 1.0 / (1.0 - r) - 1.0


# ---------- 레벨당(단위) 마진 효과 ----------
def per_level_effects():
    ob = off_base_term()
    ib = inc_base_term()

    muyong_off = STAT_PER_LEVEL / ob                     # 딜러 공격 (×1)
    tongsol_def_per_general = STAT_PER_LEVEL / ib         # 무장 1명 받는피해 감소
    tongsol_def_weighted = tongsol_def_per_general * MY_UNITS  # 전부대 실효

    spear_off = SPEAR_PCT_PER_LEVEL                       # 딜러 공격 (×1)
    spear_def_weighted = (SPEAR_PCT_PER_LEVEL * MY_UNITS) if ALL_SPEARS else 0.0

    return {
        "무용(무력)":  {"off": muyong_off,        "def": 0.0},
        "통솔":        {"off": 0.0,               "def": tongsol_def_weighted},
        "신의 창":     {"off": spear_off,         "def": spear_def_weighted},
    }


# ---------- 연구 비용 곡선 ----------
def upgrade_costs(cur_level):
    """현재 레벨에서 max까지 각 업그레이드 비용 리스트."""
    costs = []
    n = MAX_LEVEL - cur_level
    for k in range(n):
        costs.append(FIRST_UPGRADE_COST + COST_STEP * k)
    return costs


def levels_within_budget(cur_level, budget):
    """예산 안에서 살 수 있는 레벨 수, 지출, 비용 내역."""
    costs = upgrade_costs(cur_level)
    spent, bought = 0.0, 0
    used = []
    for c in costs:
        if spent + c <= budget + 1e-9:
            spent += c
            bought += 1
            used.append(c)
        else:
            break
    return bought, spent, used


# ---------- 출력 ----------
def fmt_pct(x):
    return f"{x*100:+.2f}%"


def print_inputs():
    print("=" * 60)
    print("입력 파라미터")
    print("-" * 60)
    print(f"공격 기본항 (360+무력-적통솔) = {off_base_term()}")
    print(f"피격 기본항 (360+적무력-내통솔) = {inc_base_term()}")
    print(f"부대당 병력 {TROOPS_PER_UNIT}, 무장/부대 {GENERALS_PER_UNIT}, 아군 부대 {MY_UNITS}")
    print(f"창병 전체 여부: {ALL_SPEARS}")
    print(f"연구 현재레벨  무용/통솔={STAT_CUR_LEVEL}, 신의창={SPEAR_CUR_LEVEL}, 최대={MAX_LEVEL}")
    print(f"연구 비용곡선  첫 {FIRST_UPGRADE_COST}만, 레벨당 +{COST_STEP}만")
    print(f"병영 비용 {BARRACKS_COST}만, 병력상한 +{BARRACKS_TROOP_PER_GENERAL}/무장")
    print()


def print_per_level():
    eff = per_level_effects()
    print("=" * 60)
    print("1) 연구 1레벨당 실효 기여")
    print("-" * 60)
    print(f"{'항목':<12}{'공격(딜러)':>14}{'받는피해 감소':>16}{'생존 eHP':>12}")
    for name, e in eff.items():
        ehp = ehp_from_reduction(e["def"])
        print(f"{name:<12}{fmt_pct(e['off']):>14}{fmt_pct(-e['def']):>16}{fmt_pct(ehp):>12}")
    print()


def barracks_survival_ehp():
    added = BARRACKS_TROOP_PER_GENERAL * GENERALS_PER_UNIT
    return added / TROOPS_PER_UNIT


def print_budget_comparison():
    budget = BARRACKS_COST
    eff = per_level_effects()

    print("=" * 60)
    print(f"2) 동일 예산 비교 (예산 = 병영 비용 {budget}만)")
    print("-" * 60)

    rows = []

    # 병영 (1회)
    rows.append({
        "옵션": "병영 22 (1단계)",
        "레벨/단계": "1",
        "지출(만)": f"{budget:.1f}",
        "공격(딜러)": fmt_pct(BARRACKS_OFFENSE_PCT),
        "생존 eHP": fmt_pct(barracks_survival_ehp()),
        "비고": "병종 무관",
    })

    # 연구들
    research = [
        ("통솔 연구", STAT_CUR_LEVEL, eff["통솔"], "병종 무관"),
        ("무용(무력)", STAT_CUR_LEVEL, eff["무용(무력)"], "딜러 공격만"),
        ("신의 창", SPEAR_CUR_LEVEL, eff["신의 창"], "창병 한정" if ALL_SPEARS else "창병 아님→방어0"),
    ]
    for name, cur, e, note in research:
        lv, spent, used = levels_within_budget(cur, budget)
        off_total = e["off"] * lv
        red_total = e["def"] * lv           # 받는피해 감소 누적 (additive)
        ehp_total = ehp_from_reduction(red_total)
        rows.append({
            "옵션": name,
            "레벨/단계": f"{cur}->{cur+lv} ({lv}단계)",
            "지출(만)": f"{spent:.1f}",
            "공격(딜러)": fmt_pct(off_total),
            "생존 eHP": fmt_pct(ehp_total),
            "비고": note,
        })

    headers = ["옵션", "레벨/단계", "지출(만)", "공격(딜러)", "생존 eHP", "비고"]
    widths = {h: max(len(h), *(len(str(r[h])) for r in rows)) + 2 for h in headers}
    line = "".join(h.ljust(widths[h]) for h in headers)
    print(line)
    for r in rows:
        print("".join(str(r[h]).ljust(widths[h]) for h in headers))
    print()
    return rows


def export_csv(rows, path="tools/resource_comparison.csv"):
    headers = ["옵션", "레벨/단계", "지출(만)", "공격(딜러)", "생존 eHP", "비고"]
    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        w.writerows(rows)
    print(f"CSV 저장: {path}")


def main():
    print_inputs()
    print_per_level()
    rows = print_budget_comparison()
    if "--csv" in sys.argv:
        export_csv(rows)


if __name__ == "__main__":
    main()
