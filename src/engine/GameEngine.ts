/**
 * 遊戲引擎 - 主引擎
 * Game Engine - Main Game Engine
 *
 * 無頭遊戲引擎，提供完整的遊戲邏輯（不含 UI）
 */

import { Card } from "../state/Store";
import { GameAction, Player, ActionResult } from "./Actions";
import {
  EngineGameState,
  createInitialGameState,
  cloneGameState,
  addLog,
  getPlayerState,
} from "./GameState";
import { RuleValidator } from "./RuleValidator";
import { ActionExecutor } from "./ActionExecutor";

/**
 * 遊戲引擎
 */
export class GameEngine {
  private state: EngineGameState;

  constructor(
    meDeck: Card[],
    opponentDeck: Card[],
    firstPlayer: Player = "me",
    meSchool: string = "烏野",
    opponentSchool: string = "音駒"
  ) {
    this.state = createInitialGameState(
      meDeck,
      opponentDeck,
      firstPlayer,
      meSchool,
      opponentSchool
    );
    this.setupGame();
  }

  /**
   * 遊戲初始化
   */
  private setupGame(): void {
    // 1. 洗牌
    this.shuffleDeck("me");
    this.shuffleDeck("opponent");

    // 2. 抽起始手牌（6 張）
    this.drawCards("me", 6);
    this.drawCards("opponent", 6);

    // 3. 配置 Set 卡（各 2 張）
    this.setupSetCards("me");
    this.setupSetCards("opponent");

    addLog(this.state, "遊戲開始！");
    addLog(
      this.state,
      `${this.state.servePlayer === "me" ? "我方" : "對手"} 擁有首次發球權`
    );
  }

  /**
   * 洗牌（Fisher-Yates）
   */
  private shuffleDeck(player: Player): void {
    const playerState = getPlayerState(this.state, player);
    const deck = playerState.deck;

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  /**
   * 抽卡
   */
  private drawCards(player: Player, count: number): void {
    const playerState = getPlayerState(this.state, player);

    for (let i = 0; i < count; i++) {
      if (playerState.deck.length === 0) break;

      const card = playerState.deck.shift();
      if (card) {
        card.position = undefined;
        playerState.hand.push(card);
      }
    }
  }

  /**
   * 設置 Set 卡
   */
  private setupSetCards(player: Player): void {
    const playerState = getPlayerState(this.state, player);

    for (let i = 0; i < 2; i++) {
      if (playerState.deck.length === 0) break;

      const card = playerState.deck.shift();
      if (card) {
        card.position = "set";
        playerState.set.push(card);
      }
    }
  }

  /**
   * 獲取當前遊戲狀態（只讀）
   */
  getState(): Readonly<EngineGameState> {
    return this.state;
  }

  /**
   * 克隆當前狀態（用於 MCTS 模擬）
   */
  cloneState(): EngineGameState {
    return cloneGameState(this.state);
  }

  /**
   * 獲取合法動作
   */
  getLegalActions(player?: Player): GameAction[] {
    const targetPlayer = player || this.state.turnPlayer;
    return RuleValidator.getLegalActions(this.state, targetPlayer);
  }

  /**
   * 檢查動作是否合法
   */
  isActionLegal(
    action: GameAction,
    player?: Player
  ): { legal: boolean; reason?: string } {
    const targetPlayer = player || this.state.turnPlayer;
    return RuleValidator.isActionLegal(this.state, action, targetPlayer);
  }

  /**
   * 執行動作
   */
  executeAction(action: GameAction, player?: Player): ActionResult {
    const targetPlayer = player || this.state.turnPlayer;

    // 驗證動作
    const validation = this.isActionLegal(action, targetPlayer);
    if (!validation.legal) {
      return {
        success: false,
        error: validation.reason || "Illegal action",
      };
    }

    // 執行動作
    const result = ActionExecutor.execute(this.state, action, targetPlayer);

    // 檢查遊戲是否結束
    if (result.gameOver) {
      this.state.gameOver = true;
      this.state.winner = result.winner || null;
    }

    return result;
  }

  /**
   * 檢查遊戲是否結束
   */
  isGameOver(): boolean {
    return this.state.gameOver;
  }

  /**
   * 獲取勝者
   */
  getWinner(): Player | null {
    return this.state.winner;
  }

  /**
   * 獲取當前回合玩家
   */
  getCurrentPlayer(): Player {
    return this.state.turnPlayer;
  }

  /**
   * 獲取遊戲日誌
   */
  getLogs(): string[] {
    return [...this.state.logs];
  }

  /**
   * 重置遊戲
   */
  reset(
    meDeck: Card[],
    opponentDeck: Card[],
    firstPlayer: Player = "me",
    meSchool: string = "烏野",
    opponentSchool: string = "音駒"
  ): void {
    this.state = createInitialGameState(
      meDeck,
      opponentDeck,
      firstPlayer,
      meSchool,
      opponentSchool
    );
    this.setupGame();
  }

  /**
   * 從狀態恢復（用於 MCTS）
   */
  static fromState(state: EngineGameState): GameEngine {
    const engine = Object.create(GameEngine.prototype);
    engine.state = state;
    return engine;
  }

  /**
   * 快速模擬到遊戲結束（使用隨機策略）
   * 用於測試和 MCTS rollout
   */
  simulateToEnd(maxTurns: number = 100): Player | null {
    let turns = 0;

    while (!this.isGameOver() && turns < maxTurns) {
      const legalActions = this.getLegalActions();

      if (legalActions.length === 0) {
        // 沒有合法動作，遊戲異常結束
        break;
      }

      // 隨機選擇一個動作
      const randomAction =
        legalActions[Math.floor(Math.random() * legalActions.length)];

      this.executeAction(randomAction);
      turns++;
    }

    return this.getWinner();
  }
}
