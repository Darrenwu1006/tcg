/**
 * 技能執行器
 * Skill Executor - Executes skill effects
 */

import { EngineGameState, getPlayerState, addLog } from "./GameState";
import { Player, getOpponent } from "./Actions";
import {
  CharacterSkill,
  EventSkill,
  SkillEffect,
  SkillExecutionResult,
  AppliedEffect,
} from "./SkillTypes";
import { canPayCost, payCost } from "./CostChecker";
import { Card } from "../state/Store";

/**
 * 檢查技能觸發條件
 */
export function checkTriggerCondition(
  state: EngineGameState,
  player: Player,
  condition: string | undefined
): boolean {
  if (!condition || condition === "" || condition === "none") {
    return true;
  }

  const playerState = getPlayerState(state, player);
  const opponentState = getPlayerState(state, getOpponent(player));

  // 支援多重條件 (逗號分隔)
  const conditions = condition.split(",").map((c) => c.trim());

  for (const cond of conditions) {
    if (cond === "none") continue;

    // 1. 手牌數量條件
    if (cond.startsWith("hand_count_under:")) {
      const threshold = parseInt(cond.split(":")[1]);
      if (playerState.hand.length > threshold) return false;
    } else if (cond.startsWith("hand_count_over:")) {
      const threshold = parseInt(cond.split(":")[1]);
      if (playerState.hand.length < threshold) return false;
    }

    // 2. OP 條件
    else if (cond.startsWith("op_under:")) {
      const threshold = parseInt(cond.split(":")[1]);
      if (opponentState.currentOP > threshold) return false;
    } else if (cond.startsWith("op_over:")) {
      const threshold = parseInt(cond.split(":")[1]);
      if (opponentState.currentOP < threshold) return false;
    }

    // 3. 學校檢查
    else if (cond.startsWith("all_characters_school:")) {
      const school = cond.split(":")[1];
      const allFieldCards = playerState.field.filter(
        (c) => c.type === "CHARACTER"
      );
      if (allFieldCards.length > 0) {
        const allSameSchool = allFieldCards.every((c) => c.school === school);
        if (!allSameSchool) {
          console.log(
            `[Skill] School check failed: not all characters are ${school}`
          );
          return false;
        }
      }
    }

    // 4. Guts 奇數檢查
    else if (cond === "guts_is_odd") {
      const attackZoneGuts = playerState.field.filter(
        (c) => c.position === "guts" || c.position === "attack"
      );
      let totalGuts = 0;
      for (const card of attackZoneGuts) {
        if (card.stats) {
          const guts =
            (card.stats.serve || 0) +
            (card.stats.block || 0) +
            (card.stats.receive || 0) +
            (card.stats.toss || 0) +
            (card.stats.attack || 0);
          totalGuts += guts;
        }
      }
      if (totalGuts % 2 !== 1) {
        console.log(`[Skill] Guts odd check failed: totalGuts=${totalGuts}`);
        return false;
      }
    }

    // 5. 角色名稱檢查
    else if (cond.startsWith("character_is:")) {
      const targetName = cond.split(":")[1];
      let matchFound = false;
      // 檢查場上任何位置是否有該角色
      // 這裡的邏輯可能需要根據具體技能調整，目前假設只要場上有就行
      // 或者更嚴格地檢查發球/托球/接球/攻擊位置
      const fieldCards = playerState.field.filter((c) =>
        ["serve", "toss", "receive", "attack", "block"].includes(
          c.position || ""
        )
      );
      if (fieldCards.some((c) => c.name === targetName)) {
        matchFound = true;
      }
      if (!matchFound) return false;
    }

    // 6. Stack On (此角色登場於...之上)
    else if (cond.startsWith("stack_on:")) {
      const targetName = cond.split(":")[1];
      console.log(`[Skill] Checking stack_on ${targetName}`);
      // 簡化檢查：場上是否有該名稱的 Guts 或角色
      const hasTarget = playerState.field.some((c) => c.name === targetName);
      if (!hasTarget) return false;
    }

    // 7. Stack On Self (在...之上登場)
    else if (cond.startsWith("stack_on_self:")) {
      // 暫時通過，需上下文
      console.log(`[Skill] stack_on_self check passed`);
    }

    // 8. Stack On Self School
    else if (cond.startsWith("stack_on_self_school:")) {
      // 暫時通過，需上下文
      console.log(`[Skill] stack_on_self_school check passed`);
    }

    // 9. Toss Point
    else if (cond.startsWith("toss_point_over:")) {
      const threshold = parseInt(cond.split(":")[1]);
      const tossCard = playerState.field.find((c) => c.position === "toss");
      const currentTossPoint = tossCard?.stats?.toss || 0;
      if (currentTossPoint <= threshold) {
        console.log(
          `[Skill] Toss point check failed: ${currentTossPoint} <= ${threshold}`
        );
        return false;
      }
    }

    // 10. 第一回合檢查
    else if (cond === "is_first_turn") {
      if (!state.isFirstTurn) return false;
    }

    // 11. 發球回合檢查
    else if (cond === "is_serve_turn") {
      if (!state.isFromServe) return false;
    }

    // 未知條件
    else {
      console.warn(`[Skill] Unknown condition: ${cond}`);
    }
  }

  return true;
}

