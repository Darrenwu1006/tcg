/**
 * Deck Loader
 * 牌組載入器 - 從 CSV 檔案載入牌組
 *
 * 設計為可在瀏覽器環境使用（通過 fetch 載入 CSV）
 */

import { Card, CardStats } from "../state/Store";

// 卡片池接口
interface CardPoolEntry {
  id: string;
  name: string;
  type: "CHARACTER" | "EVENT";
  school: string;
  timing: string;
  rarity: string;
  role?: string;
  stats: CardStats;
  skill: string;
}

// 卡片池快取
let cardPoolCache: Map<string, CardPoolEntry> | null = null;

/**
 * 解析 CSV 行
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * 解析數值（處理 "-" 等無效值）
 */
function parseStat(val: string | undefined): number | null {
  if (!val || val.trim() === "-" || val.trim() === "") return null;
  const num = parseInt(val.trim());
  return isNaN(num) ? null : num;
}

/**
 * 獲取 base URL（支持 Vite 開發和生產構建）
 */
function getBaseUrl(): string {
  // Vite 提供的環境變數
  if (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) {
    return import.meta.env.BASE_URL;
  }
  // 回退到根路徑
  return "/";
}

/**
 * 載入卡片池
 */
async function loadCardPool(): Promise<Map<string, CardPoolEntry>> {
  if (cardPoolCache) {
    return cardPoolCache;
  }

  const pool = new Map<string, CardPoolEntry>();
  const baseUrl = getBaseUrl();

  // 載入角色卡
  try {
    const charResponse = await fetch(`${baseUrl}pool/All_Characters.csv`);
    if (charResponse.ok) {
      const content = await charResponse.text();
      const lines = content.split("\n");

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = parseCSVLine(line);
        const id = parts[2]?.trim();
        const name = parts[3]?.trim();
        if (!id || !name) continue;

        pool.set(id, {
          id,
          name,
          type: "CHARACTER",
          school: parts[0]?.trim() || "",
          timing: parts[4]?.trim() || "-",
          rarity: parts[5]?.trim() || "-",
          role: parts[6]?.trim() || "-",
          stats: {
            serve: parseStat(parts[7]),
            block: parseStat(parts[8]),
            receive: parseStat(parts[9]),
            toss: parseStat(parts[10]),
            attack: parseStat(parts[11]),
          },
          skill: parts[12]?.trim() || "-",
        });
      }
    }
  } catch (e) {
    console.error("Failed to load characters:", e);
  }

  // 載入事件卡
  try {
    const eventResponse = await fetch(`${baseUrl}pool/All_Events.csv`);
    if (eventResponse.ok) {
      const content = await eventResponse.text();
      const lines = content.split("\n");

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = parseCSVLine(line);
        const id = parts[2]?.trim();
        const name = parts[3]?.trim();
        if (!id || !name) continue;

        pool.set(id, {
          id,
          name,
          type: "EVENT",
          school: parts[0]?.trim() || "",
          timing: parts[5]?.trim() || "-",
          rarity: parts[4]?.trim() || "-",
          stats: {
            serve: parseStat(parts[6]),
            block: parseStat(parts[7]),
            receive: parseStat(parts[8]),
            toss: parseStat(parts[9]),
            attack: parseStat(parts[10]),
          },
          skill: parts[11]?.trim() || "-",
        });
      }
    }
  } catch (e) {
    console.error("Failed to load events:", e);
  }

  cardPoolCache = pool;
  return pool;
}

/**
 * 從 CSV 路徑載入牌組
 */
export async function loadDeck(deckPath: string): Promise<Card[]> {
  const cardPool = await loadCardPool();
  const baseUrl = getBaseUrl();

  // 將路徑轉換為可 fetch 的 URL
  // 例如: "src/assets/decks/青葉城西/快攻軸.csv" -> "<baseUrl>decks/青葉城西/快攻軸.csv"
  let relativePath = "";
  if (deckPath.startsWith("src/assets/decks/")) {
    relativePath = deckPath.replace("src/assets/decks/", "decks/");
  } else if (deckPath.startsWith("decks/")) {
    relativePath = deckPath;
  } else if (!deckPath.startsWith("/")) {
    relativePath = "decks/" + deckPath;
  } else {
    relativePath = deckPath.slice(1); // 移除開頭的 /
  }

  const fetchPath = `${baseUrl}${relativePath}`;

  try {
    const response = await fetch(fetchPath);
    if (!response.ok) {
      console.error(`Failed to load deck: ${deckPath}`);
      return [];
    }

    const content = await response.text();
    const lines = content.split("\n");
    const deck: Card[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(",");
      if (parts.length < 2) continue;

      const id = parts[1]?.trim();
      const count = parseInt(parts[2]?.trim() || "1");

      const cardData = cardPool.get(id);
      if (!cardData) {
        console.warn(`Card not found in pool: ${id}`);
        continue;
      }

      for (let j = 0; j < count; j++) {
        deck.push({
          id: cardData.id,
          instanceId: crypto.randomUUID(),
          name: cardData.name,
          type: cardData.type,
          school: cardData.school,
          timing: cardData.timing,
          rarity: cardData.rarity,
          role: cardData.role,
          stats: cardData.stats ? { ...cardData.stats } : undefined,
          skill: cardData.skill,
        });
      }
    }

    return deck;
  } catch (e) {
    console.error(`Error loading deck ${deckPath}:`, e);
    return [];
  }
}

/**
 * 獲取牌組資訊（首張卡片的學校）
 */
export async function getDeckSchool(deckPath: string): Promise<string> {
  const deck = await loadDeck(deckPath);
  if (deck.length === 0) return "unknown";
  return deck[0].school || "unknown";
}
