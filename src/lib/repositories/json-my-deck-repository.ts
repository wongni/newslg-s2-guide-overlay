import { readJsonFile, writeJsonFile, getDataFilePath } from './json-store';
import type { MyDeckRepository, MyDeckSettingsData } from './types';

const MY_DECK_FILE = getDataFilePath('scout-my-decks.json');

// userId -> MyDeckSettingsData
type Store = Record<string, MyDeckSettingsData>;

export class JsonMyDeckRepository implements MyDeckRepository {
  private async load(): Promise<Store> {
    const data = await readJsonFile<Store>(MY_DECK_FILE, {});
    return data && typeof data === 'object' ? data : {};
  }

  async get(userId: string): Promise<MyDeckSettingsData | null> {
    const store = await this.load();
    return store[userId] ?? null;
  }

  async set(
    userId: string,
    settings: MyDeckSettingsData
  ): Promise<MyDeckSettingsData> {
    const store = await this.load();
    // decks 배열만 안전하게 저장
    const clean: MyDeckSettingsData = {
      decks: Array.isArray(settings.decks) ? settings.decks : [],
    };
    store[userId] = clean;
    await writeJsonFile(MY_DECK_FILE, store);
    return clean;
  }
}
