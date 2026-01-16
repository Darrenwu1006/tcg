/**
 * MCTS AI 測試腳本
 * Tests: MCTS AI vs Random AI / Heuristic AI
 */

import { GameEngine } from "../src/engine/GameEngine";
import { MCTSAI } from "../src/engine/MCTSAI";
import { HeuristicAI } from "../src/engine/HeuristicAI";
import { initializeSkills } from "../src/engine/SkillLoader";
import { GameAction, Player } from "../src/engine/Actions";
import { Card } from "../src/state/Store";
import * as fs from "fs";
import * as path from "path";
import { MCTSLogLevel } from "../src/engine/MCTS";

// 載入卡池資料
function loadCardPool(): Map<string, any> {
  const pool = new Map<string, any>();

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

      const parseStat = (val: string | undefined) => {
        if (!val || val.trim() === "-" || val.trim() === "") return null;
        const num = parseInt(val.trim());
        return isNaN(num) ? null : num;
      };

      pool.set(id, {
        id,
        name,
        type: "CHARACTER",
        school: parts[0]?.trim(),
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

      const parseStat = (val: string | undefined) => {
        if (!val || val.trim() === "-" || val.trim() === "") return null;
        const num = parseInt(val.trim());
        return isNaN(num) ? null : num;
      };

      pool.set(id, {
        id,
        name,
        type: "EVENT", // 事件卡
        school: parts[0]?.trim(),
        rarity: parts[4]?.trim() || "-",
        timing: parts[5]?.trim() || "-",
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

  console.log(`載入卡池: ${pool.size} 張卡片`);
  return pool;
}

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

// 載入牌組 (使用真實卡片資料)
function loadDeck(deckPath: string, cardPool: Map<string, any>): Card[] {
  const fullPath = path.join(process.cwd(), deckPath);
  const content = fs.readFileSync(fullPath, "utf-8");
  const lines = content.split("\n");
  const deck: Card[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(",");
    if (parts.length < 2) continue;

    const name = parts[0]?.trim();
    const id = parts[1]?.trim();
    const count = parseInt(parts[2]?.trim() || "1");

    // 從卡池獲取真實卡片資料
    const cardData = cardPool.get(id);

    for (let j = 0; j < count; j++) {
      if (cardData) {
        deck.push({
          ...cardData,
          stats: cardData.stats ? { ...cardData.stats } : undefined,
          instanceId: crypto.randomUUID(),
        });
      } else {
        console.warn(`⚠️ 找不到卡片: ${id} (${name})`);
      }
    }
  }

  return deck;
}

// 隨機 AI
class RandomAI {
  selectAction(state: any): GameAction {
    const actions = GameEngine.fromState(state).getLegalActions();
    if (actions.length === 0) throw new Error("No legal actions");
    return actions[Math.floor(Math.random() * actions.length)];
  }
}

async function runBattle(
  ai1: any,
  ai2: any,
  deck1: Card[],
  deck2: Card[]
): Promise<Player | "draw"> {
  const engine = new GameEngine([...deck1], [...deck2], "me");
  let turns = 0;
  const maxTurns = 100;

  while (!engine.isGameOver() && turns < maxTurns) {
    const state = engine.getState();
    const player = state.turnPlayer;
    const ai = player === "me" ? ai1 : ai2;

    // console.log(`Turn ${turns}: ${player} thinking...`);
    const action = ai.selectAction(state);
    // console.log(`  Action: ${action.type}`);

    engine.executeAction(action);
    turns++;
  }

  return engine.getWinner() || "draw";
}

async function main() {
  console.log("Initializing skills...");
  await initializeSkills();

  console.log("Loading card pool...");
  const cardPool = loadCardPool();

  const deck1 = loadDeck("src/assets/decks/青葉城西/快攻軸.csv", cardPool);
  const deck2 = loadDeck("src/assets/decks/烏野/日影攻擊軸.csv", cardPool);

  // MCTS vs Random
  console.log("\n=== Test 1: MCTS (100 sims) vs Random ===");
  const mctsAI = new MCTSAI("me", 100, MCTSLogLevel.SUMMARY); // Low sims for speed
  const randomAI = new RandomAI();

  const result1 = await runBattle(mctsAI, randomAI, deck1, deck2);
  console.log(
    `Result: ${
      result1 === "me"
        ? "MCTS Wins"
        : result1 === "opponent"
        ? "Random Wins"
        : "Draw"
    }`
  );

  // MCTS vs Heuristic
  console.log("\n=== Test 2: MCTS (500 sims) vs Heuristic ===");
  const mctsAI2 = new MCTSAI("me", 500, MCTSLogLevel.DETAILED);
  const heuristicAI = new HeuristicAI("opponent");

  const result2 = await runBattle(mctsAI2, heuristicAI, deck1, deck2);
  console.log(
    `Result: ${
      result2 === "me"
        ? "MCTS Wins"
        : result2 === "opponent"
        ? "Heuristic Wins"
        : "Draw"
    }`
  );
}

main().catch(console.error);
