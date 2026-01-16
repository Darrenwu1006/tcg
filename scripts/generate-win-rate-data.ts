/**
 * Generate Win Rate Data Script
 * Runs a single battle and records win rate at each turn for visualization.
 */

import { GameEngine } from "../src/engine/GameEngine";
import { MCTSAI } from "../src/engine/MCTSAI";
import { initializeSkills } from "../src/engine/SkillLoader";
import { Player } from "../src/engine/Actions";
import { Card } from "../src/state/Store";
import * as fs from "fs";
import * as path from "path";
import { MCTSLogLevel } from "../src/engine/MCTS";
import * as crypto from "crypto";

// --- Shared Utility Functions (Copied from verify-100-games.ts) ---
// Ideally these should be in a shared module, but for now we duplicate for standalone script.

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

// --- Data Generation Logic ---

interface WinRatePoint {
  turn: number;
  player: Player;
  winRate: number; // Always from "me" perspective
  meSetCount: number;
  oppSetCount: number;
}

interface GameData {
  id: number;
  firstPlayer: Player;
  winner: Player;
  totalTurns: number;
  points: WinRatePoint[];
}

async function runSingleBattle(
  id: number,
  ai1: MCTSAI,
  ai2: MCTSAI,
  deck1: Card[],
  deck2: Card[],
  firstPlayer: Player
): Promise<GameData> {
  const engine = new GameEngine([...deck1], [...deck2], firstPlayer);
  let turns = 0;
  const maxTurns = 150;
  const points: WinRatePoint[] = [];

  // Initial state (Turn 0)
  const initialState = engine.getState();
  points.push({
    turn: 0,
    player: firstPlayer,
    winRate: 0.5,
    meSetCount: initialState.me.set.length,
    oppSetCount: initialState.opponent.set.length,
  });

  while (!engine.isGameOver() && turns < maxTurns) {
    const state = engine.getState();
    const player = state.turnPlayer;
    const ai = player === "me" ? ai1 : ai2;

    try {
      const { action, winRate } = ai.selectActionWithStats(state);
      const meWinRate = player === "me" ? winRate : 1 - winRate;

      points.push({
        turn: state.turnCount,
        player: player,
        winRate: meWinRate,
        meSetCount: state.me.set.length,
        oppSetCount: state.opponent.set.length,
      });

      engine.executeAction(action);
    } catch (e) {
      console.error(`Error in turn ${turns} (${player}):`, e);
      break;
    }
    turns++;
  }

  const winner = engine.getWinner() || "me"; // Default to me if draw/error for type safety
  const finalState = engine.getState();

  points.push({
    turn: turns,
    player: "me", // This point represents the final outcome, not a specific player's turn
    winRate: winner === "me" ? 1.0 : 0.0,
    meSetCount: finalState.me.set.length,
    oppSetCount: finalState.opponent.set.length,
  });

  return {
    id,
    firstPlayer,
    winner,
    totalTurns: turns,
    points,
  };
}

async function main() {
  console.log("Initializing skills...");
  await initializeSkills();

  console.log("Loading card pool...");
  const cardPool = loadCardPool();

  const myDeckPath = "src/assets/decks/青葉城西/快攻軸.csv";
  const myDeck = loadDeck(myDeckPath, cardPool);

  const oppDeckPath = "src/assets/decks/梟谷/高爆發軸.csv";
  const oppDeck = loadDeck(oppDeckPath, cardPool);

  if (myDeck.length === 0 || oppDeck.length === 0) {
    console.error("Failed to load decks");
    return;
  }

  // Use 100 simulations for speed/quality balance
  const mctsAI_Me = new MCTSAI("me", 100, MCTSLogLevel.SILENT);
  const mctsAI_Opponent = new MCTSAI("opponent", 100, MCTSLogLevel.SILENT);

  console.log("Running 100 battles to generate detailed data...");

  const allGames: GameData[] = [];
  const totalGames = 100;
  const halfGames = 50;

  // Run Me-First Games
  console.log("--- Starting Part 1: Me First (50 games) ---");
  for (let i = 0; i < halfGames; i++) {
    const gameData = await runSingleBattle(
      i + 1,
      mctsAI_Me,
      mctsAI_Opponent,
      myDeck,
      oppDeck,
      "me"
    );
    allGames.push(gameData);
    if ((i + 1) % 5 === 0)
      process.stdout.write(`Completed ${i + 1}/${halfGames}\r`);
  }
  console.log("\nPart 1 Complete.");

  // Run Opp-First Games
  console.log("--- Starting Part 2: Opponent First (50 games) ---");
  for (let i = 0; i < halfGames; i++) {
    const gameData = await runSingleBattle(
      halfGames + i + 1,
      mctsAI_Me,
      mctsAI_Opponent,
      myDeck,
      oppDeck,
      "opponent"
    );
    allGames.push(gameData);
    if ((i + 1) % 5 === 0)
      process.stdout.write(`Completed ${i + 1}/${halfGames}\r`);
  }
  console.log("\nPart 2 Complete.");

  // Save detailed data
  const detailedPath = path.join(process.cwd(), "all_games_data.json");
  fs.writeFileSync(detailedPath, JSON.stringify(allGames, null, 2));
  console.log(`Detailed data saved to ${detailedPath}`);

  // Calculate Average Data (for backward compatibility/comparison)
  let maxLen = 0;
  for (const game of allGames) {
    if (game.points.length > maxLen) maxLen = game.points.length;
  }

  const avgData: { turn: number; avgWinRate: number }[] = [];

  for (let t = 0; t < maxLen; t++) {
    let sum = 0;
    for (const game of allGames) {
      if (t < game.points.length) {
        sum += game.points[t].winRate;
      } else {
        sum += game.points[game.points.length - 1].winRate;
      }
    }
    avgData.push({
      turn: t,
      avgWinRate: sum / totalGames,
    });
  }

  const avgPath = path.join(process.cwd(), "average_win_rate_data.json");
  fs.writeFileSync(avgPath, JSON.stringify(avgData, null, 2));
  console.log(`Average data saved to ${avgPath}`);
}

main().catch(console.error);
