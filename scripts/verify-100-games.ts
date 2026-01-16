/**
 * 100-Game Verification Match Script
 * Aoba Johsai Fast Attack vs Fukurodani High Burst
 * 50 Games Me First, 50 Games Opponent First
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

// --- Shared Utility Functions ---

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

async function runBattleWithOrder(
  ai1: any,
  ai2: any,
  deck1: Card[],
  deck2: Card[],
  firstPlayer: Player,
  matchName: string
): Promise<Player | "draw"> {
  // console.log(`Starting Match: ${matchName}`);

  if (deck1.length < 40 || deck2.length < 40) {
    console.error("Error: Deck size must be at least 40");
    return "draw";
  }

  const engine = new GameEngine([...deck1], [...deck2], firstPlayer);
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
      return player === "me" ? "opponent" : "me";
    }
    turns++;
  }

  const winner = engine.getWinner();
  // console.log(`Match Ended in ${turns} turns. Winner: ${winner || "Draw"}`);
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

  const oppDeckPath = "src/assets/decks/梟谷/高爆發軸.csv";
  const oppDeck = loadDeck(oppDeckPath, cardPool);

  if (myDeck.length === 0 || oppDeck.length === 0) {
    console.error("Failed to load decks");
    return;
  }

  // Both sides use MCTS with 200 simulations
  const mctsAI_Me = new MCTSAI("me", 200, MCTSLogLevel.SILENT);
  const mctsAI_Opponent = new MCTSAI("opponent", 200, MCTSLogLevel.SILENT);

  console.log(
    "\n=== 100-Game Verification Match: Aoba Johsai vs Fukurodani ==="
  );
  console.log("Configuration: MCTS (200 sims) vs MCTS (200 sims)");
  console.log("Progress will be shown every 10 games.\n");

  let meWins = 0;
  let oppWins = 0;
  let draws = 0;

  const totalGames = 100;
  const halfGames = totalGames / 2;

  // Part 1: Me First (50 games)
  console.log("--- Part 1: Aoba Johsai (Me) goes First (50 games) ---");
  for (let i = 0; i < halfGames; i++) {
    const result = await runBattleWithOrder(
      mctsAI_Me,
      mctsAI_Opponent,
      myDeck,
      oppDeck,
      "me",
      `Game ${i + 1}`
    );

    if (result === "me") meWins++;
    else if (result === "opponent") oppWins++;
    else draws++;

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`Completed ${i + 1}/${halfGames} games...\r`);
    }
  }
  console.log(
    `\nPart 1 Result: Me ${meWins} - ${oppWins} Opponent (Draws: ${draws})`
  );

  // Part 2: Opponent First (50 games)
  console.log("\n--- Part 2: Fukurodani (Opponent) goes First (50 games) ---");
  let part2MeWins = 0;
  let part2OppWins = 0;
  let part2Draws = 0;

  for (let i = 0; i < halfGames; i++) {
    const result = await runBattleWithOrder(
      mctsAI_Me,
      mctsAI_Opponent,
      myDeck,
      oppDeck,
      "opponent",
      `Game ${i + 1}`
    );

    if (result === "me") part2MeWins++;
    else if (result === "opponent") part2OppWins++;
    else part2Draws++;

    if ((i + 1) % 10 === 0) {
      process.stdout.write(`Completed ${i + 1}/${halfGames} games...\r`);
    }
  }
  console.log(
    `\nPart 2 Result: Me ${part2MeWins} - ${part2OppWins} Opponent (Draws: ${part2Draws})`
  );

  // Final Summary
  const totalMeWins = meWins + part2MeWins;
  const totalOppWins = oppWins + part2OppWins;
  const totalDraws = draws + part2Draws;

  console.log("\n=== Final Results (100 Games) ===");
  console.log(`Aoba Johsai (Me): ${totalMeWins} wins (${totalMeWins}%)`);
  console.log(`Fukurodani (Opponent): ${totalOppWins} wins (${totalOppWins}%)`);
  console.log(`Draws: ${totalDraws}`);
}

main().catch(console.error);
