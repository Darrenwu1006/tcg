/**
 * 遊戲引擎 - 規則驗證器
 * Game Engine - Rule Validator
 *
 * 驗證動作是否合法（不實現技能系統）
 */

import { GameAction, Player } from "./Actions";
import { EngineGameState, getPlayerState } from "./GameState";

/**
 * 規則驗證器
 */
export class RuleValidator {
  /**
   * 驗證動作是否合法
   */
  static isActionLegal(
    state: EngineGameState,
    action: GameAction,
    player: Player
  ): { legal: boolean; reason?: string } {
    switch (action.type) {
      case "PLAY_SERVE":
        return this.validateServe(state, action.cardInstanceId, player);

      case "CHOOSE_DEFENSE":
        return this.validateDefenseChoice(state, player);

      case "PLAY_BLOCK":
        return this.validateBlock(state, action.cardInstanceIds, player);

      case "PLAY_RECEIVE":
        return this.validateReceive(state, action.cardInstanceId, player);

      case "PLAY_TOSS":
        return this.validateToss(state, action.cardInstanceId, player);

      case "PLAY_ATTACK":
        return this.validateAttack(state, action.cardInstanceId, player);

      case "DECLARE_LOST":
        return { legal: true };

      case "PASS":
        return { legal: true };

      default:
        return { legal: false, reason: "Unknown action type" };
    }
  }

  /**
   * 驗證發球
   */
  private static validateServe(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.phase !== "serve") {
      return { legal: false, reason: "Not in serve phase" };
    }

    if (state.turnPlayer !== player) {
      return { legal: false, reason: "Not your turn" };
    }

    const playerState = getPlayerState(state, player);
    const card = playerState.hand.find((c) => c.instanceId === cardInstanceId);

    if (!card) {
      return { legal: false, reason: "Card not in hand" };
    }

    if (card.type !== "CHARACTER") {
      return { legal: false, reason: "Must play a character card" };
    }

    // 檢查是否有發球點數
    if (!card.stats || card.stats.serve === null) {
      return { legal: false, reason: "Card has no serve stat" };
    }

