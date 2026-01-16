/**
 * 🔍 Debug 對局採樣器 (修正版)
 * 使用真實卡片資料，輸出詳細的對局流程供人工檢閱
 */

import { GameEngine } from "../src/engine/GameEngine";
import { GameAction, Player } from "../src/engine/Actions";
import { Card } from "../src/state/Store";
import {
  initializeSkills,
  getCharacterSkill,
  getEventSkill,
} from "../src/engine/SkillLoader";
import * as fs from "fs";
import * as path from "path";

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
          instanceId: crypto.randomUUID(),
        });
      } else {
        console.warn(`⚠️ 找不到卡片: ${id} (${name})`);
      }
    }
  }

  return deck;
}

// 格式化卡片資訊
function formatCard(card: Card, stat?: string): string {
  if (!card) return "???";
  const typeLabel = card.type === "EVENT" ? "[事件]" : "";

  let statValue = "";
  if (stat && card.stats) {
    const s = card.stats as any;
    if (stat === "serve" && s.serve !== null) statValue = ` (發球:${s.serve})`;
    if (stat === "block" && s.block !== null) statValue = ` (攔網:${s.block})`;
    if (stat === "receive" && s.receive !== null)
      statValue = ` (接球:${s.receive})`;
    if (stat === "toss" && s.toss !== null) statValue = ` (托球:${s.toss})`;
    if (stat === "attack" && s.attack !== null)
      statValue = ` (攻擊:${s.attack})`;
  }

  return `${typeLabel}${card.name}${statValue}`;
}

// 格式化動作 (帶卡片資訊)
function formatActionWithCard(action: GameAction, hand: Card[]): string {
  const findCard = (id: string) => hand.find((c) => c.instanceId === id);

  switch (action.type) {
    case "PLAY_SERVE": {
      const card = findCard(action.cardInstanceId);
      return card ? `發球 ${formatCard(card, "serve")}` : "發球";
    }
    case "CHOOSE_DEFENSE":
      return `選擇防守: ${action.choice === "block" ? "攔網" : "接球"}`;
    case "PLAY_BLOCK": {
      const cards = action.cardInstanceIds
        .map((id) => findCard(id))
        .filter(Boolean);
      const names = cards.map((c) => formatCard(c!, "block")).join(" + ");
      return `攔網 ${names}`;
    }
    case "PLAY_RECEIVE": {
      const card = findCard(action.cardInstanceId);
      return card ? `接球 ${formatCard(card, "receive")}` : "接球";
    }
    case "PLAY_TOSS": {
      const card = findCard(action.cardInstanceId);
      return card ? `托球 ${formatCard(card, "toss")}` : "托球";
    }
    case "PLAY_ATTACK": {
      const card = findCard(action.cardInstanceId);
      return card ? `攻擊 ${formatCard(card, "attack")}` : "攻擊";
    }
    case "PASS":
      return "Pass (自動)";
    case "DECLARE_LOST":
      return "宣告 Lost";
    case "MULLIGAN":
      return `調整手牌 (${action.cardInstanceIds.length} 張)`;
    default:
      return action.type;
  }
}

// 格式化手牌
function formatHand(hand: Card[]): string {
  const chars = hand.filter((c) => c.type === "CHARACTER").length;
  const events = hand.filter((c) => c.type === "EVENT").length;
  return `角色:${chars} 事件:${events}`;
}

// 簡單 AI 選擇動作
function selectAction(actions: GameAction[]): GameAction {
  const nonPass = actions.filter((a) => a.type !== "PASS");
  if (nonPass.length > 0) {
    return nonPass[Math.floor(Math.random() * nonPass.length)];
  }
  return actions[Math.floor(Math.random() * actions.length)];
}

