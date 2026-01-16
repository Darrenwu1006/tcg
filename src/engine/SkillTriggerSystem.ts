/**
 * 技能觸發系統
 * Skill Trigger System - Handles automatic skill activation based on phase timing
 */

import {
  EngineGameState,
  getPlayerState,
  addLog,
  ActiveEffect,
} from "./GameState";
import { Player, GamePhase } from "./Actions";
import { getCharacterSkill } from "./SkillLoader";
import { isSkillAvailable, executeSkill } from "./SkillExecutor";
import { Card } from "../state/Store";

// ============================================================================
// 階段與時機映射
// ============================================================================

/**
 * 將遊戲階段映射到技能時機
 */
export const phaseToTiming: Record<GamePhase, string[]> = {
  setup: [],
  serve: ["發球", "serve", "登場時"],
  start: ["開始", "start"],
  block: ["攔網", "block", "登場時"],
  draw: ["抽牌", "draw"],
  receive: ["接球", "receive", "登場時"],
  toss: ["托球", "舉球", "toss", "登場時"],
  attack: ["攻擊", "attack", "登場時"],
  end: ["結束", "end", "回合結束"],
};

/**
 * 檢查技能時機是否匹配當前階段
 */
export function matchesTiming(skillTiming: string, phase: GamePhase): boolean {
  const validTimings = phaseToTiming[phase] || [];

  // 技能時機可能是逗號分隔的多個時機
  const skillTimings = skillTiming
    .split(",")
    .map((t) => t.trim().toLowerCase());

  for (const timing of skillTimings) {
    // 檢查是否匹配任一有效時機
    for (const valid of validTimings) {
      if (timing.includes(valid.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

// ============================================================================
// 觸發技能
// ============================================================================

/**
 * 觸發指定玩家場上角色的技能（階段開始時）
 */
export function triggerPhaseSkills(
  state: EngineGameState,
  player: Player,
  phase: GamePhase
): void {
  const playerState = getPlayerState(state, player);

  // 遍歷場上所有角色
  for (const card of playerState.field) {
    if (card.type !== "CHARACTER") continue;

    // 獲取角色技能
    const skill = getCharacterSkill(card.id);
    if (!skill) continue;

    // 檢查技能時機是否匹配
    if (!matchesTiming(skill.timing, phase)) continue;

    // 檢查是否滿足自動觸發條件
    // 自動觸發的技能通常是無費用或標記為自動的
    const isAutoTrigger =
      skill.cost.type === "none" ||
      skill.cost.type === "" ||
      (typeof skill.cost.amount === "number" && skill.cost.amount === 0) ||
      skill.trigger.timing === "auto";

    if (!isAutoTrigger) continue;

    // 檢查技能是否可用
    const availability = isSkillAvailable(state, player, skill);
    if (!availability.available) continue;

    // 執行技能
    const result = executeSkill(state, player, skill, card);
    if (result.success) {
      addLog(
        state,
        `${card.name} 自動發動技能: ${skill.originalText.substring(0, 30)}...`
      );
    }
  }
}

/**
 * 觸發登場時技能（角色剛放到場上時）
 */
export function triggerOnPlaySkill(
  state: EngineGameState,
  player: Player,
  card: Card
): void {
  if (card.type !== "CHARACTER") return;

  const skill = getCharacterSkill(card.id);
  if (!skill) return;

  // 檢查是否有登場時觸發
  const hasOnPlayTiming =
    skill.timing.includes("登場") || skill.trigger.timing === "on_play";

  if (!hasOnPlayTiming) return;

  // 自動觸發的登場技能（無費用）
  const isAutoTrigger =
    skill.cost.type === "none" ||
    skill.cost.type === "" ||
    (typeof skill.cost.amount === "number" && skill.cost.amount === 0);

  if (!isAutoTrigger) return;

  // 檢查技能是否可用
  const availability = isSkillAvailable(state, player, skill);
  if (!availability.available) return;

  // 執行技能
  const result = executeSkill(state, player, skill, card);
  if (result.success) {
    addLog(state, `${card.name} 登場技能發動!`);
  }
}

// ============================================================================
// 持續效果應用
// ============================================================================

/**
 * 應用持續效果到角色
 */
export function applyActiveEffects(state: EngineGameState): void {
  // 遍歷所有持續效果
  for (const effect of state.activeEffects) {
    if (effect.type !== "stat_modifier") continue;

    // 獲取目標玩家
    const targets: Player[] =
      effect.target === "all" ? ["me", "opponent"] : [effect.target as Player];

    for (const player of targets) {
      const playerState = getPlayerState(state, player);

      // 應用數值修改
      for (const card of playerState.field) {
        if (!card.stats) continue;

        switch (effect.stat) {
          case "attack":
            if (card.stats.attack !== null) {
              card.stats.attack += effect.value || 0;
            }
            break;
          case "block":
            if (card.stats.block !== null) {
              card.stats.block += effect.value || 0;
            }
            break;
          case "receive":
            if (card.stats.receive !== null) {
              card.stats.receive += effect.value || 0;
            }
            break;
          case "toss":
            if (card.stats.toss !== null) {
              card.stats.toss += effect.value || 0;
            }
            break;
          case "serve":
            if (card.stats.serve !== null) {
              card.stats.serve += effect.value || 0;
            }
            break;
        }
      }
    }
  }
}

/**
 * 添加持續效果
 */
export function addActiveEffect(
  state: EngineGameState,
  source: string,
  target: Player | "all",
  stat: string,
  value: number,
  duration: "turn" | "set" | "permanent",
  description: string
): void {
  const effect: ActiveEffect = {
    source,
    target,
    type: "stat_modifier",
    stat,
    value,
    duration,
    description,
  };

  state.activeEffects.push(effect);
  addLog(state, `持續效果: ${description}`);
}

/**
 * 添加限制效果
 */
export function addRestriction(
  state: EngineGameState,
  source: string,
  target: Player | "all",
  description: string,
  duration: "turn" | "set" | "permanent"
): void {
  const effect: ActiveEffect = {
    source,
    target,
    type: "restriction",
    duration,
    description,
  };

  state.activeEffects.push(effect);
  addLog(state, `限制效果: ${description}`);
}

/**
 * 檢查是否有特定限制
 */
export function hasRestriction(
  state: EngineGameState,
  player: Player,
  keyword: string
): boolean {
  return state.activeEffects.some(
    (effect) =>
      effect.type === "restriction" &&
      (effect.target === player || effect.target === "all") &&
      effect.description.includes(keyword)
  );
}
