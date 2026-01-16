/**
 * AI 對戰測試腳本
 * Tests: Heuristic AI vs Random AI
 */

import { GameEngine } from "../src/engine/GameEngine";
import { HeuristicAI } from "../src/engine/HeuristicAI";
import { initializeSkills } from "../src/engine/SkillLoader";
import { GameAction, Player } from "../src/engine/Actions";
import { RuleValidator } from "../src/engine/RuleValidator";
import * as fs from "fs";
import * as path from "path";

// 載入卡池
function loadCardPool(): Map<string, any> {
  const pool = new Map<string, any>();

  const parseStat = (val: string | undefined) => {
    if (!val || val.trim() === "-" || val.trim() === "") return null;
    const num = parseInt(val.trim());
    return isNaN(num) ? null : num;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else current += char;
    }
    result.push(current);
    return result;
  };

  // 載入角色卡
  const charPath = path.join(process.cwd(), "public/pool/All_Characters.csv");
  if (fs.existsSync(charPath)) {
    const content = fs.readFileSync(charPath, "utf-8");
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
        school: parts[0]?.trim(),
        stats: {
          serve: parseStat(parts[7]),
          block: parseStat(parts[8]),
          receive: parseStat(parts[9]),
          toss: parseStat(parts[10]),
          attack: parseStat(parts[11]),
        },
      });
    }
  }

  // 載入事件卡
  const eventPath = path.join(process.cwd(), "public/pool/All_Events.csv");
  if (fs.existsSync(eventPath)) {
    const content = fs.readFileSync(eventPath, "utf-8");
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
        school: parts[0]?.trim(),
        stats: {
          serve: parseStat(parts[6]),
          block: parseStat(parts[7]),
          receive: parseStat(parts[8]),
          toss: parseStat(parts[9]),
          attack: parseStat(parts[10]),
        },
      });
    }
  }

  return pool;
}

// 載入牌組
function loadDeck(deckPath: string, cardPool: Map<string, any>): any[] {
  const fullPath = path.join(process.cwd(), deckPath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");
  const deck: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    if (parts.length < 2) continue;
    const id = parts[1]?.trim();
    const count = parseInt(parts[2]?.trim() || "1");
    const cardData = cardPool.get(id);
    for (let j = 0; j < count; j++) {
      if (cardData) {
        deck.push({ ...cardData, instanceId: crypto.randomUUID() });
      }
    }
  }
  return deck;
}

// 隨機 AI
class RandomAI {
  selectAction(state: any, player: Player): GameAction {
    const actions = RuleValidator.getLegalActions(state, player);
    if (actions.length === 0) throw new Error("No actions");
    return actions[Math.floor(Math.random() * actions.length)];
  }
}

// 對戰結果
interface BattleResult {
  winner: Player | null;
  turns: number;
  meSkillsUsed: number;
  opponentSkillsUsed: number;
  topSkills?: string[];
}

// 運行單場對局
async function runBattle(
  deck1: any[],
  deck2: any[],
  ai1: HeuristicAI | RandomAI,
  ai2: HeuristicAI | RandomAI,
  verbose: boolean = false
): Promise<BattleResult> {
  const engine = new GameEngine([...deck1], [...deck2], "me");
  let turnCount = 0;
  let meSkillsUsed = 0;
  let opponentSkillsUsed = 0;
  const skillUsage = new Map<string, number>();

  while (!engine.isGameOver() && turnCount < 200) {
    turnCount++;
    const state = engine.getState();
    const currentPlayer = state.turnPlayer;
    const currentAI = currentPlayer === "me" ? ai1 : ai2;
    const action = currentAI.selectAction(state, currentPlayer);

    if (action.type === "ACTIVATE_SKILL" || action.type === "USE_EVENT") {
      if (currentPlayer === "me") meSkillsUsed++;
      else opponentSkillsUsed++;

      // 查找卡片名稱
      const playerState = currentPlayer === "me" ? state.me : state.opponent;
      const card =
        playerState.hand.find((c) => c.instanceId === action.cardInstanceId) ||
        playerState.field.find((c) => c.instanceId === action.cardInstanceId);
      const skillName = card ? `${card.name} (${card.id})` : "Unknown Card";

      skillUsage.set(skillName, (skillUsage.get(skillName) || 0) + 1);
    }

    if (verbose) {
      console.log(
        `  回合 ${turnCount}, 玩家 ${currentPlayer} 執行動作: ${action.type}`
      );
      if (action.type === "ACTIVATE_SKILL" || action.type === "USE_EVENT") {
        console.log(`    技能: ${action.cardInstanceId}`);
      }
    }
    const result = engine.executeAction(action);
    if (!result.success) {
      console.log(`Action failed: ${result.error} (Action: ${action.type})`);
      // break; // Optional: break on error to stop loop
    }
  }

  // 找出使用最頻繁的技能
  const topSkills = [...skillUsage.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key, count]) => `${key} (${count})`);

  return {
    winner: engine.getWinner(),
    turns: turnCount,
    meSkillsUsed,
    opponentSkillsUsed,
    topSkills,
  };
}

