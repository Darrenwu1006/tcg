import { Card } from "../state/Store";
import { CardDatabase } from "../data/CardDatabase";

/**
 * 從 CSV 路徑載入牌組
 */
export async function loadDeck(deckPath: string): Promise<Card[]> {
  const db = CardDatabase.getInstance();
  await db.loadAll();
  const availableDecks = await db.getAvailableDecks();
  
  // Find the requested deck
  const deckInfo = availableDecks.find((d) => d.path === deckPath || d.path.endsWith(deckPath));
  if (!deckInfo) {
    console.error(`Failed to load deck: ${deckPath}`);
    return [];
  }
  
  return await db.loadDeck(deckInfo.loader as () => Promise<string>);
}

/**
 * 獲取牌組資訊（首張卡片的學校）
 */
export async function getDeckSchool(deckPath: string): Promise<string> {
  const db = CardDatabase.getInstance();
  await db.loadAll();
  const availableDecks = await db.getAvailableDecks();
  const deckInfo = availableDecks.find((d) => d.path === deckPath || d.path.endsWith(deckPath));
  return deckInfo ? deckInfo.school : "unknown";
}
