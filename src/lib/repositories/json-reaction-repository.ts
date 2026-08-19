import { readJsonFile, writeJsonFile, getDataFilePath } from './json-store';
import type { Reaction, ReactionRepository } from './types';

const REACTIONS_FILE = getDataFilePath('reactions.json');

function reactionKey(guideId: string, userId: string): string {
  return `${guideId}:${userId}`;
}

export class JsonReactionRepository implements ReactionRepository {
  async find(guideId: string, userId: string): Promise<Reaction | null> {
    const reactions = await readJsonFile<Reaction[]>(REACTIONS_FILE, []);
    const key = reactionKey(guideId, userId);
    return reactions.find((r) => reactionKey(r.guideId, r.userId) === key) ?? null;
  }

  async upsert(guideId: string, userId: string, type: 'like' | 'dislike'): Promise<void> {
    const reactions = await readJsonFile<Reaction[]>(REACTIONS_FILE, []);
    const key = reactionKey(guideId, userId);
    const index = reactions.findIndex((r) => reactionKey(r.guideId, r.userId) === key);

    const reaction: Reaction = {
      guideId,
      userId,
      type,
      createdAt: new Date().toISOString(),
    };

    if (index === -1) {
      reactions.push(reaction);
    } else {
      reactions[index] = reaction;
    }

    await writeJsonFile(REACTIONS_FILE, reactions);
  }

  async remove(guideId: string, userId: string): Promise<void> {
    const reactions = await readJsonFile<Reaction[]>(REACTIONS_FILE, []);
    const key = reactionKey(guideId, userId);
    const filtered = reactions.filter((r) => reactionKey(r.guideId, r.userId) !== key);
    await writeJsonFile(REACTIONS_FILE, filtered);
  }
}