/**
 * 檢查技能是否可用
 */
export function isSkillAvailable(
  state: EngineGameState,
  player: Player,
  skill: CharacterSkill | EventSkill
): { available: boolean; reason?: string } {
  // 檢查費用
  const costCheck = canPayCost(state, player, skill.cost);
  if (!costCheck.available) {
    return costCheck;
  }

  // 檢查觸發條件
  if (!checkTriggerCondition(state, player, skill.trigger.condition)) {
    return { available: false, reason: "Condition not met" };
  }

  return { available: true };
}

/**
 * 執行技能
 */
export function executeSkill(
  state: EngineGameState,
  player: Player,
  skill: CharacterSkill | EventSkill,
  targetCard?: Card
): SkillExecutionResult {
  // 檢查可用性
  const availability = isSkillAvailable(state, player, skill);
  if (!availability.available) {
    return { success: false, error: availability.reason };
  }

  // 支付費用
  if (!payCost(state, player, skill.cost)) {
    return { success: false, error: "Failed to pay cost" };
  }

  // 執行所有效果
  const appliedEffects: AppliedEffect[] = [];

  // 按 order 排序效果
  const sortedEffects = [...skill.effects].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  for (const effect of sortedEffects) {
    const result = executeEffect(state, player, effect, targetCard);
    if (result) {
      appliedEffects.push(result);
    }
  }

  addLog(
    state,
    `${player === "me" ? "我方" : "對手"} 使用技能 ${skill.cardName}`
  );

  return { success: true, effects: appliedEffects };
}

/**
 * 執行單個效果
 */
function executeEffect(
  state: EngineGameState,
  player: Player,
  effect: SkillEffect,
  targetCard?: Card
): AppliedEffect | null {
  const effectType = effect.type.toLowerCase();

  switch (effectType) {
    case "stat_boost":
      return executeStatBoost(state, player, effect, targetCard);

    case "draw":
      return executeDraw(state, player, effect);

    case "discard":
      return executeDiscard(state, player, effect);

    case "search":
      return executeSearch(state, player, effect);

    case "retrieve":
      return executeRetrieve(state, player, effect);

    case "special":
      return executeSpecial(state, player, effect);

    default:
      console.warn(`Unknown effect type: ${effect.type}`);
      return null;
  }
}

/**
 * 執行數值加成效果
 */
function executeStatBoost(
  state: EngineGameState,
  player: Player,
  effect: SkillEffect,
  targetCard?: Card
): AppliedEffect | null {
  const playerState = getPlayerState(state, player);
  const opponentState = getPlayerState(state, getOpponent(player));

  // 解析數值
  let value = 0;
  if (typeof effect.value === "number") {
    value = effect.value;
  } else if (typeof effect.value === "string") {
    // 處理 "+2" 或 "-1" 格式
    value = parseInt(effect.value.replace("+", "")) || 0;
  }

  // 確定目標
  let target: "me" | "opponent" | null = null;
  if (effect.target === "self" || effect.target === "自己") {
    target = player;
  } else if (effect.target === "opponent" || effect.target === "對手") {
    target = getOpponent(player);
  }

  // 確定要修改的數值
  const stat = effect.stat?.toLowerCase() || "";

  // 找到目標角色（優先使用傳入的 targetCard）
  let card: Card | undefined = targetCard;

  if (!card && target) {
    const targetState = target === player ? playerState : opponentState;

    // 根據 stat 找對應位置的角色
    if (stat === "serve") {
      card = targetState.field.find((c) => c.position === "serve");
    } else if (stat === "block" || stat === "攔網") {
      card = targetState.field.find(
        (c) => c.position === "block" || c.position === "guts"
      );
    } else if (stat === "receive" || stat === "接球") {
      card = targetState.field.find((c) => c.position === "receive");
    } else if (stat === "toss" || stat === "托球" || stat === "舉球") {
      card = targetState.field.find((c) => c.position === "toss");
    } else if (stat === "attack" || stat === "攻擊") {
      card = targetState.field.find((c) => c.position === "attack");
    } else {
      // 如果沒有特定 stat，使用場上最後一張卡
      card = targetState.field[targetState.field.length - 1];
    }
  }

  if (!card || !card.stats) {
    return null;
  }

  // 應用數值修改
  if (stat === "serve" && card.stats.serve !== null) {
    card.stats.serve += value;
    playerState.currentOP += value; // 同步更新 OP
  } else if (
    (stat === "block" || stat === "攔網") &&
    card.stats.block !== null
  ) {
    card.stats.block += value;
    playerState.currentDP += value; // 同步更新 DP
  } else if (
    (stat === "receive" || stat === "接球") &&
    card.stats.receive !== null
  ) {
    card.stats.receive += value;
    playerState.currentDP += value;
  } else if (
    (stat === "toss" || stat === "托球" || stat === "舉球") &&
    card.stats.toss !== null
  ) {
    card.stats.toss += value;
  } else if (
    (stat === "attack" || stat === "攻擊") &&
    card.stats.attack !== null
  ) {
    card.stats.attack += value;
    playerState.currentOP += value;
  }

  const description = `${card.name} ${stat} ${value >= 0 ? "+" : ""}${value}`;
  addLog(state, description);

  return {
    type: "stat_boost",
    target: card.name,
    value: value,
    description: description,
  };
}

