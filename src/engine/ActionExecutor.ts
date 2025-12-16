/**
 * 遊戲引擎 - 動作執行器
 * Game Engine - Action Executor
 *
 * 執行合法的動作並更新遊戲狀態
 */

import { Card } from "../state/Store";
import { GameAction, Player, ActionResult } from "./Actions";
import {
  EngineGameState,
  getPlayerState,
  getOpponent,
  addLog,
} from "./GameState";

/**
 * 動作執行器
 */
export class ActionExecutor {
  /**
   * 執行動作（會直接修改 state）
   */
  static execute(
    state: EngineGameState,
    action: GameAction,
    player: Player
  ): ActionResult {
    try {
      switch (action.type) {
        case "PLAY_SERVE":
          return this.executeServe(state, action.cardInstanceId, player);

        case "CHOOSE_DEFENSE":
          return this.executeDefenseChoice(state, action.choice, player);

        case "PLAY_BLOCK":
          return this.executeBlock(state, action.cardInstanceIds, player);

        case "PLAY_RECEIVE":
          return this.executeReceive(state, action.cardInstanceId, player);

        case "PLAY_TOSS":
          return this.executeToss(state, action.cardInstanceId, player);

        case "PLAY_ATTACK":
          return this.executeAttack(state, action.cardInstanceId, player);

        case "DECLARE_LOST":
          return this.executeLost(state, player);

        case "PASS":
          return this.executePass(state, player);

        default:
          return { success: false, error: "Unknown action type" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 執行發球
   */
  private static executeServe(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );

    if (cardIndex === -1) {
      return { success: false, error: "Card not found in hand" };
    }

    const card = playerState.hand[cardIndex];

    // 移除手牌中的卡片
    playerState.hand.splice(cardIndex, 1);

    // 放置到場地（發球區）
    card.position = "serve";
    playerState.field.push(card);

    // 計算發球點數
    const servePoint = card.stats?.serve || 0;
    playerState.currentOP = servePoint;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${card.name} 發球，OP=${servePoint}`
    );

    // 進入對手回合，轉換階段
    state.turnPlayer = getOpponent(player);
    state.phase = "draw"; // 對手的抽牌階段（等待選擇防守方式）

    return {
      success: true,
      newPhase: "draw",
      logs: state.logs.slice(-1),
    };
  }

  /**
   * 執行防守選擇
   */
  private static executeDefenseChoice(
    state: EngineGameState,
    choice: "block" | "receive",
    player: Player
  ): ActionResult {
    state.defenseChoice = choice;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} 選擇 ${
        choice === "block" ? "攔網" : "接球"
      }`
    );

    if (choice === "block") {
      state.phase = "block";
      return { success: true, newPhase: "block" };
    } else {
      // 接球軸：先抽 1 張卡
      this.drawCards(state, player, 1);
      state.phase = "receive";
      return { success: true, newPhase: "receive" };
    }
  }

  /**
   * 執行攔網
   */
  private static executeBlock(
    state: EngineGameState,
    cardInstanceIds: string[],
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const opponentState = getPlayerState(state, getOpponent(player));

    // 從手牌移除並放到場地
    const playedCards: Card[] = [];
    let totalBlockPoint = 0;

    for (const id of cardInstanceIds) {
      const cardIndex = playerState.hand.findIndex((c) => c.instanceId === id);
      if (cardIndex === -1) continue;

      const card = playerState.hand.splice(cardIndex, 1)[0];
      card.position = "block";
      playerState.field.push(card);
      playedCards.push(card);

      totalBlockPoint += card.stats?.block || 0;
    }

    playerState.currentDP = totalBlockPoint;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} 攔網 ${playedCards
        .map((c) => c.name)
        .join("+")}，DP=${totalBlockPoint}`
    );

    // 判定：DP vs OP
    const opponentOP = opponentState.currentOP;

    if (totalBlockPoint < opponentOP) {
      // 攔網失敗 → Lost
      addLog(state, `攔網失敗！(DP=${totalBlockPoint} < OP=${opponentOP})`);
      return this.executeLost(state, player);
    } else {
      // 攔網成功
      addLog(state, `攔網成功！(DP=${totalBlockPoint} >= OP=${opponentOP})`);

      // 側邊攔網者移到棄牌區（簡化：全部移到棄牌區）
      playedCards.forEach((card) => {
        const fieldIndex = playerState.field.findIndex(
          (c) => c.instanceId === card.instanceId
        );
        if (fieldIndex !== -1) {
          const removed = playerState.field.splice(fieldIndex, 1)[0];
          removed.position = undefined;
          playerState.drop.push(removed);
        }
      });

      // 重置點數
      playerState.currentOP = 0;
      playerState.currentDP = 0;

      // 進入結束階段
      state.phase = "end";
      return { success: true, newPhase: "end" };
    }
  }

  /**
   * 執行接球
   */
  private static executeReceive(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const opponentState = getPlayerState(state, getOpponent(player));

    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );
    if (cardIndex === -1) {
      return { success: false, error: "Card not found" };
    }

    const card = playerState.hand.splice(cardIndex, 1)[0];
    card.position = "receive";
    playerState.field.push(card);

    const receivePoint = card.stats?.receive || 0;
    playerState.currentDP = receivePoint;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${
        card.name
      } 接球，DP=${receivePoint}`
    );

    // 判定
    const opponentOP = opponentState.currentOP;

    if (receivePoint < opponentOP) {
      // 接球失敗 → Lost
      addLog(state, `接球失敗！(DP=${receivePoint} < OP=${opponentOP})`);
      return this.executeLost(state, player);
    } else {
      // 接球成功 → 進入托球階段
      addLog(state, `接球成功！(DP=${receivePoint} >= OP=${opponentOP})`);
      state.phase = "toss";
      return { success: true, newPhase: "toss" };
    }
  }

