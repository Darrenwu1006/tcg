/**
 * Debug 技能循環問題 - 找出問題卡片
 */

import { GameEngine } from "../src/engine/GameEngine";
import { HeuristicAI } from "../src/engine/HeuristicAI";
import { initializeSkills } from "../src/engine/SkillLoader";
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

  const charPath = path.join(process.cwd(), "public/pool/All_Characters.csv");
  if (fs.existsSync(charPath)) {
    const lines = fs.readFileSync(charPath, "utf-8").split("\n");
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      const id = parts[2]?.trim();
      if (!id) continue;
      pool.set(id, {
        id,
        name: parts[3]?.trim(),
        type: "CHARACTER",
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

  const eventPath = path.join(process.cwd(), "public/pool/All_Events.csv");
  if (fs.existsSync(eventPath)) {
    const lines = fs.readFileSync(eventPath, "utf-8").split("\n");
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
      const id = parts[2]?.trim();
      if (!id) continue;
      pool.set(id, {
        id,
        name: parts[3]?.trim(),
        type: "EVENT",
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

function loadDeck(deckPath: string, pool: Map<string, any>): any[] {
  const lines = fs
    .readFileSync(path.join(process.cwd(), deckPath), "utf-8")
    .split("\n");
  const deck: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    const id = parts[1]?.trim();
    const count = parseInt(parts[2]?.trim() || "1");
    const cardData = pool.get(id);
    for (let j = 0; j < count; j++) {
      if (cardData) deck.push({ ...cardData, instanceId: crypto.randomUUID() });
    }
  }
  return deck;
}

async function debug() {
  await initializeSkills();

  const pool = loadCardPool();
  const deck1 = loadDeck("src/assets/decks/青葉城西/快攻軸.csv", pool);
  const deck2 = loadDeck("src/assets/decks/烏野/日影攻擊軸.csv", pool);

  console.log("=== Debug 技能循環問題 ===\n");

  const engine = new GameEngine([...deck1], [...deck2], "me");
  const ai = new HeuristicAI(0);

  const skillUsage = new Map<string, number>();
  let skillCount = 0;

  for (let i = 0; i < 50; i++) {
    const state = engine.getState();
    const action = ai.selectAction(state, state.turnPlayer);

    // 追蹤技能使用
    if (action.type === "USE_EVENT" || action.type === "ACTIVATE_SKILL") {
      skillCount++;
      const cardId = action.cardInstanceId;

      // 找出卡片名稱
      let cardName = "未知";
      const playerState = state.turnPlayer === "me" ? state.me : state.opponent;
      const handCard = playerState.hand.find((c) => c.instanceId === cardId);
      const fieldCard = playerState.field.find((c) => c.instanceId === cardId);
      const card = handCard || fieldCard;
      if (card) {
        cardName = `${card.name} (${card.id})`;
      }

      const key = `${action.type}: ${cardName}`;
      skillUsage.set(key, (skillUsage.get(key) || 0) + 1);

      console.log(`[${i}] ${state.phase} | ${action.type} -> ${cardName}`);
    } else {
      console.log(`[${i}] ${state.phase} | ${action.type}`);
    }

    const result = engine.executeAction(action);
    if (!result.success) {
      console.log(`    ❌ 執行失敗: ${result.error}`);
    }

    if (engine.isGameOver()) {
      console.log("\n遊戲結束！");
      break;
    }

    // 如果技能使用超過 20 次，輸出統計
    if (skillCount >= 20) {
      console.log("\n⚠️ 技能使用已達 20 次，停止");
      break;
    }
  }

  console.log("\n=== 技能使用統計 ===");
  const sorted = [...skillUsage.entries()].sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    console.log(`  ${key}: ${count} 次`);
  }
}

debug();
