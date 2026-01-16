/**
 * 遊戲引擎 - 規則驗證器
 * Game Engine - Rule Validator
 *
 * 驗證動作是否合法
 */

import { GameAction, Player } from "./Actions";
import { EngineGameState, getPlayerState } from "./GameState";
import { getCharacterSkill, getEventSkill } from "./SkillLoader";
import { isSkillAvailable } from "./SkillExecutor";
import { matchesTiming } from "./SkillTriggerSystem";

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

      case "MULLIGAN":
        return this.validateMulligan(state, action.cardInstanceIds, player);

      case "DECLARE_LOST":
        return { legal: true };

      case "PASS":
        return { legal: true };

      case "ACTIVATE_SKILL":
        return this.validateActivateSkill(state, action.cardInstanceId, player);

      case "USE_EVENT":
        return this.validateUseEvent(state, action.cardInstanceId, player);

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
    // 第一回合是發球回合，不需要選擇防守
    if (state.isFirstTurn) {
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
   * 驗證發動技能
   */
  private static validateActivateSkill(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.turnPlayer !== player) {
      return { legal: false, reason: "Not your turn" };
    }

    const playerState = getPlayerState(state, player);
    const card = playerState.field.find((c) => c.instanceId === cardInstanceId);

    if (!card) {
      return { legal: false, reason: "Card not found on field" };
    }

    const skill = getCharacterSkill(card.id);
    if (!skill) {
      return { legal: false, reason: "No skill data" };
    }

    if (!matchesTiming(skill.timing, state.phase)) {
      return { legal: false, reason: "Timing not matched" };
    }

    const availability = isSkillAvailable(state, player, skill);
    if (!availability.available) {
      return { legal: false, reason: availability.reason };
    }

    return { legal: true };
  }

  /**
   * 驗證使用事件卡
   */
  private static validateUseEvent(
    state: EngineGameState,
    cardInstanceId: string,
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.turnPlayer !== player) {
      return { legal: false, reason: "Not your turn" };
    }

    const playerState = getPlayerState(state, player);
    const card = playerState.hand.find((c) => c.instanceId === cardInstanceId);

    if (!card) {
      return { legal: false, reason: "Card not found in hand" };
    }

    if (card.type !== "EVENT") {
      return { legal: false, reason: "Not an event card" };
    }

    const skill = getEventSkill(card.id);
    if (!skill) {
      return { legal: false, reason: "No skill data" };
    }

    if (!matchesTiming(skill.timing, state.phase)) {
      return { legal: false, reason: "Timing not matched" };
    }

    const availability = isSkillAvailable(state, player, skill);
    if (!availability.available) {
      return { legal: false, reason: availability.reason };
    }

    return { legal: true };
  }

  /**
   * 驗證調整手牌
   */
  private static validateMulligan(
    state: EngineGameState,
    cardInstanceIds: string[],
    player: Player
  ): { legal: boolean; reason?: string } {
    if (state.phase !== "setup") {
      return { legal: false, reason: "Not in setup phase" };
    }

    if (state.hasMulligan[player]) {
      return { legal: false, reason: "Already used mulligan" };
    }

    const playerState = getPlayerState(state, player);

    // 檢查所有卡片都在手牌中
    for (const id of cardInstanceIds) {
      if (!playerState.hand.some((c) => c.instanceId === id)) {
        return { legal: false, reason: `Card ${id} not in hand` };
      }
    }

    return { legal: true };
  }

  /**
   * 獲取合法動作列表
   */
  static getLegalActions(state: EngineGameState, player: Player): GameAction[] {
    const actions: GameAction[] = [];
    const playerState = getPlayerState(state, player);

    // 只有當前回合玩家可以行動
    if (state.turnPlayer !== player) {
      return actions;
    }

    // 根據不同階段生成合法動作
    switch (state.phase) {
      case "setup":
        // 調整手牌階段：可以選擇任意數量的手牌進行調整，或 Pass
        if (!state.hasMulligan[player]) {
          // 1. Pass (不調整)
          actions.push({ type: "PASS" });

          // 2. Mulligan (調整 1-6 張)
          // 這裡為了簡化，只生成 "Pass" 和 "調整全部" 的動作供 AI 選擇
          // 實際 UI 可以讓玩家選擇任意組合
          const handIds = playerState.hand.map((c) => c.instanceId);
          if (handIds.length > 0) {
            actions.push({
              type: "MULLIGAN",
              cardInstanceIds: handIds,
            });
          }
        } else {
          // 已經調整過，只能等待（理論上不應該發生，因為會直接進入下一階段）
        }
        break;

      case "serve":
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
        break;

      case "start":
        // 開始階段：選擇防守方式
        // 發球只能接球（不能攔網），攻擊可以攔網或接球
        if (!state.isFromServe) {
          actions.push({ type: "CHOOSE_DEFENSE", choice: "block" });
        }
        actions.push({ type: "CHOOSE_DEFENSE", choice: "receive" });
        break;

      case "block":
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
        break;

      case "draw":
        // 抽牌階段（接球軸）：已經抽過牌，自動進入接球階段
        // 這個階段不需要玩家動作，由引擎自動處理
        // 但為了保持流程，保留一個 PASS 讓引擎推進
        actions.push({ type: "PASS" });
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

      case "toss":
        // 托球階段：可用的托球角色（不可與接球同名）
        const receiveCard = playerState.field.find(
          (c) => c.position === "receive"
        );
        playerState.hand.forEach((card) => {
          if (
            card.type === "CHARACTER" &&
            card.stats &&
            card.stats.toss !== null
          ) {
            // 檢查不可與接球角色同名
            if (!receiveCard || receiveCard.name !== card.name) {
              actions.push({
                type: "PLAY_TOSS",
                cardInstanceId: card.instanceId,
              });
            }
          }
        });
        if (actions.length === 0) {
          actions.push({ type: "DECLARE_LOST" });
        }
        break;

      case "attack":
        // 攻擊階段：可用的攻擊角色（不可與托球同名）
        const tossCard = playerState.field.find((c) => c.position === "toss");
        console.log(
          `[RuleValidator] Attack phase - tossCard: ${
            tossCard?.name || "null"
          } (pos: ${tossCard?.position})`
        );
        playerState.hand.forEach((card) => {
          if (
            card.type === "CHARACTER" &&
            card.stats &&
            card.stats.attack !== null
          ) {
            // 檢查不可與托球角色同名
            if (!tossCard || tossCard.name !== card.name) {
              actions.push({
                type: "PLAY_ATTACK",
                cardInstanceId: card.instanceId,
              });
            } else {
              console.log(
                `[RuleValidator] Blocked attack card ${card.name} (same name as toss)`
              );
            }
          }
        });
        if (actions.length === 0) {
          actions.push({ type: "DECLARE_LOST" });
        }
        break;

      case "end":
        // 結束階段：自動轉換到下一回合，不需要玩家動作
        // 使用 PASS 來推進遊戲
        actions.push({ type: "PASS" });
        break;
    }

    // 在所有有登場動作的階段，都加入事件卡和技能動作（自由步驟）
    // 這些動作是可選的，玩家可以選擇使用或不使用
    if (["serve", "block", "receive", "toss", "attack"].includes(state.phase)) {
      // 加入可用的事件卡
      this.addEventCardActions(state, player, actions);

      // 加入可發動的技能
      this.addSkillActions(state, player, actions);
    }

    return actions;
  }

  /**
   * 添加可用的事件卡動作
   */
  private static addEventCardActions(
    state: EngineGameState,
    player: Player,
    actions: GameAction[]
  ): void {
    const playerState = getPlayerState(state, player);

    // 遍歷手牌中的事件卡
    for (const card of playerState.hand) {
      if (card.type !== "EVENT") continue;

      // 獲取事件卡技能資料
      const skill = getEventSkill(card.id);
      if (!skill) {
        console.log(
          `[RuleValidator] Event card ${card.id} (${card.name}): no skill data`
        );
        continue;
      }

      // 檢查時機是否匹配當前階段
      if (!matchesTiming(skill.timing, state.phase)) {
        console.log(
          `[RuleValidator] Event ${card.name}: timing ${skill.timing} != phase ${state.phase}`
        );
        continue;
      }

      // 檢查技能是否可用（費用和條件）
      const availability = isSkillAvailable(state, player, skill);
      if (!availability.available) {
        console.log(
          `[RuleValidator] Event ${card.name}: not available - ${availability.reason}`
        );
        continue;
      }

      console.log(`[RuleValidator] Event ${card.name}: AVAILABLE!`);
      // 添加使用事件卡的動作
      actions.push({
        type: "USE_EVENT",
        cardInstanceId: card.instanceId,
      });
    }
  }

  /**
   * 添加可發動的技能動作
   */
  private static addSkillActions(
    state: EngineGameState,
    player: Player,
    actions: GameAction[]
  ): void {
    const playerState = getPlayerState(state, player);

    // 遍歷場上的角色卡
    for (const card of playerState.field) {
      if (card.type !== "CHARACTER") continue;

      // 獲取角色卡技能資料
      const skill = getCharacterSkill(card.id);
      if (!skill) continue;

      // 檢查時機是否匹配當前階段（使用角色位置判斷）
      // 例如：發球區的角色只能在發球階段發動技能
      if (!matchesTiming(skill.timing, state.phase)) continue;

      // 檢查技能是否可用（費用和條件）
      const availability = isSkillAvailable(state, player, skill);
      if (!availability.available) continue;

      // 添加發動技能的動作
      actions.push({
        type: "ACTIVATE_SKILL",
        cardInstanceId: card.instanceId,
      });
    }
  }
}
