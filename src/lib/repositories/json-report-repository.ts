import { readJsonFile, writeJsonFile, getDataFilePath } from './json-store';
import type { Report, ReportRepository } from './types';

const REPORTS_FILE = getDataFilePath('reports.json');

export class JsonReportRepository implements ReportRepository {
  async find(guideId: string, userId: string): Promise<Report | null> {
    const reports = await readJsonFile<Report[]>(REPORTS_FILE, []);
    return reports.find((r) => r.guideId === guideId && r.userId === userId) ?? null;
  }

  async create(guideId: string, userId: string, reason: string): Promise<void> {
    const reports = await readJsonFile<Report[]>(REPORTS_FILE, []);

    const report: Report = {
      guideId,
      userId,
      reason,
      createdAt: new Date().toISOString(),
    };

    reports.push(report);
    await writeJsonFile(REPORTS_FILE, reports);
  }

  async countByGuide(guideId: string): Promise<number> {
    const reports = await readJsonFile<Report[]>(REPORTS_FILE, []);
    return reports.filter((r) => r.guideId === guideId).length;
  }

  async countByUserRecent(userId: string, sinceMs: number): Promise<number> {
    const reports = await readJsonFile<Report[]>(REPORTS_FILE, []);
    const cutoff = new Date(Date.now() - sinceMs).toISOString();
    return reports.filter((r) => r.userId === userId && r.createdAt >= cutoff).length;
  }
}
