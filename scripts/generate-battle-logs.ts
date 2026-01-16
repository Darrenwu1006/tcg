/**
 * Generate Battle Logs Script
 * Runs a single MCTS vs MCTS match and saves the game logs to a file.
 * Used for verifying skill timing and execution logic.
 */

import { GameEngine } from "../src/engine/GameEngine";
import { MCTSAI } from "../src/engine/MCTSAI";
import { initializeSkills } from "../src/engine/SkillLoader";
import { Card } from "../src/state/Store";
import * as fs from "fs";
import * as path from "path";
import { MCTSLogLevel } from "../src/engine/MCTS";

// --- Shared Utility Functions (Copied from test-mcts.ts) ---

function loadCardPool(): Map<string, any> {
  const pool = new Map<string, any>();

  // Load Characters
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

  // Load Events
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
        type: "EVENT",
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

function loadDeck(deckPath: string, cardPool: Map<string, any>): Card[] {
  const fullPath = path.join(process.cwd(), deckPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Deck file not found: ${fullPath}`);
    return [];
  }
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

    const cardData = cardPool.get(id);

    for (let j = 0; j < count; j++) {
      if (cardData) {
        deck.push({
          ...cardData,
          stats: cardData.stats ? { ...cardData.stats } : undefined,
          instanceId: crypto.randomUUID(),
        });
      }
    }
  }

  return deck;
}

async function main() {
  console.log("Initializing skills...");
  await initializeSkills();

  console.log("Loading card pool...");
  const cardPool = loadCardPool();

  // Setup Decks: Aoba Johsai (Fast Attack) vs Karasuno (Tsukishima Block)
  const deck1 = loadDeck("src/assets/decks/青葉城西/快攻軸.csv", cardPool);
  const deck2 = loadDeck("src/assets/decks/烏野/山月攔網軸.csv", cardPool);

  if (deck1.length === 0 || deck2.length === 0) {
    console.error("Failed to load decks");
    return;
  }

  // Use MCTS for both sides
  const ai1 = new MCTSAI("me", 200, MCTSLogLevel.SUMMARY);
  const ai2 = new MCTSAI("opponent", 200, MCTSLogLevel.SUMMARY);

  console.log("Starting Battle for Log Generation...");
  const engine = new GameEngine([...deck1], [...deck2], "me");

  let turns = 0;
  const maxTurns = 200;

  while (!engine.isGameOver() && turns < maxTurns) {
    const state = engine.getState();
    const player = state.turnPlayer;
    const ai = player === "me" ? ai1 : ai2;

    try {
      const action = ai.selectAction(state);
      engine.executeAction(action);
    } catch (e) {
      console.error(`Error in turn ${turns} (${player}):`, e);
      break;
    }
    turns++;
  }

  const winner = engine.getWinner();
  console.log(`Match Ended. Winner: ${winner}`);

  // Save logs to file
  const logs = engine.getState().logs;
  const logContent = logs.join("\n");
  const outputPath = path.join(process.cwd(), "battle_logs.txt");

  fs.writeFileSync(outputPath, logContent, "utf-8");
  console.log(`Battle logs saved to: ${outputPath}`);
}

main().catch(console.error);
