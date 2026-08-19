import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getAuthUser } from "@/lib/auth";
import { userRepository } from "@/lib/repositories";

// Bundled defaults (baked at build time)
import defaultSteps from "@/data/guide-steps.json";
import defaultTierValues from "@/data/tier-values.json";
import defaultCommonValues from "@/data/common-values.json";
import defaultGlossary from "@/data/glossary.json";

// Runtime data directory (persists across restarts)
const DATA_DIR = path.join(process.cwd(), "data");
const GUIDE_FILE = path.join(DATA_DIR, "guide-steps.json");
const TIER_VALUES_FILE = path.join(DATA_DIR, "tier-values.json");
const COMMON_VALUES_FILE = path.join(DATA_DIR, "common-values.json");
const GLOSSARY_FILE = path.join(DATA_DIR, "glossary.json");

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
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

    await ensureDataDir();

    // Write guide steps
    await writeFile(GUIDE_FILE, JSON.stringify(steps, null, 2), "utf-8");

    // Write tier values if provided
    if (tierValues && typeof tierValues === "object") {
      await writeFile(TIER_VALUES_FILE, JSON.stringify(tierValues, null, 2), "utf-8");
    }

    // Write common values if provided
    if (commonValues && typeof commonValues === "object") {
      await writeFile(COMMON_VALUES_FILE, JSON.stringify(commonValues, null, 2), "utf-8");
    }

    // Write glossary if provided
    if (glossary && typeof glossary === "object") {
      await writeFile(GLOSSARY_FILE, JSON.stringify(glossary, null, 2), "utf-8");
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

export async function GET() {
  try {
    // Public read — no auth required
    const steps = await loadJson(GUIDE_FILE, defaultSteps);
    const tierValues = await loadJson(TIER_VALUES_FILE, defaultTierValues);
    const commonValues = await loadJson(COMMON_VALUES_FILE, defaultCommonValues);
    const glossary = await loadJson(GLOSSARY_FILE, defaultGlossary);

    return NextResponse.json({ steps, tierValues, commonValues, glossary });
  } catch (error) {
    console.error("Admin guide read error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