/**
 * 執行抽牌效果
 */
function executeDraw(
  state: EngineGameState,
  player: Player,
  effect: SkillEffect
): AppliedEffect | null {
  const playerState = getPlayerState(state, player);

  // 解析抽牌數量
  let amount = 1;
  if (typeof effect.amount === "number") {
    amount = effect.amount;
  } else if (typeof effect.value === "number") {
    amount = effect.value;
  } else if (typeof effect.value === "string") {
    const match = effect.value.match(/(\d+)/);
    if (match) {
      amount = parseInt(match[1]);
    }
  }

  // 抽牌
  let drawn = 0;
  for (let i = 0; i < amount && playerState.deck.length > 0; i++) {
    const card = playerState.deck.pop();
    if (card) {
      card.position = undefined;
      playerState.hand.push(card);
      drawn++;
    }
  }

  if (drawn > 0) {
    const description = `抽 ${drawn} 張卡`;
    addLog(state, `${player === "me" ? "我方" : "對手"} ${description}`);

    return {
      type: "draw",
      target: "hand",
      value: drawn,
      description: description,
    };
  }

  return null;
}

/**
 * 執行棄牌效果
 */
function executeDiscard(
  state: EngineGameState,
  player: Player,
  effect: SkillEffect
): AppliedEffect | null {
  // 確定目標玩家
  let targetPlayer = player;
  if (effect.target === "opponent" || effect.target === "對手") {
    targetPlayer = getOpponent(player);
  }

  const targetState = getPlayerState(state, targetPlayer);

  // 解析棄牌數量
  let amount = 1;
  if (typeof effect.amount === "number") {
    amount = effect.amount;
  } else if (typeof effect.value === "number") {
    amount = effect.value;
  }

  // 檢查條件
  if (effect.condition) {
    const conditionLower = effect.condition.toLowerCase();
    if (conditionLower.includes("手牌") && conditionLower.includes("以上")) {
      const match = effect.condition.match(/(\d+)/);
      if (match) {
        const threshold = parseInt(match[1]);
        if (targetState.hand.length < threshold) {
          return null; // 條件不滿足
        }
      }
    }
  }

  // 執行棄牌（簡化：從手牌末端棄）
  let discarded = 0;
  for (let i = 0; i < amount && targetState.hand.length > 0; i++) {
    const card = targetState.hand.pop();
    if (card) {
      card.position = undefined;
      targetState.drop.push(card);
      discarded++;
    }
  }

  if (discarded > 0) {
    const description = `棄 ${discarded} 張卡`;
    addLog(state, `${targetPlayer === "me" ? "我方" : "對手"} ${description}`);

    return {
      type: "discard",
      target: targetPlayer,
      value: discarded,
      description: description,
    };
  }

  return null;
}

/**
 * 執行搜尋效果
 * 從牌組搜尋符合條件的卡片加入手牌
 */
function executeSearch(
  state: EngineGameState,
  player: Player,
  effect: SkillEffect
): AppliedEffect | null {
  const playerState = getPlayerState(state, player);

  // 解析搜尋條件
  const filter = effect.filter || effect.card || "";
  const from = effect.from || "deck";
  // const amount = effect.amount || 1; // Unused

  let sourceArray: Card[] = [];
  if (from.includes("deck")) {
    sourceArray = playerState.deck;
  } else if (from.includes("drop") || from.includes("discard")) {
    sourceArray = playerState.drop;
  }

  // 搜尋符合條件的卡片
  let found: Card | undefined;
  if (filter) {
    const filterLower = filter.toLowerCase();
    const index = sourceArray.findIndex(
      (c) =>
        c.name.toLowerCase().includes(filterLower) ||
        c.id.toLowerCase().includes(filterLower)
    );
    if (index !== -1) {
      found = sourceArray.splice(index, 1)[0];
    }
  } else {
    // 沒有指定條件，從頂端拿一張
    found = sourceArray.pop();
  }

  if (found) {
    found.position = undefined;
    playerState.hand.push(found);

    const description = `搜尋獲得 ${found.name}`;
    addLog(state, `${player === "me" ? "我方" : "對手"} ${description}`);

    return {
      type: "search",
      target: "hand",
      value: 1,
      description: description,
    };
  }

  return null;
}

