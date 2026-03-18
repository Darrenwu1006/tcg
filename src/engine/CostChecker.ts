/**
 * 費用檢查器與執行器
 * Cost Checker - Validates and pays skill costs
 */

import { EngineGameState, getPlayerState } from "./GameState";
import { Player } from "./Actions";
import { SkillCost, SkillAvailability } from "./SkillTypes";
import { Card } from "../state/Store";

/**
 * 計算場上可用的 Guts 總數
 * 簡化版：每張場上角色卡提供 2 點 Guts
 */
export function getAvailableGuts(
  state: EngineGameState,
  player: Player
): number {
  const playerState = getPlayerState(state, player);
  let totalGuts = 0;

  // 簡化版：每張場上角色卡提供 2 點 Guts
  for (const card of playerState.field) {
    if (card.type === "CHARACTER") {
      totalGuts += 2; // 簡化：每張卡 2 Guts
    }
  }

  return totalGuts;
}

/**
 * 檢查是否能支付費用
 */
export function canPayCost(
  state: EngineGameState,
  player: Player,
  cost: SkillCost
): SkillAvailability {
  // 無費用
  if (!cost || cost.type === "none" || cost.type === "") {
    return { available: true };
  }

  // 解析費用數量
  const amount =
    typeof cost.amount === "number" ? cost.amount : parseInt(cost.amount) || 0;

  // 處理複合費用類型（如 "guts | discard"）
  const costTypes = cost.type.split("|").map((t) => t.trim().toLowerCase());

  // Guts 費用
  if (costTypes.includes("guts")) {
    const availableGuts = getAvailableGuts(state, player);
    if (availableGuts >= amount) {
      return { available: true };
    }
  }

  // 棄牌費用
  if (costTypes.includes("discard")) {
    const playerState = getPlayerState(state, player);
    if (playerState.hand.length >= amount) {
      return { available: true };
    }
  }

  // 無費用選項
  if (costTypes.includes("none")) {
    return { available: true };
  }

  return {
    available: false,
    reason: `Insufficient cost: need ${amount} ${cost.type}`,
  };
}

/**
 * 支付 Guts 費用
 * 簡化版：從場上移除角色卡到棄牌區
 */
export function payGutsCost(
  state: EngineGameState,
  player: Player,
  amount: number
): boolean {
  if (amount <= 0) return true;

  // 簡化版：每 2 Guts 需要移除一張卡
  // 實際遊戲中 Guts 應該是累積的，但這裡簡化處理
  const playerState = getPlayerState(state, player);

  // 檢查是否有足夠的場上卡片
  const fieldCards = playerState.field.filter((c) => c.type === "CHARACTER");
  if (fieldCards.length * 2 < amount) {
    return false;
  }

  // 簡化：標記已支付（不實際移除卡片，避免破壞遊戲邏輯）
  // TODO: 實現真正的 Guts 支付機制
  return true;
}

/**
 * 支付棄牌費用
 * 簡化版：自動從手牌末端棄牌
 */
export function payDiscardCost(
  state: EngineGameState,
  player: Player,
  amount: number
): Card[] {
  if (amount <= 0) return [];

  const playerState = getPlayerState(state, player);
  const discarded: Card[] = [];

  // 簡化版：從手牌末端棄牌
  // TODO: 如果有 condition，應該過濾符合條件的卡
  for (let i = 0; i < amount && playerState.hand.length > 0; i++) {
    const card = playerState.hand.pop();
    if (card) {
      card.position = undefined;
      playerState.drop.push(card);
      discarded.push(card);
    }
  }

  return discarded;
}

/**
 * 支付費用
 */
export function payCost(
  state: EngineGameState,
  player: Player,
  cost: SkillCost
): boolean {
  if (!cost || cost.type === "none" || cost.type === "") {
    return true;
  }

  const amount =
    typeof cost.amount === "number" ? cost.amount : parseInt(cost.amount) || 0;

  const costTypes = cost.type.split("|").map((t) => t.trim().toLowerCase());

  // 優先使用 Guts
  if (costTypes.includes("guts")) {
    const availableGuts = getAvailableGuts(state, player);
    if (availableGuts >= amount) {
      return payGutsCost(state, player, amount);
    }
  }

  // 其次使用棄牌
  if (costTypes.includes("discard")) {
    const playerState = getPlayerState(state, player);
    if (playerState.hand.length >= amount) {
      payDiscardCost(state, player, amount);
      return true;
    }
  }

  // 無費用
  if (costTypes.includes("none")) {
    return true;
  }

  return false;
}
