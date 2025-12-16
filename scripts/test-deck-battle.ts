/**
 * 牌組對戰測試系統
 * Deck Battle Test System
 *
 * 讀取實際牌組並進行大量對戰測試，統計勝率
 */

import { GameEngine } from "../src/engine/GameEngine";
import { Card } from "../src/state/Store";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// ES module 路徑輔助
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 從 CSV 文件讀取牌組
 */
function loadDeckFromCSV(csvPath: string, cardPool: Map<string, any>): Card[] {
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");
  const deck: Card[] = [];

  // 跳過標題行
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 3) continue;

    const cardId = parts[1]?.trim();
    const countStr = parts[2]?.trim();

    if (!cardId || !countStr) continue;

    const count = parseInt(countStr);
    if (isNaN(count) || count === 0) continue;

    // 從卡池獲取卡片數據
    const cardData = cardPool.get(cardId);
    if (!cardData) {
      console.warn(`⚠️  卡片 ${cardId} 不在卡池中`);
      continue;
    }

    // 添加指定數量的卡片
    for (let j = 0; j < count; j++) {
      deck.push({
        ...cardData,
        instanceId: `${cardId}-${Date.now()}-${j}`,
      });
    }
  }

  return deck;
}

/**
 * 從 Pool CSV 加載卡池
 */
function loadCardPool(): Map<string, any> {
  const cardPool = new Map<string, any>();

  // 讀取角色卡池
  const charPoolPath = path.join(
    __dirname,
    "../public/pool/All_Characters.csv"
  );
  if (fs.existsSync(charPoolPath)) {
    const content = fs.readFileSync(charPoolPath, "utf-8");
    parsePoolCSV(content, "CHARACTER", cardPool);
  }

  // 讀取事件卡池
  const eventPoolPath = path.join(__dirname, "../public/pool/All_Events.csv");
  if (fs.existsSync(eventPoolPath)) {
    const content = fs.readFileSync(eventPoolPath, "utf-8");
    parsePoolCSV(content, "EVENT", cardPool);
  }

  return cardPool;
}

/**
 * 解析卡池 CSV
 */
function parsePoolCSV(
  content: string,
  type: "CHARACTER" | "EVENT",
  cardPool: Map<string, any>
) {
  const lines = content.split("\n");

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 4) continue;

    const school = parts[0]?.trim();
    const id = parts[2]?.trim();
    const name = parts[3]?.trim();

    if (!id || !name) continue;

    const parseStat = (val: string | undefined) => {
      if (!val || val.trim() === "-" || val.trim() === "") return null;
      const num = parseInt(val.trim());
      return isNaN(num) ? null : num;
    };

    if (type === "CHARACTER") {
      cardPool.set(id, {
        id,
        name,
        type: "CHARACTER",
        school,
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
        note: parts[13]?.trim() || "-",
      });
    } else {
      cardPool.set(id, {
        id,
        name,
        type: "EVENT",
        school,
        rarity: parts[4]?.trim() || "-",
        timing: parts[5]?.trim() || "-",
        role: "-",
        stats: {
          serve: parseStat(parts[6]),
          block: parseStat(parts[7]),
          receive: parseStat(parts[8]),
          toss: parseStat(parts[9]),
          attack: parseStat(parts[10]),
        },
        skill: parts[11]?.trim() || "-",
        note: parts[12]?.trim() || "-",
      });
    }
  }
}

/**
 * 解析 CSV 行（處理引號）
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
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * 簡單的 AI：隨機選擇合法動作（非 PASS 優先）
 */
function simpleAI(engine: GameEngine) {
  const legalActions = engine.getLegalActions();

  if (legalActions.length === 0) return;

  // 優先選擇非 PASS 動作
  const nonPassActions = legalActions.filter((a) => a.type !== "PASS");

  if (nonPassActions.length > 0) {
    const action =
      nonPassActions[Math.floor(Math.random() * nonPassActions.length)];
    engine.executeAction(action);
  } else {
    // 只有 PASS 可選時才 PASS
    engine.executeAction(legalActions[0]);
  }
}

/**
 * 進行一場對戰
 */
function playMatch(
  deck1: Card[],
  deck2: Card[],
  maxTurns: number = 100
): "deck1" | "deck2" | "draw" {
  const engine = new GameEngine(deck1, deck2, "me");

  let turns = 0;
  while (!engine.isGameOver() && turns < maxTurns) {
    simpleAI(engine);
    turns++;
  }

  const winner = engine.getWinner();
  if (winner === "me") return "deck1";
  if (winner === "opponent") return "deck2";
  return "draw";
}

/**
 * 批量對戰測試
 */
interface BattleResult {
  deck1Name: string;
  deck2Name: string;
  totalGames: number;
  deck1Wins: number;
  deck2Wins: number;
  draws: number;
  winRate: number;
}

