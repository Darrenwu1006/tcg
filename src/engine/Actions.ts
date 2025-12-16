/**
 * 遊戲引擎 - 動作類型定義
 * Game Engine - Action Type Definitions
 *
 * 定義所有可能的遊戲動作，供 AI 和引擎使用
 */

/**
 * 玩家標識
 */
export type Player = "me" | "opponent";

/**
 * 遊戲階段
 */
export type GamePhase =
  | "serve" // 發球階段
  | "block" // 攔網階段
  | "draw" // 抽牌階段
  | "receive" // 接球階段
  | "toss" // 托球階段
  | "attack" // 攻擊階段
  | "end"; // 結束階段

/**
 * 防守選擇
 */
export type DefenseChoice = "block" | "receive";

/**
 * 遊戲動作 - 所有可能的玩家操作
 */
export type GameAction =
  // 發球階段
  | { type: "PLAY_SERVE"; cardInstanceId: string }

  // 選擇防守方式
  | { type: "CHOOSE_DEFENSE"; choice: DefenseChoice }

  // 攔網階段
  | { type: "PLAY_BLOCK"; cardInstanceIds: string[] } // 1-3 張卡

  // 接球階段
  | { type: "PLAY_RECEIVE"; cardInstanceId: string }

  // 托球階段
  | { type: "PLAY_TOSS"; cardInstanceId: string }

  // 攻擊階段
  | { type: "PLAY_ATTACK"; cardInstanceId: string }

  // 技能相關（暫時保留，未來實現）
  | { type: "ACTIVATE_SKILL"; cardInstanceId: string; skillIndex?: number }
  | { type: "USE_EVENT"; cardInstanceId: string }

  // 特殊動作
  | { type: "DECLARE_LOST" } // 宣告 Lost
  | { type: "PASS" }; // 跳過（自由步驟）

/**
 * 動作執行結果
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  newPhase?: GamePhase;
  gameOver?: boolean;
  winner?: Player;
  logs?: string[];
}

/**
 * 合法動作查詢結果
 */
export interface LegalActionsQuery {
  player: Player;
  phase: GamePhase;
  actions: GameAction[];
}
