/**
 * AI Battle Service
 * AI 對戰服務 - 封裝 MCTS AI 對戰邏輯，提供逐步執行接口
 *
 * 設計為可複用模組，未來可整合到現有 UI
 */

import { Card, AppState } from "../state/Store";
import { GameEngine } from "../engine/GameEngine";
import { MCTSAI } from "../engine/MCTSAI";
import { MCTSLogLevel } from "../engine/MCTS";
import { HeuristicAI } from "../engine/HeuristicAI";
import { GameAction, Player } from "../engine/Actions";
import { EngineGameState } from "../engine/GameState";
import {
  engineToAppState,
  getActionDescription,
  getPhaseDescription,
} from "./StateConverter";

/**
 * 對戰步驟資訊
 */
export interface BattleStep {
  stepNumber: number;
  action: GameAction;
  actionDescription: string;
  player: Player;
  winRate: number;
  phase: string;
  phaseDescription: string;
  engineState: EngineGameState;
  isGameOver: boolean;
  winner: Player | null;
  // 新增：OP/DP 變化資訊
  opDpChange?: {
    meOP: { before: number; after: number };
    opponentOP: { before: number; after: number };
    meDP: { before: number; after: number };
    opponentDP: { before: number; after: number };
  };
  // 新增：引擎日誌（技能觸發等）
  engineLogs?: string[];
}

export type AIMode = "mcts" | "heuristic";

/**
 * 對戰配置
 */
export interface BattleConfig {
  meDeck: Card[];
  opponentDeck: Card[];
  meSimulations: number;
  opponentSimulations: number;
  firstPlayer: Player;
  meSchool?: string;
  opponentSchool?: string;
  logLevel?: MCTSLogLevel;
  aiMode?: AIMode;
  heuristicRandomness?: number;
}

type BattleAI = MCTSAI | HeuristicAI;

/**
 * AI 對戰服務
 */
export class AIBattleService {
  private engine: GameEngine | null = null;
  private meAI: BattleAI | null = null;
  private opponentAI: BattleAI | null = null;
  private stepCount: number = 0;
  private config: BattleConfig | null = null;
  private lastWinRate: number = 0.5;
  private originalDecks: { me: Card[]; opponent: Card[] } | null = null;

  /**
   * 初始化對戰
   */
  initialize(config: BattleConfig): void {
    this.config = config;
    this.stepCount = 0;
    this.lastWinRate = 0.5;

    // 只在首次初始化時保存原始牌組（用於 rematch）
    if (this.originalDecks === null) {
      this.originalDecks = {
        me: config.meDeck.map((card) => ({ ...card })),
        opponent: config.opponentDeck.map((card) => ({ ...card })),
      };
    }

    // 從牌組讀取學校（使用第一張卡的學校）
    const meSchool = config.meSchool || config.meDeck[0]?.school || "烏野";
    const opponentSchool =
      config.opponentSchool || config.opponentDeck[0]?.school || "音駒";

    // 創建遊戲引擎
    this.engine = new GameEngine(
      [...config.meDeck],
      [...config.opponentDeck],
      config.firstPlayer,
      meSchool,
      opponentSchool
    );

    // 創建 AI。Default keeps current behavior; heuristic mode is a baseline
    // hook for testing more human-readable rule-based choices.
    const logLevel = config.logLevel ?? MCTSLogLevel.NONE;
    const aiMode = config.aiMode ?? "mcts";
    if (aiMode === "heuristic") {
      const randomness = config.heuristicRandomness ?? 0.1;
      this.meAI = new HeuristicAI("me", randomness);
      this.opponentAI = new HeuristicAI("opponent", randomness);
    } else {
      this.meAI = new MCTSAI(config.meSimulations, logLevel);
      this.opponentAI = new MCTSAI(config.opponentSimulations, logLevel);
    }
  }

