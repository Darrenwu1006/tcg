/**
 * 遊戲引擎 - 遊戲狀態
 * Game Engine - Game State
 *
 * 獨立的遊戲狀態管理，不依賴 UI
 */

import { Card } from "../state/Store";
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
  isFirstTurn: boolean; // 是否為 Set 的第一回合（發球回合，不需選擇防守）
  isFromServe: boolean; // 當前 OP 是否來自發球（發球不能被攔網）

  matchFirstPlayer: Player; // 初始先攻玩家

  // 玩家狀態
  me: EnginePlayerState;
  opponent: EnginePlayerState;

  // 回合狀態
  defenseChoice: DefenseChoice | null;
  servePlayer: Player | null; // 當前發球權

  // 調整手牌階段
  hasMulligan: { me: boolean; opponent: boolean }; // 是否已完成調整手牌

  // 持續效果追蹤
  activeEffects: ActiveEffect[];

  // 勝負記錄
  setWins: { me: number; opponent: number };

  // 遊戲結束
  gameOver: boolean;
  winner: Player | null;

  // 日誌（用於調試）
  logs: string[];
}

/**
 * 持續效果定義
 */
export interface ActiveEffect {
  source: string; // 來源卡片 ID
  target: Player | "all";
  type: "stat_modifier" | "restriction";
  stat?: string;
  value?: number;
  duration: "turn" | "set" | "permanent";
  description: string;
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
  firstPlayer: Player,
  meSchool: string = "烏野",
  opponentSchool: string = "音駒"
): EngineGameState {
  return {
    turnPlayer: firstPlayer,
    matchFirstPlayer: firstPlayer,
    phase: "setup",
    turnCount: 0,
    isFirstTurn: true, // 第一回合是發球回合
    isFromServe: true, // 初始為發球

    me: createInitialPlayerState(meDeck, meSchool),
    opponent: createInitialPlayerState(opponentDeck, opponentSchool),

    defenseChoice: null,
    servePlayer: firstPlayer,

    hasMulligan: { me: false, opponent: false },
    activeEffects: [],

    setWins: { me: 0, opponent: 0 },

    gameOver: false,
    winner: null,

    logs: [],
  };
}

/**
 * 深拷貝卡片
 */
function cloneCard(card: Card): Card {
  return {
    ...card,
    stats: card.stats ? { ...card.stats } : undefined,
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
      deck: state.me.deck.map(cloneCard),
      hand: state.me.hand.map(cloneCard),
      set: state.me.set.map(cloneCard),
      drop: state.me.drop.map(cloneCard),
      field: state.me.field.map(cloneCard),
    },
    opponent: {
      ...state.opponent,
      deck: state.opponent.deck.map(cloneCard),
      hand: state.opponent.hand.map(cloneCard),
      set: state.opponent.set.map(cloneCard),
      drop: state.opponent.drop.map(cloneCard),
      field: state.opponent.field.map(cloneCard),
    },
    hasMulligan: { ...state.hasMulligan },
    activeEffects: state.activeEffects.map((e) => ({ ...e })),
    setWins: { ...state.setWins },
    logs: [...state.logs],
  };
}

/**
 * 添加日誌
 */
export function addLog(state: EngineGameState, message: string): void {
  let prefix = "";
  if (state.phase === "setup") {
    prefix = "[Turn 0]";
  } else {
    // 計算回合數：Turn 0 -> 1, Turn 1 -> 2, Turn 2 -> 2, Turn 3 -> 3...
    // 公式：floor((turnCount + 1) / 2) + 1
    // Turn 0 (P1/P2) -> 1
    // Turn 1 (P1) -> 2
    // Turn 2 (P2) -> 2
    // Turn 3 (P1) -> 3
    const round = Math.floor((state.turnCount + 1) / 2) + 1;
    const isFirstPlayer = state.turnPlayer === state.matchFirstPlayer;
    prefix = `[${isFirstPlayer ? "先攻" : "後攻"}${round}]`;
  }

  state.logs.push(`${prefix} ${message}`);
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
