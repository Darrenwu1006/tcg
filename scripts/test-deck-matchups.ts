/**
 * Deck Matchup Test Script
 * Tests Aoba Johsai Fast Attack deck against various other decks
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
          instanceId: crypto.randomUUID(),
        });
      }
    }
  }

  return deck;
}

async function runBattle(
  ai1: any,
  ai2: any,
  deck1: Card[],
  deck2: Card[],
  matchName: string
): Promise<Player | "draw"> {
  console.log(`\nStarting Match: ${matchName}`);
  console.log(`Deck 1 Size: ${deck1.length}, Deck 2 Size: ${deck2.length}`);

  if (deck1.length < 40 || deck2.length < 40) {
    console.error("Error: Deck size must be at least 40");
    return "draw";
  }

  const engine = new GameEngine([...deck1], [...deck2], "me");
  let turns = 0;
  const maxTurns = 150;

  while (!engine.isGameOver() && turns < maxTurns) {
    const state = engine.getState();
    const player = state.turnPlayer;
    const ai = player === "me" ? ai1 : ai2;

    try {
      const action = ai.selectAction(state);
      engine.executeAction(action);
    } catch (e) {
      console.error(`Error in turn ${turns} (${player}):`, e);
      return player === "me" ? "opponent" : "me"; // Forfeit on error
    }
    turns++;
  }

  const winner = engine.getWinner();
  console.log(`Match Ended in ${turns} turns. Winner: ${winner || "Draw"}`);
  return winner || "draw";
}

// --- Main Execution ---

async function main() {
  console.log("Initializing skills...");
  await initializeSkills();

  console.log("Loading card pool...");
  const cardPool = loadCardPool();

  const myDeckPath = "src/assets/decks/青葉城西/快攻軸.csv";
  const myDeck = loadDeck(myDeckPath, cardPool);

  if (myDeck.length === 0) {
    console.error("Failed to load my deck");
    return;
  }

  const opponents = [
    {
      name: "Karasuno Tsukishima Block",
      path: "src/assets/decks/烏野/山月攔網軸.csv",
    },
    { name: "Nekoma Starter", path: "src/assets/decks/音駒/預組.csv" },
    {
      name: "Fukurodani High Burst",
      path: "src/assets/decks/梟谷/高爆發軸.csv",
    },
    { name: "Mixed Dumpster", path: "src/assets/decks/混合學校/垃圾場.csv" },
  ];

  const mctsAI = new MCTSAI("me", 200, MCTSLogLevel.SUMMARY); // 200 sims for balance
  const heuristicAI = new HeuristicAI("opponent");

  console.log(
    "\n=== Tournament: Aoba Johsai Fast Attack (MCTS) vs Others (Heuristic) ==="
  );

  for (const opp of opponents) {
    const oppDeck = loadDeck(opp.path, cardPool);
    if (oppDeck.length === 0) {
      console.log(`Skipping ${opp.name} (failed to load)`);
      continue;
    }

    await runBattle(mctsAI, heuristicAI, myDeck, oppDeck, `vs ${opp.name}`);
  }
}

main().catch(console.error);