  /**
   * 執行托球
   */
  private static executeToss(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);

    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );
    if (cardIndex === -1) {
      return { success: false, error: "Card not found" };
    }

    const card = playerState.hand.splice(cardIndex, 1)[0];
    card.position = "toss";
    playerState.field.push(card);

    const tossPoint = card.stats?.toss || 0;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${
        card.name
      } 托球，Toss=${tossPoint}`
    );

    // 進入攻擊階段
    state.phase = "attack";
    return { success: true, newPhase: "attack" };
  }

  /**
   * 執行攻擊
   */
  private static executeAttack(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);

    const cardIndex = playerState.hand.findIndex(
      (c) => c.instanceId === cardInstanceId
    );
    if (cardIndex === -1) {
      return { success: false, error: "Card not found" };
    }

    const card = playerState.hand.splice(cardIndex, 1)[0];
    card.position = "attack";
    playerState.field.push(card);

    // 計算 OP = Toss + Attack
    const tossCard = playerState.field.find((c) => c.position === "toss");
    const tossPoint = tossCard?.stats?.toss || 0;
    const attackPoint = card.stats?.attack || 0;
    const totalOP = tossPoint + attackPoint;

    playerState.currentOP = totalOP;

    addLog(
      state,
      `${player === "me" ? "我方" : "對手"} ${
        card.name
      } 攻擊，OP=${totalOP} (${tossPoint}+${attackPoint})`
    );

    // 進入結束階段
    state.phase = "end";
    return { success: true, newPhase: "end" };
  }

  /**
   * 執行 Lost
   */
  private static executeLost(
    state: EngineGameState,
    player: Player
  ): ActionResult {
    const playerState = getPlayerState(state, player);
    const opponentState = getPlayerState(state, getOpponent(player));

    addLog(state, `${player === "me" ? "我方" : "對手"} 宣告 Lost`);

    // 重置點數
    playerState.currentOP = 0;
    playerState.currentDP = 0;
    opponentState.currentOP = 0;
    opponentState.currentDP = 0;

    // 檢查 Set 區
    if (playerState.set.length === 0) {
      // Set 區沒卡了 → 輸掉比賽
      state.gameOver = true;
      state.winner = getOpponent(player);
      addLog(
        state,
        `遊戲結束！${state.winner === "me" ? "我方" : "對手"} 勝利`
      );

      return {
        success: true,
        gameOver: true,
        winner: state.winner,
      };
    }

    // Interval 流程
    // 1. 從 Set 區拿 1 張卡到手牌
    const setCard = playerState.set.pop();
    if (setCard) {
      setCard.position = undefined;
      playerState.hand.push(setCard);
      addLog(state, `${player === "me" ? "我方" : "對手"} 從 Set 區拿 1 張卡`);
    }

    // 2. 雙方補滿手牌至 6 張
    this.fillHand(state, "me");
    this.fillHand(state, "opponent");

    // 3. 清空場地
    this.clearField(state, "me");
    this.clearField(state, "opponent");

    // 4. 贏家獲得發球權
    const winner = getOpponent(player);
    state.servePlayer = winner;
    state.turnPlayer = winner;
    state.phase = "serve";

    addLog(state, `新的 Set 開始，${winner === "me" ? "我方" : "對手"} 發球`);

    return {
      success: true,
      newPhase: "serve",
    };
  }

  /**
   * 執行 Pass
   */
  private static executePass(
    state: EngineGameState,
    player: Player
  ): ActionResult {
    // 跳過當前步驟
    addLog(state, `${player === "me" ? "我方" : "對手"} Pass`);
    return { success: true };
  }

  /**
   * 幫助方法：抽卡
   */
  private static drawCards(
    state: EngineGameState,
    player: Player,
    count: number
  ): void {
    const playerState = getPlayerState(state, player);

    for (let i = 0; i < count; i++) {
      if (playerState.deck.length === 0) break;

      const card = playerState.deck.shift();
      if (card) {
        card.position = undefined;
        playerState.hand.push(card);
      }
    }

    if (count > 0) {
      addLog(state, `${player === "me" ? "我方" : "對手"} 抽 ${count} 張卡`);
    }
  }

  /**
   * 幫助方法：補滿手牌至 6 張
   */
  private static fillHand(state: EngineGameState, player: Player): void {
    const playerState = getPlayerState(state, player);
    const needed = 6 - playerState.hand.length;
    if (needed > 0) {
      this.drawCards(state, player, needed);
    }
  }

  /**
   * 幫助方法：清空場地
   */
  private static clearField(state: EngineGameState, player: Player): void {
    const playerState = getPlayerState(state, player);

    // 將場地上的卡片移到棄牌區
    while (playerState.field.length > 0) {
      const card = playerState.field.pop();
      if (card) {
        card.position = undefined;
        playerState.drop.push(card);
      }
    }
  }
}
