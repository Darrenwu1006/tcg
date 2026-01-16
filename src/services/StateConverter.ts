/**
 * State Converter
 * 狀態轉換器 - 將 EngineGameState 轉換為 AppState 供 UI 渲染
 *
 * 設計為可複用模組，未來可整合到現有 UI
 */

import { EngineGameState, EnginePlayerState } from "../engine/GameState";
import { GamePhase } from "../engine/Actions";
import { AppState, PlayerState, Card } from "../state/Store";

/**
 * 將引擎遊戲階段轉換為 UI 階段
 */
function mapPhaseToUI(phase: GamePhase): "draw" | "main" | "battle" | "end" {
  switch (phase) {
    case "setup":
    case "serve":
      return "draw";
    case "block":
    case "receive":
    case "toss":
    case "attack":
      return "battle";
    case "draw":
    case "start":
      return "draw";
    case "end":
      return "end";
    default:
      return "main";
  }
}

/**
 * 將引擎玩家狀態轉換為 UI 玩家狀態
 */
function convertPlayerState(enginePlayer: EnginePlayerState): PlayerState {
  return {
    deck: [...enginePlayer.deck],
    hand: [...enginePlayer.hand],
    set: [...enginePlayer.set],
    drop: [...enginePlayer.drop],
    field: [...enginePlayer.field],
    school: enginePlayer.school,
    currentStats: {
      serve: 0,
      block: 0,
      receive: 0,
      toss: 0,
      attack: 0,
    },
  };
}

/**
 * 將 EngineGameState 轉換為 Partial<AppState>
 * 只更新與遊戲邏輯相關的部分，保留 UI 專屬狀態
 */
export function engineToAppState(
  engineState: EngineGameState
): Partial<AppState> {
  return {
    gamePhase: engineState.gameOver ? "playing" : "playing",
    turnPlayer: engineState.turnPlayer,
    phase: mapPhaseToUI(engineState.phase),
    me: convertPlayerState(engineState.me),
    opponent: convertPlayerState(engineState.opponent),
    logs: [...engineState.logs],
    battleState: {
      isAttacking: engineState.phase === "attack",
      defenseChoice:
        engineState.defenseChoice === "block"
          ? "block"
          : engineState.defenseChoice === "receive"
          ? "receive"
          : "none",
      attacker: engineState.turnPlayer,
    },
    winCount: { ...engineState.setWins },
    matchWinner: engineState.winner,
  };
}

/**
 * 獲取當前階段的中文描述
 */
export function getPhaseDescription(phase: GamePhase): string {
  const phaseMap: Record<GamePhase, string> = {
    setup: "調整手牌",
    serve: "發球",
    block: "攔網",
    receive: "接球",
    toss: "托球",
    attack: "攻擊",
    draw: "抽牌",
    start: "開始",
    end: "結束",
  };
  return phaseMap[phase] || phase;
}

/**
 * 獲取動作的中文描述
 */
export function getActionDescription(action: {
  type: string;
  card?: Card;
  position?: string;
}): string {
  switch (action.type) {
    case "SERVE":
      return `發球：${action.card?.name || "卡片"}`;
    case "BLOCK":
      return `攔網：${action.card?.name || "卡片"} (${action.position || ""})`;
    case "RECEIVE":
      return `接球：${action.card?.name || "卡片"}`;
    case "TOSS":
      return `托球：${action.card?.name || "卡片"}`;
    case "ATTACK":
      return `攻擊：${action.card?.name || "卡片"}`;
    case "PASS":
      return "PASS";
    case "DECLARE_LOST":
      return "宣告 LOST";
    case "MULLIGAN":
      return "調整手牌";
    case "ACTIVATE_SKILL":
      return `發動技能：${action.card?.name || ""}`;
    case "USE_EVENT":
      return `使用事件：${action.card?.name || ""}`;
    default:
      return action.type;
  }
}
