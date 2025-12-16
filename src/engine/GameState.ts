/**
 * 遊戲引擎 - 遊戲狀態
 * Game Engine - Game State
 *
 * 獨立的遊戲狀態管理，不依賴 UI
 */

import { Card, CardStats, PlayerState } from "../state/Store";
import { Player, GamePhase, DefenseChoice } from "./Actions";

/**
 * 引擎專用的玩家狀態
 * 比 UI 版本更精簡，只保留核心遊戲邏輯需要的數據
 */
export interface EnginePlayerState {
  deck: Card[];
  hand: Card[];
  set: Card[]; // Set 區（預設 2 張）
  drop: Card[]; // 棄牌區
  field: Card[]; // 場地上的卡片
  school: string;

  // 當前回合的攻擊/防守點數
  currentOP: number; // Offense Point
  currentDP: number; // Defense Point
}

/**
 * 引擎遊戲狀態
 */
export interface EngineGameState {
  // 基本狀態
  turnPlayer: Player;
  phase: GamePhase;
  turnCount: number;

  // 玩家狀態
  me: EnginePlayerState;
  opponent: EnginePlayerState;

  // 回合狀態
  defenseChoice: DefenseChoice | null;
  servePlayer: Player | null; // 當前發球權

  // 勝負記錄
  setWins: { me: number; opponent: number };

  // 遊戲結束
  gameOver: boolean;
  winner: Player | null;

  // 日誌（用於調試）
  logs: string[];
}

/**
 * 創建初始玩家狀態
 */
export function createInitialPlayerState(
  deck: Card[],
  school: string
): EnginePlayerState {
  return {
    deck: [...deck],
    hand: [],
    set: [],
    drop: [],
    field: [],
    school,
    currentOP: 0,
    currentDP: 0,
  };
}

/**
 * 創建初始遊戲狀態
 */
export function createInitialGameState(
  meDeck: Card[],
  opponentDeck: Card[],
  firstPlayer: Player
): EngineGameState {
  return {
    turnPlayer: firstPlayer,
    phase: "serve",
    turnCount: 0,

    me: createInitialPlayerState(meDeck, "karasuno"),
    opponent: createInitialPlayerState(opponentDeck, "nekoma"),

    defenseChoice: null,
    servePlayer: firstPlayer,

    setWins: { me: 0, opponent: 0 },

    gameOver: false,
    winner: null,

    logs: [],
  };
}

/**
 * 深拷貝遊戲狀態（用於 MCTS 模擬）
 */
export function cloneGameState(state: EngineGameState): EngineGameState {
  return {
    ...state,
    me: {
      ...state.me,
      deck: [...state.me.deck],
      hand: [...state.me.hand],
      set: [...state.me.set],
      drop: [...state.me.drop],
      field: [...state.me.field],
    },
    opponent: {
      ...state.opponent,
      deck: [...state.opponent.deck],
      hand: [...state.opponent.hand],
      set: [...state.opponent.set],
      drop: [...state.opponent.drop],
      field: [...state.opponent.field],
    },
    setWins: { ...state.setWins },
    logs: [...state.logs],
  };
}

/**
 * 添加日誌
 */
export function addLog(state: EngineGameState, message: string): void {
  state.logs.push(`[Turn ${state.turnCount}] ${message}`);
  // 限制日誌數量
  if (state.logs.length > 100) {
    state.logs.shift();
  }
}

/**
 * 獲取玩家狀態
 */
export function getPlayerState(
  state: EngineGameState,
  player: Player
): EnginePlayerState {
  return player === "me" ? state.me : state.opponent;
}

/**
 * 獲取對手
 */
export function getOpponent(player: Player): Player {
  return player === "me" ? "opponent" : "me";
}