// 運行一場詳細記錄的對局
function runDetailedGame(
  deck1: Card[],
  deck2: Card[],
  gameIndex: number
): string[] {
  const output: string[] = [];
  const engine = new GameEngine([...deck1], [...deck2], "me");

  output.push(`\n${"=".repeat(70)}`);
  output.push(`📍 對局 #${gameIndex + 1}`);
  output.push(`${"=".repeat(70)}`);

  // 顯示初始手牌
  const state0 = engine.getState();
  output.push(`\n初始狀態:`);
  output.push(
    `  我方手牌: ${formatHand(state0.me.hand)} 共 ${state0.me.hand.length} 張`
  );
  output.push(
    `  對手手牌: ${formatHand(state0.opponent.hand)} 共 ${
      state0.opponent.hand.length
    } 張`
  );
  output.push(`  發球權: ${state0.turnPlayer === "me" ? "我方" : "對手"}`);

  // 顯示手牌細節
  output.push(`\n  我方手牌詳細:`);
  state0.me.hand.forEach((c, i) => {
    output.push(`    ${i + 1}. ${formatCard(c)} [${c.type}]`);
  });

  output.push(`\n${"─".repeat(70)}`);

  let turnCount = 0;
  const maxTurns = 100;

  while (!engine.isGameOver() && turnCount < maxTurns) {
    const state = engine.getState();
    const currentPlayer = state.turnPlayer;
    const playerState = currentPlayer === "me" ? state.me : state.opponent;
    const opponentState = currentPlayer === "me" ? state.opponent : state.me;
    const actions = engine.getLegalActions();

    if (actions.length === 0) {
      output.push(`⚠️ 無合法動作，遊戲停止`);
      break;
    }

    const action = selectAction(actions);

    // 更詳細的狀態
    output.push(
      `\n[Turn ${state.turnCount}] ${
        currentPlayer === "me" ? "▶ 我方" : "◀ 對手"
      } | ${state.phase.toUpperCase()}`
    );
    output.push(
      `  點數: 我方OP=${state.me.currentOP} 對手OP=${state.opponent.currentOP} | 我方DP=${state.me.currentDP} 對手DP=${state.opponent.currentDP}`
    );
    output.push(
      `  手牌: ${formatHand(playerState.hand)} | 場上: ${
        playerState.field.length
      } 張`
    );

    // 可選動作數量
    const actionTypes = [...new Set(actions.map((a) => a.type))];
    output.push(`  可選: ${actionTypes.join(", ")} (${actions.length} 個選項)`);

    // 執行的動作（帶卡片資訊）
    output.push(`  ➤ ${formatActionWithCard(action, playerState.hand)}`);

    // 記錄技能詳細資訊 (ACTIVATE_SKILL 或 USE_EVENT)
    if (action.type === "ACTIVATE_SKILL") {
      const card = playerState.field.find(
        (c) => c.instanceId === action.cardInstanceId
      );
      if (card) {
        const skill = getCharacterSkill(card.id);
        if (skill) {
          output.push(`      📜 技能: ${skill.cardName}`);
          output.push(`      ⏱️ 時機: ${skill.timing}`);
          if (
            skill.cost &&
            skill.cost.type !== "none" &&
            skill.cost.type !== ""
          ) {
            output.push(
              `      💰 費用: ${skill.cost.type} x${skill.cost.amount || 1}`
            );
          }
          skill.effects.forEach((effect, i) => {
            output.push(
              `      🎯 效果${i + 1}: ${effect.type} → ${
                effect.target || "self"
              } (${effect.value || effect.stat || "N/A"})`
            );
          });
        }
      }
    } else if (action.type === "USE_EVENT") {
      const card = playerState.hand.find(
        (c) => c.instanceId === action.cardInstanceId
      );
      if (card) {
        const skill = getEventSkill(card.id);
        if (skill) {
          output.push(`      📜 事件卡: ${skill.cardName}`);
          output.push(`      ⏱️ 時機: ${skill.timing}`);
          if (
            skill.cost &&
            skill.cost.type !== "none" &&
            skill.cost.type !== ""
          ) {
            output.push(
              `      💰 費用: ${skill.cost.type} x${skill.cost.amount || 1}`
            );
          }
          skill.effects.forEach((effect, i) => {
            output.push(
              `      🎯 效果${i + 1}: ${effect.type} → ${
                effect.target || "self"
              } (${effect.value || effect.stat || "N/A"})`
            );
          });
        }
      }
    }

    // 記錄執行前狀態
    const beforeOP = playerState.currentOP;
    const beforeDP = playerState.currentDP;
    const beforeHandSize = playerState.hand.length;

    const result = engine.executeAction(action);

    // 記錄執行後狀態變化 (針對技能)
    if (action.type === "ACTIVATE_SKILL" || action.type === "USE_EVENT") {
      const afterState = engine.getState();
      const afterPlayerState =
        currentPlayer === "me" ? afterState.me : afterState.opponent;

      const opChange = afterPlayerState.currentOP - beforeOP;
      const dpChange = afterPlayerState.currentDP - beforeDP;
      const handChange = afterPlayerState.hand.length - beforeHandSize;

      const changes: string[] = [];
      if (opChange !== 0)
        changes.push(`OP${opChange > 0 ? "+" : ""}${opChange}`);
      if (dpChange !== 0)
        changes.push(`DP${dpChange > 0 ? "+" : ""}${dpChange}`);
      if (handChange !== 0)
        changes.push(`手牌${handChange > 0 ? "+" : ""}${handChange}`);

      if (changes.length > 0) {
        output.push(`      ✨ 效果結果: ${changes.join(", ")}`);
      }
    }

    if (!result.success) {
      output.push(`  ❌ 執行失敗: ${result.error}`);
    }

    turnCount++;
  }

  output.push(`\n${"─".repeat(70)}`);
  const finalState = engine.getState();
  output.push(
    `📊 結果: ${
      engine.getWinner() === "me"
        ? "我方勝利 🎉"
        : engine.getWinner() === "opponent"
        ? "對手勝利"
        : "平手"
    }`
  );
  output.push(`   回合數: ${finalState.turnCount}`);
  output.push(`   我方 Set: ${finalState.me.set.length} 張`);
  output.push(`   對手 Set: ${finalState.opponent.set.length} 張`);

  // 最後 15 條日誌
  output.push(`\n📜 最後 15 條遊戲日誌:`);
  engine
    .getLogs()
    .slice(0, 15)
    .forEach((log) => {
      output.push(`  ${log}`);
    });

  return output;
}