  /**
   * 執行下一步
   */
  nextStep(): BattleStep | null {
    if (!this.engine || !this.meAI || !this.opponentAI) {
      throw new Error("Battle not initialized. Call initialize() first.");
    }

    if (this.engine.isGameOver()) {
      return null;
    }

    const state = this.engine.getState();
    const currentPlayer = state.turnPlayer;
    const ai = currentPlayer === "me" ? this.meAI : this.opponentAI;

    // 記錄執行前的 OP/DP
    const beforeState = {
      meOP: state.me.currentOP,
      opponentOP: state.opponent.currentOP,
      meDP: state.me.currentDP,
      opponentDP: state.opponent.currentDP,
      logCount: state.logs.length,
    };

    // 獲取 AI 決策和勝率
    const result = this.selectActionWithStats(ai, state as EngineGameState);
    const action = result.action;
    const winRate =
      currentPlayer === "me" ? result.winRate : 1 - result.winRate;

    // 執行動作
    this.engine.executeAction(action);
    this.stepCount++;
    this.lastWinRate = winRate;

    // 獲取執行後的狀態
    const newState = this.engine.getState();

    // 計算 OP/DP 變化
    const opDpChange = {
      meOP: { before: beforeState.meOP, after: newState.me.currentOP },
      opponentOP: {
        before: beforeState.opponentOP,
        after: newState.opponent.currentOP,
      },
      meDP: { before: beforeState.meDP, after: newState.me.currentDP },
      opponentDP: {
        before: beforeState.opponentDP,
        after: newState.opponent.currentDP,
      },
    };

    // 獲取新增的引擎日誌
    const engineLogs = newState.logs.slice(beforeState.logCount);

    return {
      stepNumber: this.stepCount,
      action,
      actionDescription: getActionDescription(
        action as { type: string; card?: Card; position?: string }
      ),
      player: currentPlayer,
      winRate,
      phase: newState.phase,
      phaseDescription: getPhaseDescription(newState.phase),
      engineState: newState as EngineGameState,
      isGameOver: this.engine.isGameOver(),
      winner: this.engine.getWinner(),
      opDpChange,
      engineLogs,
    };
  }

  private selectActionWithStats(
    ai: BattleAI,
    state: EngineGameState
  ): { action: GameAction; winRate: number } {
    if (ai instanceof MCTSAI) {
      return ai.selectActionWithStats(state);
    }

    return {
      action: ai.selectAction(state),
      winRate: 0.5,
    };
  }

  /**
   * 檢查對戰是否結束
   */
  isFinished(): boolean {
    return this.engine?.isGameOver() ?? true;
  }

  /**
   * 獲取當前狀態的 UI 表示
   */
  getUIState(): Partial<AppState> {
    if (!this.engine) {
      return {};
    }
    return engineToAppState(this.engine.getState() as EngineGameState);
  }

  /**
   * 獲取當前引擎狀態
   */
  getEngineState(): EngineGameState | null {
    return this.engine?.getState() as EngineGameState | null;
  }

  /**
   * 獲取勝者
   */
  getWinner(): Player | null {
    return this.engine?.getWinner() ?? null;
  }

  /**
   * 獲取步驟計數
   */
  getStepCount(): number {
    return this.stepCount;
  }

  /**
   * 獲取最後的勝率
   */
  getLastWinRate(): number {
    return this.lastWinRate;
  }

  /**
   * 獲取當前 Set 分數
   */
  getSetScore(): { me: number; opponent: number } {
    const state = this.engine?.getState();
    return state?.setWins ?? { me: 0, opponent: 0 };
  }

  /**
   * 重置對戰（使用相同配置和原始牌組）
   */
  reset(): void {
    if (this.config && this.originalDecks) {
      // 使用原始牌組（深度複製）
      const resetConfig: BattleConfig = {
        ...this.config,
        meDeck: this.originalDecks.me.map((card) => ({ ...card })),
        opponentDeck: this.originalDecks.opponent.map((card) => ({ ...card })),
      };
      this.initialize(resetConfig);
    }
  }

  /**
   * 銷毀服務
   */
  destroy(): void {
    this.engine = null;
    this.meAI = null;
    this.opponentAI = null;
    this.config = null;
    this.originalDecks = null;
  }
}