    return { legal: true };
  }

  /**
   * 驗證防守選擇
   */
  private static validateDefenseChoice(
    state: EngineGameState,
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.turnCount === 0) {
      return { legal: false, reason: "Cannot choose defense on first turn" };
    }

    if (state.turnPlayer !== player) {
      return { legal: false, reason: "Not your turn" };
    }

    return { legal: true };
  }

  /**
   * 驗證攔網
   */
  private static validateBlock(
    state: EngineGameState,
    cardInstanceIds: string[],
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.phase !== "block") {
      return { legal: false, reason: "Not in block phase" };
    }

    if (state.turnPlayer !== player) {
      return { legal: false, reason: "Not your turn" };
    }

    // 攔網角色必須 1-3 張
    if (cardInstanceIds.length < 1 || cardInstanceIds.length > 3) {
      return { legal: false, reason: "Must play 1-3 blockers" };
    }

    const playerState = getPlayerState(state, player);

    // 檢查所有卡片都在手牌中且有攔網點數
    for (const id of cardInstanceIds) {
      const card = playerState.hand.find((c) => c.instanceId === id);
      if (!card) {
        return { legal: false, reason: `Card ${id} not in hand` };
      }
      if (card.type !== "CHARACTER") {
        return { legal: false, reason: "Must play character cards" };
      }
      if (!card.stats || card.stats.block === null) {
        return { legal: false, reason: `Card ${card.name} has no block stat` };
      }
    }

    return { legal: true };
  }

  /**
   * 驗證接球
   */
  private static validateReceive(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.phase !== "receive") {
      return { legal: false, reason: "Not in receive phase" };
    }

    const playerState = getPlayerState(state, player);
    const card = playerState.hand.find((c) => c.instanceId === cardInstanceId);

    if (!card) {
      return { legal: false, reason: "Card not in hand" };
    }

    if (!card.stats || card.stats.receive === null) {
      return { legal: false, reason: "Card has no receive stat" };
    }

    return { legal: true };
  }

  /**
   * 驗證托球
   */
  private static validateToss(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.phase !== "toss") {
      return { legal: false, reason: "Not in toss phase" };
    }

    const playerState = getPlayerState(state, player);
    const card = playerState.hand.find((c) => c.instanceId === cardInstanceId);

    if (!card) {
      return { legal: false, reason: "Card not in hand" };
    }

    if (!card.stats || card.stats.toss === null) {
      return { legal: false, reason: "Card has no toss stat" };
    }

    // 檢查不可與接球角色同名
    const receiveCard = playerState.field.find((c) =>
      c.position?.includes("receive")
    );
    if (receiveCard && receiveCard.name === card.name) {
      return {
        legal: false,
        reason: "Cannot use same card name as receive card",
      };
    }

    return { legal: true };
  }

  /**
   * 驗證攻擊
   */
  private static validateAttack(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.phase !== "attack") {
      return { legal: false, reason: "Not in attack phase" };
    }

    const playerState = getPlayerState(state, player);
    const card = playerState.hand.find((c) => c.instanceId === cardInstanceId);

    if (!card) {
      return { legal: false, reason: "Card not in hand" };
    }

    if (!card.stats || card.stats.attack === null) {
      return { legal: false, reason: "Card has no attack stat" };
    }

    // 檢查不可與托球角色同名
    const tossCard = playerState.field.find((c) =>
      c.position?.includes("toss")
    );
    if (tossCard && tossCard.name === card.name) {
      return { legal: false, reason: "Cannot use same card name as toss card" };
    }

    return { legal: true };
  }

  /**
   * 獲取合法動作列表
   */
  static getLegalActions(state: EngineGameState, player: Player): GameAction[] {
    const actions: GameAction[] = [];
    const playerState = getPlayerState(state, player);

    // 根據不同階段生成合法動作
    switch (state.phase) {
      case "serve":
        if (state.turnPlayer === player) {
          // 所有手牌中有發球點數的角色卡
          playerState.hand.forEach((card) => {
            if (
              card.type === "CHARACTER" &&
              card.stats &&
              card.stats.serve !== null
            ) {
              actions.push({
                type: "PLAY_SERVE",
                cardInstanceId: card.instanceId,
              });
            }
          });
          // 如果沒有可用卡片，可以宣告 Lost
          if (actions.length === 0) {
            actions.push({ type: "DECLARE_LOST" });
          }
        }
        break;

      case "block":
        if (state.turnPlayer === player) {
          // 生成所有可能的 1-3 張攔網組合
          const blockCards = playerState.hand.filter(
            (c) => c.type === "CHARACTER" && c.stats && c.stats.block !== null
          );

          // 1 張攔網
          blockCards.forEach((card) => {
            actions.push({
              type: "PLAY_BLOCK",
              cardInstanceIds: [card.instanceId],
            });
          });

          // 2 張攔網
          for (let i = 0; i < blockCards.length; i++) {
            for (let j = i + 1; j < blockCards.length; j++) {
              actions.push({
                type: "PLAY_BLOCK",
                cardInstanceIds: [
                  blockCards[i].instanceId,
                  blockCards[j].instanceId,
                ],
              });
            }
          }

          // 3 張攔網
          for (let i = 0; i < blockCards.length; i++) {
            for (let j = i + 1; j < blockCards.length; j++) {
              for (let k = j + 1; k < blockCards.length; k++) {
                actions.push({
                  type: "PLAY_BLOCK",
                  cardInstanceIds: [
                    blockCards[i].instanceId,
                    blockCards[j].instanceId,
                    blockCards[k].instanceId,
                  ],
                });
              }
            }
          }

          // 沒有攔網卡可以宣告 Lost
          if (blockCards.length === 0) {
            actions.push({ type: "DECLARE_LOST" });
          }
        }
        break;

      case "receive":
        // 接球階段的合法動作
        playerState.hand.forEach((card) => {
          if (
            card.type === "CHARACTER" &&
            card.stats &&
            card.stats.receive !== null
          ) {
            actions.push({
              type: "PLAY_RECEIVE",
              cardInstanceId: card.instanceId,
            });
          }
        });
        if (actions.length === 0) {
          actions.push({ type: "DECLARE_LOST" });
        }
        break;

      // ... 其他階段類似
    }

    // 總是可以 PASS（在自由步驟）
    actions.push({ type: "PASS" });

    return actions;
  }
}