function runBattleTest(
  deck1: Card[],
  deck1Name: string,
  deck2: Card[],
  deck2Name: string,
  games: number
): BattleResult {
  let deck1Wins = 0;
  let deck2Wins = 0;
  let draws = 0;

  console.log(`\n開始對戰測試: ${deck1Name} vs ${deck2Name}`);
  console.log(`總局數: ${games}`);
  console.log("進度: ");

  for (let i = 0; i < games; i++) {
    // 顯示進度
    if ((i + 1) % 100 === 0) {
      process.stdout.write(`${i + 1}/${games}... `);
    }

    const result = playMatch([...deck1], [...deck2]);

    if (result === "deck1") deck1Wins++;
    else if (result === "deck2") deck2Wins++;
    else draws++;
  }

  console.log("\n");

  const winRate = (deck1Wins / games) * 100;

  return {
    deck1Name,
    deck2Name,
    totalGames: games,
    deck1Wins,
    deck2Wins,
    draws,
    winRate,
  };
}

/**
 * 顯示測試結果
 */
function displayResults(results: BattleResult[]) {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║             對戰測試結果統計                        ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  results.forEach((result, index) => {
    console.log(
      `【對戰 ${index + 1}】${result.deck1Name} vs ${result.deck2Name}`
    );
    console.log(`  總局數: ${result.totalGames}`);
    console.log(
      `  ${result.deck1Name} 勝: ${
        result.deck1Wins
      } 局 (${result.winRate.toFixed(1)}%)`
    );
    console.log(
      `  ${result.deck2Name} 勝: ${result.deck2Wins} 局 (${(
        100 -
        result.winRate -
        (result.draws / result.totalGames) * 100
      ).toFixed(1)}%)`
    );
    console.log(
      `  平手: ${result.draws} 局 (${(
        (result.draws / result.totalGames) *
        100
      ).toFixed(1)}%)`
    );
    console.log("");
  });

  // 總結
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║                    總結                               ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const avgWinRate =
    results.reduce((sum, r) => sum + r.winRate, 0) / results.length;
  console.log(`${results[0].deck1Name} 平均勝率: ${avgWinRate.toFixed(1)}%`);

  // 找出最有利和最不利的對局
  const best = results.reduce((max, r) => (r.winRate > max.winRate ? r : max));
  const worst = results.reduce((min, r) => (r.winRate < min.winRate ? r : min));

  console.log(`最有利對局: vs ${best.deck2Name} (${best.winRate.toFixed(1)}%)`);
  console.log(
    `最不利對局: vs ${worst.deck2Name} (${worst.winRate.toFixed(1)}%)`
  );
}

/**
 * 主函數
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║          青葉城西「快攻軸」對戰測試系統            ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // 載入卡池
  console.log("📦 載入卡池...");
  const cardPool = loadCardPool();
  console.log(`✓ 載入 ${cardPool.size} 張卡片\n`);

  // 載入青葉城西快攻軸
  console.log("📋 載入牌組...");
  const seijohDeckPath = path.join(
    __dirname,
    "../src/assets/decks/青葉城西/快攻軸.csv"
  );
  const seijohDeck = loadDeckFromCSV(seijohDeckPath, cardPool);
  console.log(`✓ 青葉城西「快攻軸」: ${seijohDeck.length} 張`);

  // 載入對手牌組
  const opponentDecks = [
    {
      name: "烏野「日影攻擊軸」",
      path: "../src/assets/decks/烏野/日影攻擊軸.csv",
    },
    {
      name: "烏野「山月攔網軸」",
      path: "../src/assets/decks/烏野/山月攔網軸.csv",
    },
    { name: "音駒「預組」", path: "../src/assets/decks/音駒/預組.csv" },
    { name: "梟谷「高爆發軸」", path: "../src/assets/decks/梟谷/高爆發軸.csv" },
  ];

  const loadedOpponents: { name: string; deck: Card[] }[] = [];

  for (const opponent of opponentDecks) {
    try {
      const deckPath = path.join(__dirname, opponent.path);
      const deck = loadDeckFromCSV(deckPath, cardPool);
      if (deck.length > 0) {
        loadedOpponents.push({ name: opponent.name, deck });
        console.log(`✓ ${opponent.name}: ${deck.length} 張`);
      }
    } catch (error) {
      console.log(`⚠️  無法載入 ${opponent.name}`);
    }
  }

  console.log("");

  // 進行對戰測試
  const results: BattleResult[] = [];
  const gamesPerMatch = 1000;

  for (const opponent of loadedOpponents) {
    const result = runBattleTest(
      seijohDeck,
      "青葉城西「快攻軸」",
      opponent.deck,
      opponent.name,
      gamesPerMatch
    );
    results.push(result);
  }

  // 顯示結果
  displayResults(results);

  // 保存結果到文件
  const reportPath = path.join(__dirname, "../battle_results.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📊 詳細結果已保存到: battle_results.json`);
}

// 執行
main().catch(console.error);