// 主程序
async function main() {
  console.log("╔════════════════════════════════════╗");
  console.log("║   AI 對戰測試                     ║");
  console.log("╚════════════════════════════════════╝\n");

  // 載入技能
  await initializeSkills();
  console.log("✓ 技能資料已載入\n");

  // 載入卡池和牌組
  const cardPool = loadCardPool();
  const deck1 = loadDeck("src/assets/decks/青葉城西/快攻軸.csv", cardPool);
  const deck2 = loadDeck("src/assets/decks/烏野/日影攻擊軸.csv", cardPool);

  console.log(`牌組 1: 青葉城西 (${deck1.length} 張)`);
  console.log(`牌組 2: 烏野 (${deck2.length} 張)\n`);

  // === 測試 1: 啟發式 AI vs 隨機 AI ===
  console.log("=== 測試 1: 啟發式 AI vs 隨機 AI ===");
  const heuristicAI = new HeuristicAI(0.05);
  const randomAI = new RandomAI();

  let heuristicWins = 0;
  let randomWins = 0;
  let ties = 0;
  let totalSkills = 0;
  let loopDetected = false;
  const games = 20; // 減少到 20 場加快測試

  for (let i = 0; i < games; i++) {
    const result = await runBattle(deck1, deck2, heuristicAI, randomAI);
    if (result.winner === "me") heuristicWins++;
    else if (result.winner === "opponent") randomWins++;
    else ties++;
    totalSkills += result.meSkillsUsed;

    // 檢測異常：技能使用超過 50 次可能是循環
    if (result.meSkillsUsed > 50) {
      console.log(`⚠️ 對局 ${i + 1} 異常：技能使用 ${result.meSkillsUsed} 次`);
      if (result.topSkills) {
        console.log(`   Top Skills: ${result.topSkills.join(", ")}`);
      }
      loopDetected = true;
    }

    // 進度顯示
    if ((i + 1) % 5 === 0) {
      console.log(`  進度: ${i + 1}/${games}`);
    }
  }

  if (loopDetected) {
    console.log("\n⚠️ 檢測到可能的循環！停止測試。");
    return;
  }

  const winRate = ((heuristicWins / games) * 100).toFixed(1);
  console.log(
    `  結果: 啟發式 ${heuristicWins} 勝 / 隨機 ${randomWins} 勝 / 平手 ${ties}`
  );
  console.log(`  勝率: ${winRate}%`);
  console.log(`  平均技能使用: ${(totalSkills / games).toFixed(2)} 次/場`);
  console.log(`  目標: > 70% ${parseFloat(winRate) > 70 ? "✓" : "✗"}\n`);

  // === 測試 2: 啟發式 AI vs 啟發式 AI (平衡測試) ===
  console.log("=== 測試 2: 啟發式 AI vs 啟發式 AI ===");
  const heuristicAI1 = new HeuristicAI(0.05);
  const heuristicAI2 = new HeuristicAI(0.05);
  let ai1Wins = 0;
  let ai2Wins = 0;
  let ties2 = 0;
  let scoreDiffTotal = 0;
  const games2 = 20;

  for (let i = 0; i < games2; i++) {
    const result = await runBattle(deck1, deck2, heuristicAI1, heuristicAI2);
    if (result.winner === "me") ai1Wins++;
    else if (result.winner === "opponent") ai2Wins++;
    else ties2++;

    scoreDiffTotal += Math.abs(result.meSkillsUsed - 0); // 這裡原本是用分數，現在簡化
  }
  console.log(
    `  結果: 玩家1 ${ai1Wins} 勝 / 玩家2 ${ai2Wins} 勝 / 平手 ${ties2}`
  );
  const balance = (Math.abs(ai1Wins - ai2Wins) / games2) * 100;
  console.log(
    `  平衡度: ${(100 - balance).toFixed(1)}% (差距 ${balance.toFixed(1)}%)`
  );
  console.log(`  目標: 差距 < 20% ${balance < 20 ? "✓" : "✗"}\n`);

  // === 測試 3: 詳細對局範例 ===
  console.log("=== 測試 3: 詳細對局範例 ===");
  console.log("  運行一場詳細對局...");
  const detailedResult = await runBattle(
    deck1,
    deck2,
    heuristicAI,
    randomAI,
    true
  );
  console.log(
    `  結果: ${
      detailedResult.winner === "me"
        ? "啟發式 AI 勝"
        : detailedResult.winner === "opponent"
        ? "隨機 AI 勝"
        : "平手"
    }`
  );
  console.log(`  回合數: ${detailedResult.turns}`);
  console.log(`  啟發式 AI 技能使用: ${detailedResult.meSkillsUsed} 次`);

  console.log("\n╔════════════════════════════════════╗");
  console.log("║   測試完成                        ║");
  console.log("╚════════════════════════════════════╝");
}

main();