// 測試牌組路徑 - 使用青葉城西來測試棄牌費用技能
const deckPaths = [
  {
    school: "青葉城西",
    name: "快攻軸",
    path: "src/assets/decks/青葉城西/快攻軸.csv",
  },
  {
    school: "青葉城西",
    name: "快攻軸",
    path: "src/assets/decks/青葉城西/快攻軸.csv",
  },
];

// 主程序
async function main() {
  console.log("🔍 開始 Debug 對局採樣...\n");

  // 載入技能資料
  await initializeSkills();

  // 載入卡池
  const cardPool = loadCardPool();

  // 載入牌組（使用真實資料）
  const deck1 = loadDeck(deckPaths[0].path, cardPool);
  const deck2 = loadDeck(deckPaths[1].path, cardPool);

  const charCount1 = deck1.filter((c) => c.type === "CHARACTER").length;
  const eventCount1 = deck1.filter((c) => c.type === "EVENT").length;
  const charCount2 = deck2.filter((c) => c.type === "CHARACTER").length;
  const eventCount2 = deck2.filter((c) => c.type === "EVENT").length;

  console.log(
    `牌組 1: ${deckPaths[0].school}「${deckPaths[0].name}」(角色:${charCount1} 事件:${eventCount1})`
  );
  console.log(
    `牌組 2: ${deckPaths[1].school}「${deckPaths[1].name}」(角色:${charCount2} 事件:${eventCount2})`
  );

  const allOutput: string[] = [];
  const sampleCount = 3;

  for (let i = 0; i < sampleCount; i++) {
    const gameOutput = runDetailedGame(deck1, deck2, i);
    allOutput.push(...gameOutput);
  }

  console.log(allOutput.join("\n"));

  const outputPath = path.join(process.cwd(), "debug_game_samples.txt");
  fs.writeFileSync(outputPath, allOutput.join("\n"), "utf-8");
  console.log(`\n📄 詳細日誌已保存到: ${outputPath}`);
}

main();
