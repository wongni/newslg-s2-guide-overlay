import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getAuthUser } from "@/lib/auth";
import { userRepository } from "@/lib/repositories";

// Bundled defaults (baked at build time), per season
import s2Steps from "@/data/s2/guide-steps.json";
import s2TierValues from "@/data/s2/tier-values.json";
import s2CommonValues from "@/data/s2/common-values.json";
import s2Glossary from "@/data/s2/glossary.json";
import s3Steps from "@/data/s3/guide-steps.json";
import s3TierValues from "@/data/s3/tier-values.json";
import s3CommonValues from "@/data/s3/common-values.json";
import s3Glossary from "@/data/s3/glossary.json";
import { DEFAULT_SEASON, type SeasonId } from "@/data/season";

// 시즌별 번들 기본값
const BUNDLED = {
  s2: {
    steps: s2Steps,
    tierValues: s2TierValues,
    commonValues: s2CommonValues,
    glossary: s2Glossary,
  },
  s3: {
    steps: s3Steps,
    tierValues: s3TierValues,
    commonValues: s3CommonValues,
    glossary: s3Glossary,
  },
} as const;

function resolveSeason(req: NextRequest): SeasonId {
  const s = req.nextUrl.searchParams.get("season");
  return s === "s2" || s === "s3" ? s : DEFAULT_SEASON;
}

// Runtime data directory (persists across restarts), per season
const DATA_ROOT = path.join(process.cwd(), "data");

function seasonFiles(season: SeasonId) {
  const dir = path.join(DATA_ROOT, season);
  return {
    dir,
    GUIDE_FILE: path.join(dir, "guide-steps.json"),
    TIER_VALUES_FILE: path.join(dir, "tier-values.json"),
    COMMON_VALUES_FILE: path.join(dir, "common-values.json"),
    GLOSSARY_FILE: path.join(dir, "glossary.json"),
  };
}

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function loadJson(filePath: string, fallback: unknown): Promise<unknown> {
  try {
    if (existsSync(filePath)) {
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content);
    }
  } catch {
    // fall through to default
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate: must be admin
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const user = await userRepository.findById(authUser.userId);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { steps, tierValues, commonValues, glossary } = body;

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: "유효하지 않은 가이드 데이터입니다" },
        { status: 400 }
      );
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step.phase || !step.title || !Array.isArray(step.tasks)) {
        return NextResponse.json(
          { error: `스텝 ${i + 1}: phase, title, tasks는 필수입니다` },
          { status: 400 }
        );
      }
    }

    const season = resolveSeason(request);
    const files = seasonFiles(season);
    await ensureDir(files.dir);

    // Write guide steps
    await writeFile(files.GUIDE_FILE, JSON.stringify(steps, null, 2), "utf-8");

    // Write tier values if provided
    if (tierValues && typeof tierValues === "object") {
      await writeFile(files.TIER_VALUES_FILE, JSON.stringify(tierValues, null, 2), "utf-8");
    }

    // Write common values if provided
    if (commonValues && typeof commonValues === "object") {
      await writeFile(files.COMMON_VALUES_FILE, JSON.stringify(commonValues, null, 2), "utf-8");
    }

    // Write glossary if provided
    if (glossary && typeof glossary === "object") {
      await writeFile(files.GLOSSARY_FILE, JSON.stringify(glossary, null, 2), "utf-8");
    }

    return NextResponse.json({
      success: true,
      message: "가이드가 저장되었습니다",
    });
  } catch (error) {
    console.error("Admin guide save error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Public read — no auth required
    const season = resolveSeason(request);
    const files = seasonFiles(season);
    const bundled = BUNDLED[season];

    const steps = await loadJson(files.GUIDE_FILE, bundled.steps);
    const tierValues = await loadJson(files.TIER_VALUES_FILE, bundled.tierValues);
    const commonValues = await loadJson(files.COMMON_VALUES_FILE, bundled.commonValues);
    const glossary = await loadJson(files.GLOSSARY_FILE, bundled.glossary);

    return NextResponse.json({ steps, tierValues, commonValues, glossary });
  } catch (error) {
    console.error("Admin guide read error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