/**
 * 執行回收效果
 * 從棄牌區將卡片加入手牌
 */
function executeRetrieve(
  state: EngineGameState,
  player: Player,
  effect: SkillEffect
): AppliedEffect | null {
  const playerState = getPlayerState(state, player);

  // 從棄牌區回收
  const filter = effect.filter || "";
  const amount = effect.amount || 1;

  let retrieved = 0;
  for (let i = 0; i < amount && playerState.drop.length > 0; i++) {
    let found: Card | undefined;

    if (filter) {
      const filterLower = filter.toLowerCase();
      const index = playerState.drop.findIndex(
        (c) =>
          c.name.toLowerCase().includes(filterLower) ||
          (c.school && c.school.toLowerCase().includes(filterLower))
      );
      if (index !== -1) {
        found = playerState.drop.splice(index, 1)[0];
      }
    } else {
      // 沒有指定條件，從棄牌區頂端拿
      found = playerState.drop.pop();
    }

    if (found) {
      found.position = undefined;
      playerState.hand.push(found);
      retrieved++;
    }
  }

  if (retrieved > 0) {
    const description = `從棄牌區回收 ${retrieved} 張卡`;
    addLog(state, `${player === "me" ? "我方" : "對手"} ${description}`);

    return {
      type: "retrieve",
      target: "hand",
      value: retrieved,
      description: description,
    };
  }

  return null;
}

/**
 * 執行特殊效果
 * 處理複雜效果（簡化版：主要處理常見的特殊效果）
 */
function executeSpecial(
  state: EngineGameState,
  player: Player,
  effect: SkillEffect
): AppliedEffect | null {
  const playerState = getPlayerState(state, player);
  const opponentState = getPlayerState(state, getOpponent(player));

  const subtype = effect.subtype || "";
  const value = effect.value || "";
  // const condition = effect.condition || ""; // Unused

  // 處理常見的特殊效果類型

  // 1. 召喚/登場效果
  if (subtype === "summon" || String(value).includes("登場")) {
    // 從指定區域登場角色
    const from = effect.from || "drop";
    const filter = effect.filter || "";

    let sourceArray: Card[] = [];
    if (from.includes("drop") || from.includes("discard")) {
      sourceArray = playerState.drop;
    } else if (from.includes("hand")) {
      sourceArray = playerState.hand;
    }

    if (filter && sourceArray.length > 0) {
      const filterLower = filter.toLowerCase();
      const index = sourceArray.findIndex((c) =>
        c.name.toLowerCase().includes(filterLower)
      );
      if (index !== -1) {
        const card = sourceArray.splice(index, 1)[0];
        card.position = effect.to || "attack";
        playerState.field.push(card);

        const description = `特殊召喚 ${card.name}`;
        addLog(state, `${player === "me" ? "我方" : "對手"} ${description}`);

        return {
          type: "special",
          target: card.name,
          value: 1,
          description: description,
        };
      }
    }
  }

  // 2. 限制效果（標記但不實際執行）
  if (
    subtype === "restrict" ||
    String(value).includes("無法") ||
    String(value).includes("不能")
  ) {
    // 記錄限制效果（簡化：僅記錄日誌）
    const description = `施加限制: ${String(value).substring(0, 30)}...`;
    addLog(state, `${player === "me" ? "我方" : "對手"} ${description}`);

    return {
      type: "special",
      target: "restriction",
      value: String(value),
      description: description,
    };
  }

  // 3. OP/DP 修改效果
  if (String(value).includes("點數") || effect.stat) {
    const statMatch = String(value).match(/([+-]?\d+)/);
    if (statMatch) {
      const modifier = parseInt(statMatch[1]);
      if (effect.target === "opponent") {
        opponentState.currentOP += modifier;
      } else {
        playerState.currentOP += modifier;
      }

      const description = `OP ${modifier >= 0 ? "+" : ""}${modifier}`;
      addLog(state, description);

      return {
        type: "special",
        target: "OP",
        value: modifier,
        description: description,
      };
    }
  }

  // 4. 其他未處理的特殊效果
  // 暫時記錄日誌但不實際執行
  if (value) {
    const shortValue = String(value).substring(0, 50);
    addLog(state, `特殊效果: ${shortValue}...`);

    return {
      type: "special",
      target: "unknown",
      value: String(value),
      description: `特殊效果執行`,
    };
  }

  return null;
}
